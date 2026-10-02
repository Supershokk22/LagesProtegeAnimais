import "server-only";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  resolvePermissions,
  roleLevel,
  type PermissionKey,
} from "@/lib/auth/permissions";
import type { RoleKey } from "@/generated/prisma/client";

/* ===========================================================================
   SESSAO
   - access token: JWT curto (15 min), em memoria/httpOnly cookie
   - refresh token: opaco 32 bytes; apenas o HASH vai ao banco; rotacao a cada uso
   - revogacao global ("logout global", §16) = bump de `sessionEpoch`
   =========================================================================== */

export const ACCESS_COOKIE = "lpa_at";
export const REFRESH_COOKIE = "lpa_rt";

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 30 * 24 * 3600;

function secret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("AUTH_SECRET ausente ou curto (min 32 chars)");
  }
  return new TextEncoder().encode(raw);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = {
  id: string;
  publicName: string;
  email: string;
  roles: RoleKey[];
  permissions: ReadonlySet<PermissionKey>;
  level: number;
  sessionId: string;
  twoFactorVerified: boolean;
  aal: "AAL1" | "AAL2";
};

export type AuthSession = SessionUser | null;

/* -------------------------------------------------------------------------- */

export async function issueSession(
  userId: string,
  ctx: { ip?: string | null; userAgent?: string | null; aal?: "AAL1" | "AAL2" },
): Promise<{ accessToken: string; refreshToken: string; sessionId: string }> {
  const refreshToken = randomBytes(32).toString("base64url");
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashToken(refreshToken),
      ip: ctx.ip ?? null,
      userAgent: ctx.userAgent?.slice(0, 400) ?? null,
      deviceLabel: classifyDevice(ctx.userAgent),
      expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
    },
    select: { id: true },
  });

  const accessToken = await signAccessToken(userId, session.id, ctx.aal ?? "AAL1");
  return { accessToken, refreshToken, sessionId: session.id };
}

async function signAccessToken(
  userId: string,
  sessionId: string,
  aal: "AAL1" | "AAL2",
): Promise<string> {
  return new SignJWT({ sid: sessionId, aal })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer("lages-protege-animais")
    .setAudience("lpa-web")
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(secret());
}

async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "lages-protege-animais",
      audience: "lpa-web",
      algorithms: ["HS256"], // pin: impede confusao de algoritmo (alg:none)
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Le a sessao atual. Cache curto por request para evitar N+1 em Server Components.
 */
export async function getSession(): Promise<AuthSession> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload || !payload.sub || !payload.sid) return null;

  const user = await prisma.user.findFirst({
    where: { id: payload.sub, deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      publicName: true,
      email: true,
      twoFactorEnabled: true,
      roles: { select: { role: { select: { key: true } }, expiresAt: true } },
    },
  });
  if (!user) return null;

  const now = Date.now();
  const roles = user.roles
    .filter((r) => !r.expiresAt || r.expiresAt.getTime() > now)
    .map((r) => r.role.key);

  const aal = payload.aal === "AAL2" ? "AAL2" : "AAL1";
  // Se 2FA esta habilitado, sessao so vale como AAL2 apos o desafio.
  const verifiedAal = user.twoFactorEnabled && aal !== "AAL2" ? "AAL1" : aal;

  return {
    id: user.id,
    publicName: user.publicName,
    email: user.email,
    roles,
    permissions: resolvePermissions(roles),
    level: roleLevel(roles),
    sessionId: String(payload.sid),
    twoFactorVerified: verifiedAal === "AAL2",
    aal: verifiedAal,
  };
}

