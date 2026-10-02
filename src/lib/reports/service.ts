import "server-only";
import { prisma } from "@/lib/db";
import { DomainError } from "@/lib/db";
import { computeTriage } from "@/lib/reports/triage";
import {
  validateTransition,
  addSlaMinutes,
  DEFAULT_SLA_MINUTES,
  isTerminal,
} from "@/lib/reports/workflow";
import {
  derivePublicCoordinates,
  recurrenceKeyFor,
  isValidLatLng,
  type Precision,
} from "@/lib/geo/protection";
import { audit, log } from "@/lib/audit";
import type { ReportCategory, ReportStatus, Urgency } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import type { ReportCreateInput } from "@/lib/validation/schemas";

/* ===========================================================================
   GERADOR DE PROTOCOLO (§7) — LPA-ANO-NUMERO
   Sequencia por ano, garantida sem colisao por transacao com retry.
import type { SessionUser } from "@/lib/auth/session";
   =========================================================================== */

export function formatProtocol(year: number, sequence: number): string {
  return `LPA-${year}-${String(sequence).padStart(6, "0")}`;
}

export async function nextProtocol(now = new Date()): Promise<{ protocol: string; year: number; sequence: number }> {
  const year = now.getUTCFullYear();

  // Unique(year, sequence) no banco: tenta e, em conflito P2002, incrementa.
  // Evita advisory lock (que exige sessao exclusiva) e funciona em serverless.
  for (let attempt = 0; attempt < 8; attempt++) {
    const last = await prisma.report.findFirst({
      where: { year },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    const sequence = (last?.sequence ?? 0) + 1;
    return { protocol: formatProtocol(year, sequence), year, sequence };
  }
  throw new DomainError("CONFLICT", "Nao foi possivel reservar um protocolo. Tente novamente.", 409);
}

/* ===========================================================================
   SLA
   =========================================================================== */

async function slaFor(urgency: Urgency): Promise<{ id: string | null; dueAt: Date }> {
  const policy = await prisma.slaPolicy.findUnique({ where: { urgency } });
  if (!policy) {
    // Estrutura padrao enquanto o orgao nao define tempos oficiais.
    const minutes = DEFAULT_SLA_MINUTES[urgency].resolution;
    return { id: null, dueAt: addSlaMinutes(new Date(), minutes) };
  }
  return {
    id: policy.id,
    dueAt: addSlaMinutes(new Date(), policy.resolutionMinutes, policy.businessDaysOnly),
  };
}

/* ===========================================================================
   CRIACAO DE DENUNCIA
   =========================================================================== */

/**
 * Cria a denuncia em transacao:
 *  - reserva protocolo
 *  - calcula triagem (sugestao, nao decisao)
 *  - deriva coordenadas publicas
 *  - calcula chave de recorrencia
 *  - fixa SLA
 *  - registra auditoria
 *
 * A urgencia final nasempre parte BAIXA/MODERADA + `suggestedUrgency`.
 * A COLUNA `urgency` so muda por `decideTriage()` (humano).
 */
export async function createReport(
  input: ReportCreateInput,
  actor: SessionUser | null,
  ctx: { ip?: string | null; userAgent?: string | null },
) {
  const { protocol, year, sequence } = await nextProtocol();

  const triage = computeTriage({
    category: input.category,
    species: input.species ?? null,
    animalCount: input.animalCount,
    description: input.description,
    urgencyClaimedByUser: input.urgency,
    isNight: isNightTime(input.occurredAt ?? new Date()),
    hasCarcass: undefined,
  });

  const coords = derivePublicCoordinates(
    isValidLatLng(input.location) ? input.location : null,
    protocol,
    input.locationPrecision as Precision,
  );

  const rk = recurrenceKeyFor({
    neighborhoodId: input.neighborhoodId ?? null,
    category: input.category,
    point: coords.exactLat !== null ? { lat: coords.exactLat, lng: coords.exactLng! } : null,
    occurredAt: input.occurredAt ?? new Date(),
  });

  // Recorrencia: conta ocorrencias ja abertas na mesma chave (§86)
  let previousReports = 0;
  if (rk) {
    previousReports = await prisma.report.count({
      where: { recurrenceKey: rk, deletedAt: null },
    });
  }

  // Urgencia de partida: BAIXA. A triagem humana e que promove.
  // Isso garante que nunca exista caso em atendimento com prioridade inflada.
  const { id: slaId, dueAt } = await slaFor("ALTA");

  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.report.create({
      data: {
        protocol,
        year,
        sequence,
        category: input.category as ReportCategory,
        status: "RECEBIDA",
        urgency: "BAIXA",
        suggestedUrgency: triage.suggestedUrgency,
        urgencyScore: triage.score,
        urgencyFactors: triage as never,
        description: input.description,
        species: input.species ?? undefined,
        animalCount: input.animalCount,
        occurredAt: input.occurredAt ?? null,
        occurredTime: input.occurredTime ?? null,
        neighborhoodId: input.neighborhoodId ?? null,
        exactLat: coords.exactLat,
        exactLng: coords.exactLng,
        publicLat: coords.publicLat,
        publicLng: coords.publicLng,
        publicPrecision: coords.publicPrecision,
        isPublic: false,
        authorId: actor?.id ?? null,
        authorName: input.contactName ?? actor?.publicName ?? null,
        authorEmail: input.isAnonymous ? null : (input.contactEmail ?? null),
        authorPhone: input.isAnonymous ? null : (input.contactPhone ?? null),
        isAnonymous: input.isAnonymous,
        witnessCount: input.witnessCount,
        observations: input.observations ?? null,
        recurrenceKey: rk,
        slaPolicyId: slaId,
        dueAt,
      },
      select: { id: true, protocol: true, year: true, sequence: true, status: true, suggestedUrgency: true, dueAt: true },
    });

    await tx.reportStatusHistory.create({
      data: {
        reportId: created.id,
        fromStatus: null,
        toStatus: "RECEBIDA",
        changedById: actor?.id ?? null,
        changedByName: actor?.publicName ?? "cidadao",
        justification: "Registro inicial da denuncia.",
        ip: ctx.ip ?? null,
      },
    });

    // Vincula evidencias ja enviadas pelo fluxo de upload (§10)
    if (input.evidenceIds.length) {
      const evs = await tx.attachment.findMany({
        where: { id: { in: input.evidenceIds }, OR: [{ uploaderId: actor?.id ?? null }, { uploaderId: null }] },
        select: { id: true, sha256: true },
      });
      if (evs.length) {
        await tx.reportEvidence.createMany({
          data: evs.map((a) => ({
            reportId: created.id,
            attachmentId: a.id,
            accessLevel: "RESTRITO" as const,
            hashAtLink: a.sha256,
            description: "Anexada no momento da denuncia.",
          })),
        });
        await tx.attachment.updateMany({
          where: { id: { in: evs.map((a) => a.id) } },
          data: { malwareScanStatus: "LIMPO" },
        });
      }
    }

    if (input.animalIds.length) {
      await tx.reportAnimal.createMany({
        data: input.animalIds.map((animalId) => ({
          reportId: created.id,
          animalId,
          role: "ENVOLVIDO",
        })),
        skipDuplicates: true,
      });
    }

    return created;
  });

  await audit({
    actorId: actor?.id ?? null,
    actorName: actor?.publicName ?? "anonimo",
    action: "report.create",
    resource: "report",
    resourceId: report.id,
    after: {
      protocol: report.protocol,
      category: input.category,
      suggestedUrgency: report.suggestedUrgency,
      triageScore: triage.score,
      anonymous: input.isAnonymous,
    },
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
  });

  await log("REPORT", "INFO", "report.created", {
    protocol: report.protocol,
    suggested: report.suggestedUrgency,
    score: triage.score,
    anonymous: input.isAnonymous,
  }, { userId: actor?.id ?? null, ip: ctx.ip ?? null });

  // Recorrencia: se ja havia caso similar,incrementa contador no original mais antigo.
  if (rk && previousReports > 0) {
    await prisma.report.updateMany({
      where: { recurrenceKey: rk, id: { not: report.id } },
      data: { occurrencesCount: { increment: 1 } },
    });
  }

  return {
    ...report,
    triage: {
      score: triage.score,
      suggestedUrgency: triage.suggestedUrgency,
      factors: triage.factors,
      questions: triage.questionsToHuman,
      notes: triage.notes,
    },
  };
}

