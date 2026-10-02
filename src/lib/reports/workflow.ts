import type { ReportStatus, Urgency } from "@/generated/prisma/client";

/**
 * ============================================================================
 * MAQUINA DE ESTADOS DA DENUNCIA (§9)
 * ============================================================================
 * Historico completo e imutavel. Nenhum status e' pulado sem justificativa.
 * Mudanca de status exige `report:update_status` e grava ReportStatusHistory.
 */

export const STATUS_FLOW: Record<ReportStatus, ReportStatus[]> = {
  RECEBIDA: ["AGUARDANDO_TRIAGEM", "VALIDADA", "ARQUIVADA"],
  AGUARDANDO_TRIAGEM: ["EM_TRIAGEM", "ARQUIVADA"],
  EM_TRIAGEM: [
    "SOLICITANDO_INFORMACOES",
    "VALIDADA",
    "ENCAMINHADA",
    "IMPROCEDENTE",
    "ARQUIVADA",
  ],
  SOLICITANDO_INFORMACOES: ["EM_TRIAGEM", "VALIDADA", "ARQUIVADA"],
  VALIDADA: ["ENCAMINHADA", "IMPROCEDENTE", "ARQUIVADA", "REABERTA"],
  ENCAMINHADA: ["EM_ATENDIMENTO", "AGUARDANDO_ORGAO_RESPONSAVEL", "EM_FISCALIZACAO", "EM_INVESTIGACAO"],
  EM_ATENDIMENTO: ["ATENDIDA", "FINALIZADA", "AGUARDANDO_ORGAO_RESPONSAVEL", "REABERTA"],
  EM_FISCALIZACAO: ["EM_INVESTIGACAO", "ATENDIDA", "FINALIZADA", "AGUARDANDO_ORGAO_RESPONSAVEL"],
  EM_INVESTIGACAO: ["PROCEDENTE", "IMPROCEDENTE", "ATENDIDA", "FINALIZADA"],
  AGUARDANDO_ORGAO_RESPONSAVEL: ["EM_ATENDIMENTO", "EM_INVESTIGACAO", "FINALIZADA"],
  ATENDIDA: ["FINALIZADA", "REABERTA"],
  PROCEDENTE: ["FINALIZADA", "REABERTA"],
  IMPROCEDENTE: ["FINALIZADA", "REABERTA"],
  ARQUIVADA: ["REABERTA"],
  REABERTA: ["AGUARDANDO_TRIAGEM", "EM_TRIAGEM", "VALIDADA", "ARQUIVADA"],
  FINALIZADA: ["REABERTA"],
};

export const TERMINAL_STATUSES: ReportStatus[] = ["FINALIZADA", "ARQUIVADA"];

export function isTerminal(s: ReportStatus): boolean {
  return TERMINAL_STATUSES.includes(s);
}

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return STATUS_FLOW[from]?.includes(to) ?? false;
}

export function transitionsFrom(s: ReportStatus): ReportStatus[] {
  return STATUS_FLOW[s] ?? [];
}

/** Transicoes que exigem justificativa escrita obrigatoria. */
export const JUSTIFICATION_REQUIRED: ReportStatus[] = [
  "IMPROCEDENTE",
  "PROCEDENTE",
  "ARQUIVADA",
  "REABERTA",
  "AGUARDANDO_ORGAO_RESPONSAVEL",
];

export type TransitionCheck =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function validateTransition(
  from: ReportStatus,
  to: ReportStatus,
  justification?: string | null,
): TransitionCheck {
  if (from === to) {
    return { ok: false, code: "REPORT_STATUS_UNCHANGED", message: "Status informado e igual ao atual." };
  }
  if (!canTransition(from, to)) {
    return {
      ok: false,
      code: "REPORT_INVALID_TRANSITION",
      message: `Transicao nao permitida: ${from} -> ${to}. Permitidas: ${transitionsFrom(from).join(", ")}`,
    };
  }
  if (JUSTIFICATION_REQUIRED.includes(to) && !justification?.trim()) {
    return {
      ok: false,
      code: "REPORT_JUSTIFICATION_REQUIRED",
      message: `Transicao para ${to} exige justificativa escrita.`,
    };
  }
  return { ok: true };
}