/** Consome o refresh token, rotaciona e devolve novo par. Reuso = roubo. */
export async function rotateSession(
  refreshToken: string,
  ctx: { ip?: string | null; userAgent?: string | null },
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const hash = hashToken(refreshToken);
  const session = await prisma.session.findUnique({ where: { refreshTokenHash: hash } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  // Detecao de reuso: se o token ja foi rotacionado, invalida TUDO do usuario.
  if (session.lastSeenAt < new Date(session.createdAt.getTime() + 1000)) {
    await revokeAllSessions(session.userId, "REFRESH_TOKEN_REUSE");
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date(), ip: ctx.ip ?? null, userAgent: ctx.userAgent?.slice(0, 400) ?? null },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { twoFactorEnabled: true },
  });
  const aal: "AAL1" | "AAL2" = user?.twoFactorEnabled ? "AAL1" : "AAL1";
  const accessToken = await signAccessToken(session.userId, session.id, aal);
  const nextRefresh = randomBytes(32).toString("base64url");
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(nextRefresh) },
  });
  return { accessToken, refreshToken: nextRefresh };
}

export async function revokeSession(sessionId: string, reason = "LOGOUT"): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

/** §16 "logout global": encerra TODAS as sessoes do usuario. */
export async function revokeAllSessions(userId: string, reason: string): Promise<number> {
  const r = await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return r.count;
}

export async function listSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, deviceLabel: true, ip: true, lastSeenAt: true, createdAt: true },
    orderBy: { lastSeenAt: "desc" },
  });
}

/* -------------------------------------------------------------------------- */
/* Tokens de uso unico: confirmacao de e-mail, recuperacao, reset de 2FA       */
/* -------------------------------------------------------------------------- */

export function generateOpaqueToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export type OneTimePurpose =
  | "EMAIL_CONFIRM"
  | "PASSWORD_RESET"
  | "TOTP_DISABLE"
  | "EMAIL_CHANGE";

const ONE_TIME_TTL_MIN: Record<OneTimePurpose, number> = {
  EMAIL_CONFIRM: 60 * 24,
  PASSWORD_RESET: 60,
  TOTP_DISABLE: 15,
  EMAIL_CHANGE: 60 * 24,
};

/**
 * Emite token opaco de uso unico. SO o hash SHA-256 e persistido — vazamento do
 * banco nao permite autenticar. Tokens anteriores do mesmo purpose sao
 * invalidados para impedir que um e-mail antigo continue valendo.
 */
export async function registerOneTimeToken(
  userId: string,
  purpose: OneTimePurpose,
  meta: Record<string, unknown> = {},
  ip: string | null = null,
): Promise<string> {
  const { token, hash } = generateOpaqueToken();
  await prisma.oneTimeToken.deleteMany({ where: { userId, purpose, usedAt: null } });
  await prisma.oneTimeToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hash,
      meta: meta as never,
      ip,
      expiresAt: new Date(Date.now() + ONE_TIME_TTL_MIN[purpose] * 60_000),
    },
  });
  return token;
}

/** Consome o token: valida hash, expiracao e uso unico em uma transacao. */
export async function consumeOneTimeToken(
  token: string,
  purpose: OneTimePurpose,
): Promise<{ userId: string; meta: Record<string, unknown> | null } | null> {
  const hash = hashToken(token);
  const row = await prisma.oneTimeToken.findUnique({ where: { tokenHash: hash } });
  if (!row || row.purpose !== purpose || row.usedAt || row.expiresAt < new Date()) return null;
  const res = await prisma.oneTimeToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (res.count !== 1) return null; // corrida: ja consumido
  return { userId: row.userId, meta: (row.meta as Record<string, unknown> | null) ?? null };
}

export function hashOpaqueToken(token: string): string {
  return hashToken(token);
}

/** Comparacao em tempo constante para tokens/segredos. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/* -------------------------------------------------------------------------- */
/* Contexto de requisicao                                                     */
/* -------------------------------------------------------------------------- */

export async function requestContext(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  };
}

function classifyDevice(ua: string | null | undefined): string {
  if (!ua) return "desconhecido";
  const s = ua.toLowerCase();
  if (s.includes("windows")) return "Windows";
  if (s.includes("android")) return "Android";
  if (s.includes("iphone") || s.includes("ipad")) return "iOS";
  if (s.includes("mac os")) return "macOS";
  if (s.includes("linux")) return "Linux";
  return "outro";
}