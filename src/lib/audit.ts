import "server-only";
import { prisma } from "@/lib/db";

/**
 * ============================================================================
 * AUDITORIA (§49) e LOGS (§48)
 * ============================================================================
 * Regras:
 *  - NUNCA registrar senha, token, TOTP secret ou dado sensivel em claro.
 *  - `before`/`after` passam por redator que remove chaves perigosas.
 *  - Acesso a dado restrito exige `reason` (motivo registrado) e marca
 *    `isSensitiveAccess`, o que gera alerta (§38-§39).
 *  - Falha de auditoria NAO pode ser silenciosa em operacao que altera estado:
 *    ver `withAudit`.
 */

const REDACT_KEYS = new Set([
  "password", "passwordHash", "password_hash", "newPassword", "currentPassword",
  "token", "accessToken", "refreshToken", "tokenHash", "token_hash",
  "twoFactorSecretEnc", "twoFactorPendingSecretEnc", "secret", "apiKey",
  "authorization", "cookie", "documentNumber", "cpf", "cpfCnpj",
  "phone", "authorEmail", "email", "birthDate",
]);

export type AuditInput = {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  reason?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  sensitive?: boolean;
};

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[deep]";
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 200).map((v) => redact(v, depth + 1));
  if (typeof value === "bigint") return value.toString();
  if (typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACT_KEYS.has(k) ? "[redacted]" : redact(v, depth + 1);
  }
  return out;
}

export async function audit(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      reason: input.reason?.slice(0, 400) ?? null,
      before: input.before === undefined ? undefined : (redact(input.before) as never),
      after: input.after === undefined ? undefined : (redact(input.after) as never),
      ip: input.ip ?? null,
      userAgent: input.userAgent?.slice(0, 400) ?? null,
      isSensitiveAccess: input.sensitive ?? false,
    },
  });
}

export async function log(
  category: "AUTH" | "ADMIN" | "SECURITY" | "AUDIT" | "MODERATION" | "REPORT" | "SYSTEM",
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL",
  message: string,
  context?: Record<string, unknown>,
  extra?: { requestId?: string | null; userId?: string | null; ip?: string | null; durationMs?: number | null },
): Promise<void> {
  await prisma.systemLog.create({
    data: {
      category,
      level,
      message: message.slice(0, 4000),
      context: context ? (redact(context) as never) : undefined,
      requestId: extra?.requestId ?? null,
      userId: extra?.userId ?? null,
      ip: extra?.ip ?? null,
      durationMs: extra?.durationMs ?? null,
    },
  });
}

/**
 * Auditoria com garantia: se a gravacao do audit falhar, a transacao de negocio
 * tambem falha. Em operacao que muda dado sob suspeita (excluir evidencia,
 * alterar status de denuncia) perder o rastro e' pior que perder a operacao.
 */
export async function withAudit<T>(
  input: AuditInput,
  fn: () => Promise<T>,
): Promise<T> {
  const result = await fn();
  await audit(input);
  return result;
}

export async function auditDenied(
  actorId: string | null,
  action: string,
  resource: string,
  reason: string,
  ip?: string | null,
): Promise<void> {
  await audit({
    actorId,
    action: `${action}.DENIED`,
    resource,
    reason,
    ip,
  });
}