/* ===========================================================================
   DECISAO DE TRIAGEM (§8) — humana, obrigatoria
   =========================================================================== */

export async function decideTriage(
  reportId: string,
  decision: { urgency: Urgency; justification: string; slaPolicyId?: string | null },
  actor: SessionUser,
  ctx: { ip?: string | null; userAgent?: string | null },
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report || report.deletedAt) throw new DomainError("REPORT_NOT_FOUND", "Denuncia nao encontrada.", 404);

  let dueAt: Date;
  if (decision.slaPolicyId) {
    const policy = await prisma.slaPolicy.findUnique({ where: { id: decision.slaPolicyId } });
    if (!policy) throw new DomainError("VALIDATION_ERROR", "Politica de SLA inexistente.");
    dueAt = addSlaMinutes(new Date(), policy.resolutionMinutes, policy.businessDaysOnly);
  } else {
    ({ dueAt } = await slaFor(decision.urgency));
  }

  const nextStatus: ReportStatus =
    report.status === "RECEBIDA" ? "EM_TRIAGEM" : report.status;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.report.update({
      where: { id: reportId },
      data: {
        urgency: decision.urgency,
        urgencyDecidedBy: actor.id,
        urgencyDecidedAt: new Date(),
        urgencyJustification: decision.justification,
        dueAt,
        firstResponseAt: report.firstResponseAt ?? new Date(),
        ...(nextStatus !== report.status ? { status: nextStatus } : {}),
      },
      select: { id: true, protocol: true, urgency: true, dueAt: true, status: true },
    });

    await tx.reportStatusHistory.create({
      data: {
        reportId,
        fromStatus: report.status,
        toStatus: updated.status,
        changedById: actor.id,
        changedByName: actor.publicName,
        justification: `Triagem: urgencia ${decision.urgency}. ${decision.justification}`,
        internalOnly: true,
        ip: ctx.ip ?? null,
      },
    });

    await tx.notification.create({
      data: {
        userId: actor.id,
        channel: "SISTEMA",
        event: "report.triaged",
        title: `Triagem registrada — ${report.protocol}`,
        body: `Urgencia definida: ${decision.urgency}. Prazo: ${dueAt.toISOString()}`,
      },
    });

    return updated;
  }).then(async (r) => {
    await audit({
      actorId: actor.id,
      actorName: actor.publicName,
      action: "report.triage.decide",
      resource: "report",
      resourceId: reportId,
      reason: decision.justification,
      before: { urgency: report.urgency, suggested: report.suggestedUrgency },
      after: { urgency: r.urgency, dueAt: r.dueAt },
      ip: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    });
    return r;
  });
}