/* ===========================================================================
   SLA (§84-§85)
   Os tempos reais devem ser definidos pelo orgao competente. Os valores abaixo
   sao ESTRUTURA, nao politica publica: o seed grava `definedByOrg = null`.
   =========================================================================== */

export const DEFAULT_SLA_MINUTES: Record<Urgency, { firstResponse: number; resolution: number }> = {
  CRITICA: { firstResponse: 60, resolution: 24 * 60 },
  URGENTE: { firstResponse: 4 * 60, resolution: 3 * 24 * 60 },
  ALTA: { firstResponse: 24 * 60, resolution: 7 * 24 * 60 },
  MODERADA: { firstResponse: 3 * 24 * 60, resolution: 15 * 24 * 60 },
  BAIXA: { firstResponse: 7 * 24 * 60, resolution: 30 * 24 * 60 },
};

const UTC_OFFSET_BRANCH = 3; // America/Sao_Paulo (UTC-3). Sem DST desde 2019.

function isBusinessDay(d: Date): boolean {
  const day = d.getUTCDay();
  return day !== 0 && day !== 6;
}

/**
 * Prazo em minutos uteis. `businessDaysOnly=true` pula sabado/domingo
 * (somente a hora; feriados{externos} sao um TODO: conecte um calendario
 * oficial em src/lib/calendar/feriados.ts).
 */
export function addSlaMinutes(from: Date, minutes: number, businessDaysOnly = true): Date {
  const cursor = new Date(from.getTime());
  if (!businessDaysOnly) return new Date(cursor.getTime() + minutes * 60_000);

  let remaining = minutes * 60_000; // em ms
  const HOUR_START_UTC = 9 + UTC_OFFSET_BRANCH; // 09:00 local = 12:00 UTC
  const HOUR_END_UTC = 17 + UTC_OFFSET_BRANCH;

  while (remaining > 0) {
    if (!isBusinessDay(cursor)) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(HOUR_START_UTC, 0, 0, 0);
      continue;
    }
    const dayStart = Date.UTC(
      cursor.getUTCFullYear(),
      cursor.getUTCMonth(),
      cursor.getUTCDate(),
      HOUR_START_UTC,
    );
    const dayEnd = Date.UTC(
      cursor.getUTCFullYear(),
      cursor.getUTCMonth(),
      cursor.getUTCDate(),
      HOUR_END_UTC,
    );
    if (cursor.getTime() < dayStart) cursor.setTime(dayStart);
    if (cursor.getTime() >= dayEnd) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(HOUR_START_UTC, 0, 0, 0);
      continue;
    }
    const available = dayEnd - cursor.getTime();
    if (available >= remaining) {
      cursor.setTime(cursor.getTime() + remaining);
      remaining = 0;
    } else {
      remaining -= available;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(HOUR_START_UTC, 0, 0, 0);
    }
  }
  return cursor;
}

export function isOverdue(dueAt: Date | null, now = new Date()): boolean {
  return !!dueAt && dueAt.getTime() < now.getTime();
}

/** Tempo medio de atendimento em horas — KPI do observatorio (§35). */
export function resolutionHours(from: Date, to: Date | null): number | null {
  if (!to) return null;
  return (to.getTime() - from.getTime()) / 3_600_000;
}

/** Rotulo publico seguro (§97): nunca chamar alguem de "agressor" antes do orgao. */
export function neutralizeLabel(term: string): string {
  const map: Record<string, string> = {
    agressor: "pessoa mencionada na denuncia",
    culpado: "pessoa mencionada na denuncia",
    infrator: "pessoa mencionada na denuncia",
    ladrão: "pessoa mencionada na denuncia",
   reuse: "pessoa mencionada na denuncia",
  };
  return map[term.toLowerCase()] ?? term;
}