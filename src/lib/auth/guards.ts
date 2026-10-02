import "server-only";
import { getSession, requestContext, type SessionUser } from "@/lib/auth/session";
import { auditDenied } from "@/lib/audit";
import { checkRateLimit, type RateLimitRule } from "@/lib/ratelimit";
import { DomainError } from "@/lib/db";
import type { PermissionKey } from "@/lib/auth/permissions";
import { ROLES_REQUIRING_2FA } from "@/lib/auth/permissions";
import type { RoleKey } from "@/generated/prisma/client";

/**
 * ============================================================================
 * GUARDAS DE AUTORIZACAO (§17, §43, §76)
 * ============================================================================
 * Todas as rotas de API e todo Server Action passam por aqui. Nenhum `if (admin)`
 * espalhado pelo codigo: a checagem e sempre por PERMISSAO.
 */

export type GuardContext = {
  user: SessionUser | null;
  ip: string | null;
  userAgent: string | null;
};

/** Le a sessao e o contexto de requisicao. Barato; use em toda rota protegida. */
export async function guardContext(): Promise<GuardContext> {
  const [user, ctx] = await Promise.all([getSession(), requestContext()]);
  return { user, ip: ctx.ip, userAgent: ctx.userAgent };
}

export async function requireUser(ctx?: GuardContext): Promise<SessionUser> {
  const g = ctx ?? (await guardContext());
  if (!g.user) throw new DomainError("AUTH_UNAUTHENTICATED", "Autenticacao necessaria.", 401);
  return g.user;
}

/**
 * Exige uma permissao especifica.
 * Throw DomainError com 403 e registra auditoria de negacao.
 */
export async function requirePermission(
  permission: PermissionKey,
  ctx?: GuardContext,
  resource?: { resource: string; resourceId?: string; reason?: string },
): Promise<SessionUser> {
  const g = ctx ?? (await guardContext());
  const user = await requireUser(g);

  if (!user.permissions.has(permission)) {
    await auditDenied(user.id, permission, resource?.resource ?? "system", resource?.reason ?? "permissao ausente", g.ip);
    throw new DomainError("AUTH_FORBIDDEN", `Permissao necessaria: ${permission}`, 403);
  }

  // §43: papeis sensiveis exigem AAL2 (2JA validado) para acao de escrita.
  if (isWritePermission(permission) && requiresTwoFactor(user.roles)) {
    if (user.aal !== "AAL2") {
      throw new DomainError("AUTH_2FA_REQUIRED", "Confirme a autenticacao em dois fatores para esta operacao.", 401);
    }
  }

  return user;
}

const WRITE_PREFIXES = ["report:update", "report:close", "report:assign", "report:forward",
  "report:publish", "report:merge", "triage:decide", "evidence:delete", "evidence:share",
  "user:manage", "role:manage", "org:verify", "contact:verify", "restricted:write",
  "restricted:read", "import:run", "import:approve", "export:sensitive", "sla:manage",
  "incident:manage", "mod:decide", "post:moderate", "content:manage", "adoption:decide",
  "privacy:handle", "ticket:manage"];

function isWritePermission(p: string): boolean {
  return WRITE_PREFIXES.some((w) => p.startsWith(w));
}

export function requiresTwoFactor(roles: readonly RoleKey[]): boolean {
  return roles.some((r) => (ROLES_REQUIRING_2FA as readonly string[]).includes(r));
}

/**
 * Verifica papel COMBINADO com permissao (uso restrito).
 * Ex.: requireRole("SUPER_ADMIN") para trocar a matriz de papeis.
 */
export async function requireRole(
  roles: RoleKey | RoleKey[],
  ctx?: GuardContext,
): Promise<SessionUser> {
  const g = ctx ?? (await guardContext());
  const user = await requireUser(g);
  const need = Array.isArray(roles) ? roles : [roles];
  if (!need.some((r) => user.roles.includes(r))) {
    await auditDenied(user.id, "requireRole", need.join("|"), "papel insuficiente", g.ip);
    throw new DomainError("AUTH_FORBIDDEN", "Papel insuficiente.", 403);
  }
  return user;
}

/** Atalho booleano para Server Components / UI. */
export function can(user: SessionUser | null, permission: PermissionKey): boolean {
  return !!user?.permissions.has(permission);
}

/** Atalho booleano por papel. */
export function isRole(user: SessionUser | null, ...roles: RoleKey[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}

/**
 * §38 — acesso ao REGISTRO DE IMPEDIMENTOS.
 * Exige permissao especifica E motivo escrito. Sem motivo, sem acesso.
 * Toda consulta gera audit log com isSensitiveAccess = true (§39).
 */
export async function requireRestrictedAccess(
  reason: string,
  ctx?: GuardContext,
): Promise<{ user: SessionUser; ip: string | null }> {
  const g = ctx ?? (await guardContext());
  const user = await requirePermission("restricted:read", g, {
    resource: "restricted_guardianship_records",
    reason,
  });
  if (!reason || reason.trim().length < 10) {
    throw new DomainError(
      "RESTRICTED_ACCESS",
      "Informe um motivo concreto (minimo 10 caracteres) para consultar o registro restrito.",
      403,
    );
  }
  return { user, ip: g.ip };
}

/** Aplica rate limit e lanca 429 se excedido. */
export async function enforceRateLimit(
  rule: RateLimitRule,
  ctx?: GuardContext,
): Promise<void> {
  const g = ctx ?? (await guardContext());
  const res = await checkRateLimit(rule, { userId: g.user?.id ?? null, ip: g.ip });
  if (!res.allowed) {
    throw new DomainError(
      "RATE_LIMIT_EXCEEDED",
      `Limite excedido. Tente novamente em ${res.retryAfterSec}s.`,
      429,
      { retryAfterSec: res.retryAfterSec },
    );
  }
}