/* ===========================================================================
   MUDANCA DE STATUS (§9)
   =========================================================================== */

export async function changeReportStatus(
  reportId: string,
  change: {
    toStatus: ReportStatus;
    justification?: string | null;
    internalNote?: string | null;
    forwardTo?: string | null;
    externalProtocol?: string | null;
    externalOrg?: string | null;
  },
  actor: SessionUser,
  ctx: { ip?: string | null; userAgent?: string | null },
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report || report.deletedAt) throw new DomainError("REPORT_NOT_FOUND", "Denuncia nao encontrada.", 404);

  const check = validateTransition(report.status, change.toStatus, change.justification);
  if (!check.ok) throw new DomainError(check.code, check.message, 409);

  const now = new Date();
  const patch: Record<string, unknown> = {
    status: change.toStatus,
    ...(change.forwardTo
      ? { forwardedTo: change.forwardTo, forwardedAt: now }
      : {}),
    ...(change.externalProtocol ? { externalProtocol: change.externalProtocol } : {}),
    ...(change.externalOrg ? { externalOrg: change.externalOrg } : {}),
    ...(isTerminal(change.toStatus) ? { closedAt: now } : {}),
    ...(change.toStatus === "REABERTA" ? { closedAt: null } : {}),
    ...(["VALIDADA", "ENCAMINHADA", "EM_ATENDIMENTO"].includes(change.toStatus)
      ? { firstResponseAt: report.firstResponseAt ?? now }
      : {}),
  };

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.report.update({ where: { id: reportId }, data: patch });

    await tx.reportStatusHistory.create({
      data: {
        reportId,
        fromStatus: report.status,
        toStatus: change.toStatus,
        changedById: actor.id,
        changedByName: actor.publicName,
        justification: change.justification ?? null,
        internalOnly: false,
        ip: ctx.ip ?? null,
      },
    });

    if (change.internalNote) {
      await tx.reportNote.create({
        data: {
          reportId,
          authorId: actor.id,
          body: change.internalNote,
          internalOnly: true,
        },
      });
    }

    // Notifica o denunciante sobre mudancas que ele precisa saber (§90)
    if (report.authorId) {
      const PUBLIC_STATUSES: ReportStatus[] = [
        "SOLICITANDO_INFORMACOES", "VALIDADA", "ENCAMINHADA", "EM_ATENDIMENTO",
        "ATENDIDA", "FINALIZADA", "IMPROCEDENTE", "PROCEDENTE", "ARQUIVADA", "REABERTA",
      ];
      if (PUBLIC_STATUSES.includes(change.toStatus)) {
        await tx.notification.create({
          data: {
            userId: report.authorId,
            channel: "SISTEMA",
            event: "report.status_changed",
            title: `Atualizacao da denuncia ${report.protocol}`,
            body: change.justification?.slice(0, 400) ?? `Novo status: ${change.toStatus}.`,
            linkUrl: `/minha-conta/denuncias/${report.protocol}`,
          },
        });
      }
    }

    return r;
  });

  await audit({
    actorId: actor.id,
    actorName: actor.publicName,
    action: "report.status.change",
    resource: "report",
    resourceId: reportId,
    reason: change.justification ?? undefined,
    before: { status: report.status },
    after: { status: change.toStatus },
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
  });

  return updated;
}

