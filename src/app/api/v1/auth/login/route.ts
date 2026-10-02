import { NextResponse } from "next/server";
import { z } from "zod";
import { toHttpError, jsonError, apiHeaders } from "@/lib/api/response";
import { guardContext, enforceRateLimit } from "@/lib/auth/guards";
import { RATE_LIMITS } from "@/lib/ratelimit";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/crypto";
import {
  issueSession,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  requestContext,
} from "@/lib/auth/session";
import {
  registerLoginFailure,
  registerLoginSuccess,
  detectSuspiciousLogin,
} from "@/lib/ratelimit";
import { log } from "@/lib/audit";
import { resolvePermissions, roleLevel } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
  totpCode: z.string().regex(/^\d{6}$/).nullish(),
});


export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const ctx = await guardContext();
    await enforceRateLimit(RATE_LIMITS.LOGIN, ctx);
    const rc = await requestContext();

    const body = loginSchema.parse(await req.json());
    const email = body.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });

    // Mensagem unica para credencial errada, conta inexistente e e-mail nao
    // confirmado: nao permite enumeracao de contas (§43).
    const genericFail = () => {
      void registerLoginFailure(email, rc.ip);
      return jsonError("AUTH_INVALID_CREDENTIALS", undefined, undefined, requestId);
    };

    if (!user) return genericFail();
    if (user.deletedAt) return genericFail();
    if (user.status === "BANNED" || user.status === "DEACTIVATED") return genericFail();

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const sec = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      return jsonError(
        "AUTH_ACCOUNT_LOCKED",
        `Conta bloqueada por ${Math.ceil(sec / 60)} minuto(s) por excesso de tentativas.`,
        undefined,
        requestId,
      );
    }

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return genericFail();

    if (user.status === "PENDING_VERIFICATION") {
      return jsonError(
        "AUTH_INVALID_CREDENTIALS",
        "Confirme o e-mail recebido para ativar o acesso.",
        undefined,
        requestId,
      );
    }

    // --- 2FA (§16)
    if (user.twoFactorEnabled) {
      if (!body.totpCode) {
        return jsonError(
          "AUTH_2FA_REQUIRED",
          "Informe o codigo de verificacao de 6 digitos do seu aplicativo autenticador.",
          { email },
          requestId,
        );
      }
      if (!user.twoFactorSecretEnc) {
        return jsonError("AUTH_2FA_INVALID", "2FA nao configurado corretamente.", undefined, requestId);
      }
      const { verifyTotp } = await import("@/lib/auth/totp");
      const { decryptSecret } = await import("@/lib/auth/crypto");
      const valid = verifyTotp(body.totpCode, decryptSecret(user.twoFactorSecretEnc));
      if (!valid) {
        await log("SECURITY", "WARN", "auth.2fa.invalid", { userId: user.id }, { ip: rc.ip });
        return jsonError("AUTH_2FA_INVALID", undefined, undefined, requestId);
      }
    }

    const { accessToken, refreshToken, sessionId } = await issueSession(user.id, {
      ip: rc.ip,
      userAgent: rc.userAgent,
      aal: user.twoFactorEnabled ? "AAL2" : "AAL1",
    });

    await registerLoginSuccess(user.id, email, rc.ip);
    const suspicious = await detectSuspiciousLogin(user.id, rc.ip, rc.userAgent);

    const roles = (
      await prisma.userRole.findMany({
        where: { userId: user.id, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        select: { role: { select: { key: true } } },
      })
    ).map((r) => r.role.key);

    const res = NextResponse.json(
      {
        ok: true,
        data: {
          user: {
            publicName: user.publicName,
            email: user.email,
            roles,
            level: roleLevel(roles),
            permissions: [...resolvePermissions(roles)],
          },
          session: { id: sessionId, expiresInSec: 900 },
          alerts: suspicious ? ["Login em novo dispositivo ou local detectado."] : [],
        },
      },
      { headers: apiHeaders({ "x-request-id": requestId }) },
    );

    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(ACCESS_COOKIE, accessToken, {
      httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 900,
    });
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true, secure, sameSite: "strict", path: "/api/v1/auth", maxAge: 30 * 24 * 3600,
    });
    return res;
  } catch (err) {
    const res = toHttpError(err, requestId);
    return new Response(res.body, { status: res.status, headers: apiHeaders({ "x-request-id": requestId }) });
  }
}
