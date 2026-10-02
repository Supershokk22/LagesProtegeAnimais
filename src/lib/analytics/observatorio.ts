import "server-only";
import { prisma } from "@/lib/db";
import { aggregate } from "@/lib/geo/protection";
import { PERMISSIONS, type PermissionKey } from "@/lib/auth/permissions";

/**
 * ============================================================================
 * OBSERVATORIO / INDICADORES (§34-§36)
 * ============================================================================
 *
 * REGRA §100 TRANSPARENCIA: "Nunca mostrar dados pessoais. Mostrar somente dados
 * agregados, anonimizados, revisados."
 *
 * Implementacao:
 *  - Nenhuma funcao deste arquivo retorna nome, e-mail, telefone ou descricao
 *    livre. Apenas contagens, percentuais e chaves geograficas agregadas.
 *  - Celulas com n < MIN_CELL_SIZE sao combinadas com a vizinha (k-anonimato
 *    aproximada) para impedir reidentificacao por local e data.
 *  - Todo acesso a dado interno (com PII potencial) exige permissao separada.
 */

const MIN_CELL_SIZE = 5;

/* ------------------------------------------------------------------ KPIs */

export type KpiBundle = {
  generatedAt: Date;
  period: { from: Date; to: Date };
  reportsReceived: number;
  reportsClosed: number;
  reportsOpen: number;
  criticalOpen: number;
  overdue: number;
  avgFirstResponseHours: number | null;
  avgResolutionHours: number | null;
  byCategory: Array<{ category: string; count: number }>;
  byUrgency: Array<{ urgency: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byNeighborhood: Array<{ neighborhood: string; count: number; suppressed: boolean }>;
  adoptions: number;
  reunions: number;
  rescues: number;
  lostActive: number;
  foundActive: number;
  animalsAvailable: number;
  campaignsActive: number;
  castrations: number;
  vaccinations: number;
  ongsPartner: number;
  verifiedProtectors: number;
  volunteers: number;
};

export async function kpis(
  from: Date,
  to: Date,
  viewer: { permissions: ReadonlySet<PermissionKey> } | null,
): Promise<KpiBundle> {
  const canInternal = !!viewer?.permissions.has(PERMISSIONS.ANALYTICS_INTERNAL);

  const where = { deletedAt: null, createdAt: { gte: from, lte: to } };

  const [
    received, closed, open, criticalOpen, overdue,
    byCategory, byUrgency, byStatus, byNeighborhood,
    adoptions, reunions, lostActive, foundActive, animalsAvailable,
    campaignsActive, castrations, vaccinations,
    ongsPartner, verifiedProtectors, volunteers,
  ] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.count({ where: { ...where, closedAt: { gte: from, lte: to } } }),
    prisma.report.count({ where: { deletedAt: null, closedAt: null } }),
    prisma.report.count({
      where: {
        deletedAt: null,
        closedAt: null,
        urgency: { in: ["URGENTE", "CRITICA"] },
      },
    }),
    prisma.report.count({ where: { deletedAt: null, closedAt: null, dueAt: { lt: new Date() } } }),

    prisma.report.groupBy({ by: ["category"], where, _count: { _all: true } }),
    prisma.report.groupBy({ by: ["urgency"], where, _count: { _all: true } }),
    prisma.report.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.report.groupBy({ by: ["neighborhoodId"], where, _count: { _all: true } }),

    prisma.adoption.count({ where: { adoptedAt: { gte: from, lte: to }, status: "ADOCAO_CONCLUIDA" } }),
    prisma.lostAnimal.count({ where: { status: "RESOLVIDO", resolvedAt: { gte: from, lte: to } } }),
    prisma.lostAnimal.count({ where: { deletedAt: null, status: "ATIVO" } }),
    prisma.foundAnimal.count({ where: { deletedAt: null, status: "ATIVO" } }),
    prisma.animal.count({ where: { deletedAt: null, status: "DISPONIVEL" } }),
    prisma.campaign.count({ where: { status: "ATIVA" } }),
    prisma.animal.count({ where: { deletedAt: null, isNeutered: true, updatedAt: { gte: from, lte: to } } }),
    prisma.animal.count({ where: { deletedAt: null, isVaccinated: true, updatedAt: { gte: from, lte: to } } }),
    prisma.organization.count({
      where: { kind: "ONG", verificationStatus: "VERIFICADO", deletedAt: null },
    }),
    prisma.protector.count({ where: { status: "VERIFICADO" } }),
    prisma.user.count({ where: { volunteerProfile: { isNot: null }, deletedAt: null } }),
  ]);

  // Respostas: media sobre o que foi efetivamente registrado.
  const responded = await prisma.report.findMany({
    where: { deletedAt: null, firstResponseAt: { not: null }, createdAt: { gte: from, lte: to } },
    select: { createdAt: true, firstResponseAt: true, closedAt: true },
    take: 5000,
  });

  const avgFirstResponse = responded.length
    ? responded.reduce((acc, r) => acc + (r.firstResponseAt!.getTime() - r.createdAt.getTime()), 0) /
      responded.length / 3_600_000
    : null;

  const closedOnes = responded.filter((r) => r.closedAt);
  const avgResolution = closedOnes.length
    ? closedOnes.reduce((acc, r) => acc + (r.closedAt!.getTime() - r.createdAt.getTime()), 0) /
      closedOnes.length / 3_600_000
    : null;

  const names = await prisma.neighborhood.findMany({
    where: { id: { in: byNeighborhood.map((b) => b.neighborhoodId).filter((x): x is string => !!x) } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(names.map((n) => [n.id, n.name]));

  return {
    generatedAt: new Date(),
    period: { from, to },
    reportsReceived: received,
    reportsClosed: closed,
    reportsOpen: open,
    criticalOpen: criticalOpen,
    overdue,
    avgFirstResponseHours: avgFirstResponse === null ? null : round1(avgFirstResponse),
    avgResolutionHours: avgResolution === null ? null : round1(avgResolution),
    byCategory: byCategory.map((c) => ({ category: c.category, count: c._count._all })),
    byUrgency: byUrgency.map((c) => ({ urgency: c.urgency, count: c._count._all })),
    byStatus: byStatus.map((c) => ({ status: c.status, count: c._count._all })),
    byNeighborhood: applyKAnonymity(
      byNeighborhood.map((b) => ({
        neighborhood: b.neighborhoodId ? (nameMap.get(b.neighborhoodId) ?? "Nao informado") : "Nao informado",
        count: b._count._all,
      })),
      canInternal ? 1 : MIN_CELL_SIZE,
    ),
    adoptions,
    reunions,
    rescues: await prisma.report.count({
      where: { deletedAt: null, category: { in: ["ANIMAL_FERIDO", "SITUACAO_DE_RISCO", "ATROPELAMENTO"] }, closedAt: { gte: from, lte: to } },
    }),
    lostActive,
    foundActive,
    animalsAvailable,
    campaignsActive,
    castrations,
    vaccinations,
    ongsPartner,
    verifiedProtectors,
    volunteers,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * k-anonimato por bucket: celulas abaixo do minimo sao fundidas em "Outros".
 * Impede que "1 denuncia no bairro X" revele um caso isolado identificavel.
 */
function applyKAnonymity(
  rows: Array<{ neighborhood: string; count: number }>,
  min: number,
): Array<{ neighborhood: string; count: number; suppressed: boolean }> {
  if (min <= 1) return rows.map((r) => ({ ...r, suppressed: false }));
  const visible = rows.filter((r) => r.count >= min).sort((a, b) => b.count - a.count);
  const hidden = rows.filter((r) => r.count < min);
  const out = visible.map((r) => ({ ...r, suppressed: false }));
  if (hidden.length) {
    out.push({
      neighborhood: "Outros bairros (amostra insuficiente)",
      count: hidden.reduce((a, b) => a + b.count, 0),
      suppressed: true,
    });
  }
  return out;
}

/* ------------------------------------------------------- serie temporal */

export async function monthlySeries(
  months = 12,
): Promise<Array<{ period: string; total: number; closed: number; critical: number }>> {
  const now = new Date();
  const out: Array<{ period: string; total: number; closed: number; critical: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));
    const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const [total, closed, critical] = await Promise.all([
      prisma.report.count({ where: { createdAt: { gte: d, lte: end }, deletedAt: null } }),
      prisma.report.count({ where: { createdAt: { gte: d, lte: end }, closedAt: { gte: d, lte: end }, deletedAt: null } }),
      prisma.report.count({ where: { createdAt: { gte: d, lte: end }, urgency: { in: ["URGENTE", "CRITICA"] }, deletedAt: null } }),
    ]);
    out.push({ period, total, closed, critical });
  }
  return out;
}

/* ------------------------------------------------------- mapa / heatmap */

export type PublicMapPoint = {
  key: string;
  category: string;
  status: string;
  period: string;
  count: number;
  lat: number;
  lng: number;
  /** Aggregated = safe for public. */
  precision: "AGREGADA";
};

/**
 * Pontos do mapa publico: SOMENTE celulas agregadas com n >= MIN_CELL_SIZE.
 * A coordenada e o centroide da grade — nunca o ponto do relato.
 */
export async function publicHeatmap(
  from: Date,
  to: Date,
  minCount = MIN_CELL_SIZE,
): Promise<PublicMapPoint[]> {
  const rows = await prisma.$queryRaw<
    Array<{ lat: number; lng: number; category: string; status: string; period: string; count: bigint }>
  >`
    SELECT
      ROUND(AVG("public_lat")::numeric, 4)::float8 AS lat,
      ROUND(AVG("public_lng")::numeric, 4)::float8 AS lng,
      "category"::text AS category,
      "status"::text   AS status,
      TO_CHAR("created_at", 'YYYY-MM') AS period,
      COUNT(*)::bigint AS count
    FROM reports
    WHERE "deleted_at" IS NULL
      AND "created_at" BETWEEN ${from} AND ${to}
      AND "public_lat" IS NOT NULL
      AND "is_public" = true
    GROUP BY 3,4,5
    HAVING COUNT(*) >= ${minCount}
    ORDER BY count DESC
    LIMIT 2000
  `;

  return rows.map((r) => ({
    key: `${r.category}|${r.status}|${r.period}|${r.lat}|${r.lng}`,
    category: r.category,
    status: r.status,
    period: r.period,
    count: Number(r.count),
    lat: r.lat,
    lng: r.lng,
    precision: "AGREGADA" as const,
  }));
}

/* ------------------------------------------------------------ painel SLA */

export type SlaBoard = {
  rows: Array<{
    protocol: string;
    urgency: string;
    status: string;
    dueAt: Date | null;
    hoursRemaining: number | null;
    overdue: boolean;
    assignee: string | null;
  }>;
  totals: { overdue: number; dueSoon: number; onTime: number };
};

export async function slaBoard(assigneeId?: string): Promise<SlaBoard> {
  const now = Date.now();
  const reports = await prisma.report.findMany({
    where: {
      deletedAt: null,
      closedAt: null,
      ...(assigneeId
        ? { assignments: { some: { operatorId: assigneeId, active: true } } }
        : {}),
    },
    select: {
      protocol: true,
      urgency: true,
      status: true,
      dueAt: true,
      assignments: {
        where: { active: true },
        select: { operator: { select: { publicName: true } } },
        take: 1,
      },
    },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }],
    take: 300,
  });

  const rows = reports.map((r) => {
    const hoursRemaining = r.dueAt ? (r.dueAt.getTime() - now) / 3_600_000 : null;
    return {
      protocol: r.protocol,
      urgency: r.urgency,
      status: r.status,
      dueAt: r.dueAt,
      hoursRemaining: hoursRemaining === null ? null : Math.round(hoursRemaining * 10) / 10,
      overdue: (hoursRemaining ?? 1) < 0,
      assignee: r.assignments[0]?.operator?.publicName ?? null,
    };
  });

  return {
    rows,
    totals: {
      overdue: rows.filter((r) => r.overdue).length,
      dueSoon: rows.filter((r) => r.hoursRemaining !== null && r.hoursRemaining >= 0 && r.hoursRemaining <= 24).length,
      onTime: rows.filter((r) => r.hoursRemaining !== null && r.hoursRemaining > 24).length,
    },
  };
}