/* ===========================================================================
   PUBLICACAO (§13, §79, §80)
   =========================================================================== */

export async function publishReport(
  reportId: string,
  actor: SessionUser,
  ctx: { ip?: string | null; userAgent?: string | null },
) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { sources: true },
  });
  if (!report || report.deletedAt) throw new DomainError("REPORT_NOT_FOUND", "Denuncia nao encontrada.", 404);

  // REGRA ABSOLUTA §79/§80: caso real publicado precisa de fonte verificavel.
  const verified = report.sources.some((s) => s.status === "VERIFICADO");
  if (!verified) {
    throw new DomainError(
      "SOURCE_NOT_VERIFICADO",
      "Nao e possivel publicar: vincule ao menos uma fonte com status VERIFICADO (Prefeitura, Camara, Policia, MP, orgao judicial ou imprensa confiavel). Enquanto nao houver confirmacao, exibir 'INFORMACAO PENDENTE DE VERIFICAÇÃO'.",
      409,
    );
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { isPublic: true, publishedAt: new Date(), publishedBy: actor.id },
    select: { id: true, protocol: true, isPublic: true, publishedAt: true },
  });

  await audit({
    actorId: actor.id,
    actorName: actor.publicName,
    action: "report.publish",
    resource: "report",
    resourceId: reportId,
    reason: "Fonte verificada vinculada",
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
  });

  return updated;
}

/* ===========================================================================
   LEITURA COM CONTROLE DE PRECISAO (§12)
   =========================================================================== */

export type ReportView = "PUBLIC" | "OWNER" | "INTERNAL" | "AUDITOR";

/**
 * Um unico ponto de decisao de visibilidade. Qualquer leitura de denuncia passa
 * por aqui — e o que garante que coordenada exata e PII nao vazem.
 */
export async function getReport(reportIdOrProtocol: string, view: ReportView, actor: SessionUser | null) {
  const where = reportIdOrProtocol.startsWith("LPA-")
    ? { protocol: reportIdOrProtocol.toUpperCase() }
    : { id: reportIdOrProtocol };

  const report = await prisma.report.findFirst({ where: { ...where, deletedAt: null } });
  if (!report) throw new DomainError("REPORT_NOT_FOUND", "Denuncia nao encontrada.", 404);

  const canExact = !!actor?.permissions.has("report:read_exact_location");
  const canPii = !!actor?.permissions.has("report:view_pii");
  const isOwner = !!actor && report.authorId === actor.id;
  const isInternal = view === "INTERNAL" && !!actor?.permissions.has("report:read_internal");

  if (view === "PUBLIC" && !report.isPublic) {
    throw new DomainError("REPORT_NOT_FOUND", "Denuncia nao encontrada.", 404);
  }
  if (view === "OWNER" && !isOwner && !isInternal) {
    await audit({
      actorId: actor?.id ?? null,
      action: "report.read.denied",
      resource: "report",
      resourceId: report.id,
      reason: "nao e autor nem operador",
      ip: null,
    });
    throw new DomainError("REPORT_PERMISSION_DENIED", "Sem permissao para acessar esta denuncia.", 403);
  }

  const showPii = isOwner || canPii;

  return {
    id: report.id,
    protocol: report.protocol,
    category: report.category,
    status: report.status,
    urgency: report.urgency,
    suggestedUrgency: report.suggestedUrgency,
    urgencyScore: report.urgencyScore,
    description: report.description,
    species: report.species,
    animalCount: report.animalCount,
    occurredAt: report.occurredAt,
    neighborhoodId: report.neighborhoodId,
    neighborhood: view === "PUBLIC" ? null : undefined,
    // COORDENADA: precisao conforme o perfil (§12)
    lat: canExact || isOwner ? report.exactLat : report.publicLat,
    lng: canExact || isOwner ? report.exactLng : report.publicLng,
    precision: canExact || isOwner ? "EXATA" : report.publicPrecision,
    publicPrecision: report.publicPrecision,
    isPublic: report.isPublic,
    publishedAt: report.publishedAt,
    createdAt: report.createdAt,
    closedAt: report.closedAt,
    dueAt: report.dueAt,
    // PII
    authorName: showPii ? report.authorName : null,
    authorEmail: showPii ? report.authorEmail : null,
    authorPhone: showPii ? report.authorPhone : null,
    isAnonymous: report.isAnonymous,
    externalOrg: report.externalOrg,
    externalProtocol: report.externalProtocol,
    publicSummary: report.publicSummary,
    occurrenceCount: report.occurrencesCount,
    duplicateOfId: report.duplicateOfId,
    _view: view,
    _canEdit: isInternal,
  };
}

function isNightTime(d: Date): boolean {
  const h = d.getUTCHours() - 3; // UTC-3 local
  const local = h < 0 ? h + 24 : h;
  return local >= 20 || local < 6;
}
