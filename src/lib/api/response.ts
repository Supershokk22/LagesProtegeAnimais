import { z } from "zod";
import { DomainError } from "@/lib/db";

/**
 * ============================================================================
 * CODIGOS DE ERRO (§53) + envelope de resposta da API (§51-§52)
 * ============================================================================
 * Contrato: `{ ok:false, error: { code, message, details?, requestId } }`
 * Sucesso: `{ ok:true, data, meta? }`
 */

export const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: [401, "Credenciais invalidas."],
  AUTH_ACCOUNT_LOCKED: [423, "Conta temporariamente bloqueada por tentativas de acesso."],
  AUTH_2FA_REQUIRED: [401, "Autenticacao em dois fatores necessaria."],
  AUTH_2FA_INVALID: [401, "Codigo de verificacao invalido."],
  AUTH_UNAUTHENTICATED: [401, "Autenticacao necessaria."],
  AUTH_FORBIDDEN: [403, "Voce nao tem permissao para esta operacao."],
  AUTH_SESSION_EXPIRED: [401, "Sessao expirada. Entre novamente."],
  AUTH_PASSWORD_POLICY: [422, "Senha nao atende a politica de seguranca."],

  REPORT_NOT_FOUND: [404, "Denuncia nao encontrada."],
  REPORT_PERMISSION_DENIED: [403, "Sem permissao para acessar esta denuncia."],
  REPORT_INVALID_TRANSITION: [409, "Transicao de status nao permitida."],
  REPORT_JUSTIFICATION_REQUIRED: [422, "Justificativa obrigatoria para esta transicao."],

  VALIDATION_ERROR: [422, "Dados invalidos."],
  NOT_FOUND: [404, "Recurso nao encontrado."],
  CONFLICT: [409, "Conflito de estado."],
  RATE_LIMIT_EXCEEDED: [429, "Limite de requisicoes excedido. Tente novamente em instantes."],
  UPLOAD_REJECTED: [415, "Arquivo rejeitado na validacao."],
  UPLOAD_TOO_LARGE: [413, "Arquivo maior que o limite permitido."],
  EVIDENCE_INTEGRITY_FAILURE: [409, "Falha de integridade da evidencia. Arquivo alterado."],
  RESTRICTED_ACCESS: [403, "Acesso ao registro restrito exige justificativa e permissao especifica."],
  SOURCE_NOT_VERIFIED: [409, "Informacao real exige fonte verificada antes da publicacao."],
  MAINTENANCE: [503, "Sistema em manutencao programada."],
  INTERNAL: [500, "Erro interno."],
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export type ApiMeta = {
  requestId?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  [k: string]: unknown;
};

export type ApiResponse<T> =
  | { ok: true; data: T; meta?: ApiMeta }
  | { ok: false; error: { code: ErrorCode | string; message: string; details?: unknown; requestId?: string } };

export function jsonOk<T>(data: T, meta?: ApiMeta, status = 200): Response {
  return Response.json({ ok: true, data, ...(meta ? { meta } : {}) } as ApiResponse<T>, {
    status,
    headers: meta?.requestId ? { "x-request-id": String(meta.requestId) } : undefined,
  });
}

export function jsonError(
  code: ErrorCode | string,
  message?: string,
  details?: unknown,
  requestId?: string,
): Response {
  const fallback = ERROR_CODES[code as ErrorCode];
  const status = fallback?.[0] ?? 500;
  const msg = message ?? fallback?.[1] ?? "Erro.";
  return Response.json(
    {
      ok: false,
      error: { code, message: msg, ...(details !== undefined ? { details } : {}), requestId },
    } as ApiResponse<never>,
    { status, headers: requestId ? { "x-request-id": requestId } : undefined },
  );
}

/** Converte excecao (Zod, DomainError, Prisma) em resposta padronizada. */
export function toHttpError(err: unknown, requestId?: string): Response {
  if (err instanceof z.ZodError) {
    return jsonError(
      "VALIDATION_ERROR",
      "Dados invalidos.",
      err.issues.map((i) => ({ path: i.path.join("."), message: i.message, code: i.code })),
      requestId,
    );
  }
  if (err instanceof DomainError) {
    return jsonError(err.code, err.message, err.details, requestId);
  }
  const anyErr = err as { code?: string; message?: string; meta?: unknown };
  if (anyErr?.code === "P2002") {
    return jsonError("CONFLICT", "Ja existe registro com esses dados.", anyErr.meta, requestId);
  }
  if (anyErr?.code === "P2025") {
    return jsonError("NOT_FOUND", undefined, undefined, requestId);
  }
  return jsonError("INTERNAL", undefined, undefined, requestId);
}

/** Headers padrao de API. */
export function apiHeaders(extra?: Record<string, string>): Headers {
  return new Headers({
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "content-security-policy":
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    ...extra,
  });
}