/* --------------------------------------------------- relatorio institucional */

export async function buildInstitutionalReport(
  from: Date,
  to: Date,
): Promise<{
  cover: { title: string; period: string; generatedAt: string; methodology: string };
  executiveSummary: string[];
  indicators: Record<string, number | string | null>;
  series: Awaited<ReturnType<typeof monthlySeries>>;
  distribution: Awaited<ReturnType<typeof kpis>>;
  limitations: string[];
}> {
  const k = await kpis(from, to, null);
  const series = await monthlySeries(12);

  const topCategory = [...k.byCategory].sort((a, b) => b.count - a.count)[0];
  const topNeighborhood = [...k.byNeighborhood].sort((a, b) => b.count - a.count)[0];

  return {
    cover: {
      title: "Relatorio Institucional de Protecao Animal",
      period: `${from.toISOString().slice(0, 10)} a ${to.toISOString().slice(0, 10)}`,
      generatedAt: new Date().toISOString(),
      methodology:
        "Dados consolidados exclusivamente a partir de registrosprotocolados na plataforma. " +
        "Casos reais publicados exigem fonte verificavel (Prefeitura, Camara Municipal, Policia, " +
        "Ministerio Publico, orgao judicial, IBAMA, orgao estadual/federal ou imprensa confiavel). " +
        "Informacoes sem confirmacao sao exibidas como 'INFORMACAO PENDENTE DE VERIFICACAO'. " +
        "Distribuicao espacial e agregada por grade; coordenadas de relato nunca sao publicadas.",
    },
    executiveSummary: [
      `Foram registradas ${k.reportsReceived} denuncia(s) no periodo, com ${k.reportsClosed} encerramento(s).`,
      k.overdue > 0
        ? `${k.overdue} caso(s) estao fora do prazo de atendimento definido em SLA.`
        : "Nenhum caso em aberto fora do prazo no periodo.",
      topCategory ? `A categoria mais recorrente foi ${topCategory.category} (${topCategory.count} registro(s)).` : "Sem dados de categoria.",
      topNeighborhood && !topNeighborhood.suppressed
        ? `A maior concentracao esta em ${topNeighborhood.neighborhood} (${topNeighborhood.count}).`
        : "A distribuicao por bairro foi suprimida por amostra insuficiente (k-anonimato).",
      `${k.adoptions} adocao(oes) concluida(s) e ${k.lostActive} anuncio(s) de animal perdido ativo(s).`,
    ],
    indicators: {
      "Denuncias recebidas": k.reportsReceived,
      "Denuncias encerradas": k.reportsClosed,
      "Em aberto": k.reportsOpen,
      "Urgentes/criticas em aberto": k.criticalOpen,
      "Fora do prazo": k.overdue,
      "Tempo medio de primeira resposta (h)": k.avgFirstResponseHours,
      "Tempo medio de resolucao (h)": k.avgResolutionHours,
      "Adocoes": k.adoptions,
      "Reencontros": k.reunions,
      "Animais resgatados": k.rescues,
      "Castracoes registradas": k.castrations,
      "Vacinacoes registradas": k.vaccinations,
      "ONGs verificadas": k.ongsPartner,
      "Protetores verificados": k.verifiedProtectors,
      "Voluntarios": k.volunteers,
    },
    series,
    distribution: k,
    limitations: [
      "Dados de denuncia nao equivalem a confirmacao de fato. Casos so sao publicados com fonte verificavel.",
      "Numeros refletem registros no sistema; subnotificacao e sub-registro sao provaveis e nao sao medidos.",
      "Distribuicao espacial usa agregacao por grade; a leitura de bairro e ordem de grandeza, nao contagem precisa.",
      "SLA e' aplicado a partir de politica estrutural; os tempos oficiais devem ser definidos pelo orgao competente.",
    ],
  };
}


export { aggregate };