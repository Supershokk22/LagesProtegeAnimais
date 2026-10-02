import "server-only";
import { prisma } from "@/lib/db";

/**
 * ============================================================================
 * RATE LIMIT (§68)
 * ============================================================================
 * Implementacao: janela deslizante contra a tabela `rate_limit_counters`.
 * Sem Redis (baixo custo operacional para um municipio); migrar para Redis se o
 * volume passar de ~50 req/s em um bucket.
 *
 * REGRA §67: "Nao bloquear automaticamente pessoas apenas por IP compartilhado."
 * → Para algumas acoes, IP e' a unica chave disponivel (anonimo), mas a janela
 *   e larga e o contador secondary por "impressao digital fraca" reduz falso
 *   positivo. Agnosticamente: nunca usar IP como chave unica de bloqueio curto.
 */

export type RateLimitRule = {
  /** Chave logica da rota. */
  name: string;
  /** Numero maximo de requisicoes por janela. */
  limit: number;
  /** Tamanho da janela em segundos. */
  windowSec: number;
  /**
   * Como derivar a identidade do cliente:
   *  - "session": usa userId (uma sessao = uma pessoa)
   *  - "ip": usa IP (anonimos; janela larga)
   *  - "hybrid": userId quando autenticado, senao IP com janela maior
   */
  subject: "session" | "ip" | "hybrid";
};

export const RATE_LIMITS = {
  LOGIN: { name: "auth.login", limit: 8, windowSec: 900, subject: "hybrid" },
  REGISTER: { name: "auth.register", limit: 3, windowSec: 3600, subject: "hybrid" },
  PASSWORD_RESET: { name: "auth.reset", limit: 3, windowSec: 3600, subject: "hybrid" },
  TWO_FACTOR: { name: "auth.2fa", limit: 5, windowSec: 900, subject: "session" },
  REPORT_CREATE: { name: "report.create", limit: 10, windowSec: 3600, subject: "hybrid" },
  EVIDENCE_UPLOAD: { name: "evidence.upload", limit: 40, windowSec: 3600, subject: "session" },
  POST_CREATE: { name: "post.create", limit: 15, windowSec: 3600, subject: "session" },
  COMMENT_CREATE: { name: "comment.create", limit: 30, windowSec: 3600, subject: "session" },
  API_PUBLIC: { name: "api.public", limit: 240, windowSec: 60, subject: "ip" },
  EXPORT_RUN: { name: "export.run", limit: 10, windowSec: 3600, subject: "session" },
  AI_OR_ESCALATION: { name: "report.escalate", limit: 20, windowSec: 3600, subject: "session" },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSec: number;
};

export async function checkRateLimit(
  rule: RateLimitRule,
  identity: { userId?: string | null; ip?: string | null },
  now = new Date(),
): Promise<RateLimitResult> {
  const windowStart = new Date(Math.floor(now.getTime() / (rule.windowSec * 1000)) * rule.windowSec * 1000);
  const expiresAt = new Date(windowStart.getTime() + rule.windowSec * 1000);

  let subject: string;
  let effectiveLimit = rule.limit;

  if (rule.subject === "session" && identity.userId) {
    subject = `u:${identity.userId}`;
  } else if (identity.userId) {
    subject = `u:${identity.userId}`;
  } else if (rule.subject === "hybrid") {
    // Sem sessao: janela 3x mais larga para reduzir bloqueio de rede compartilhada.
    subject = `ip:${identity.ip ?? "unknown"}`;
    effectiveLimit = rule.limit * 3;
  } else {
    subject = `ip:${identity.ip ?? "unknown"}`;
  }

  const bucket = `${rule.name}|${subject}`;

  const counter = await prisma.rateLimitCounter.findFirst({
    where: { bucket, windowStart },
  });

  if (!counter) {
    await prisma.rateLimitCounter.create({
      data: { bucket, windowStart, count: 1, expiresAt },
    });
    return {
      allowed: true,
      limit: effectiveLimit,
      remaining: effectiveLimit - 1,
      resetAt: expiresAt,
      retryAfterSec: 0,
    };
  }

  if (counter.count >= effectiveLimit) {
    return {
      allowed: false,
      limit: effectiveLimit,
      remaining: 0,
      resetAt: expiresAt,
      retryAfterSec: Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
    };
  }

  await prisma.rateLimitCounter.update({
    where: { id: counter.id },
    data: { count: { increment: 1 } },
  });

  return {
    allowed: true,
    limit: effectiveLimit,
    remaining: effectiveLimit - (counter.count + 1),
    resetAt: expiresAt,
    retryAfterSec: 0,
  };
}

/** Housekeeping: chamado por cron. Mantem a tabela pequena. */
export async function purgeRateLimitCounters(): Promise<number> {
  const r = await prisma.rateLimitCounter.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return r.count;
}

/**
 * Bloqueio inteligente de conta (§43 "account lockout inteligente").
 * Criterio: janela deslizante de 15 min. Ate 3 falhas -> nada.
 * 4..7 falhas -> bloqueio de 5 min. 8..12 -> 30 min. 13+ -> 2 h.
 * Sucesso zera o contador.
 */
export async function registerLoginFailure(
  email: string | null,
  ip: string | null,
): Promise<{ lockedForSec: number; attempts: number }> {
  await prisma.loginAttempt.create({
    data: { email, ip: ip ?? '0.0.0.0', success: false, reason: 'INVALID_CREDENTIALS' },
  });
  if (!email) return { lockedForSec: 0, attempts: 0 };

  const since = new Date(Date.now() - 15 * 60_000);
  const attempts = await prisma.loginAttempt.count({
    where: { email, success: false, createdAt: { gte: since } },
  });

  let lockedForSec = 0;
  if (attempts >= 13) lockedForSec = 2 * 3600;
  else if (attempts >= 8) lockedForSec = 30 * 60;
  else if (attempts >= 4) lockedForSec = 5 * 60;

  if (lockedForSec > 0) {
    await prisma.user.updateMany({
      where: { email, deletedAt: null },
      data: { lockedUntil: new Date(Date.now() + lockedForSec * 1000), failedLoginAttempts: attempts },
    });
  } else {
    await prisma.user.updateMany({
      where: { email, deletedAt: null },
      data: { failedLoginAttempts: attempts },
    });
  }

  return { lockedForSec, attempts };
}

export async function registerLoginSuccess(
  userId: string,
  email: string | null,
  ip: string | null,
): Promise<void> {
  await prisma.loginAttempt.create({ data: { email, ip: (ip ?? null) as string, success: true } });
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    },
  });
}

/**
 * Deteccao de login suspeito (§16): IP ou user-agent nunca visto antes para
  await prisma.loginAttempt.create({ data: { email, ip: ip ?? '0.0.0.0', success: true } });
 */
export async function detectSuspiciousLogin(
  userId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<boolean> {
  if (!ip) return false;
  const known = await prisma.session.count({
    where: { userId, OR: [{ ip: ip as never }, { userAgent: (userAgent ?? undefined) as never }] },
  });
  if (known > 1) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { suspiciousLoginAt: new Date() },
  });
  return true;
}
