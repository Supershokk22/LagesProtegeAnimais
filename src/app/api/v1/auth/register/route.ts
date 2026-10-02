import { NextResponse } from "next/server";
import { z } from "zod";
import { toHttpError, jsonOk, apiHeaders } from "@/lib/api/response";
import { guardContext, enforceRateLimit } from "@/lib/auth/guards";
import { RATE_LIMITS } from "@/lib/ratelimit";
import { prisma } from "@/lib/db";
import { hashPassword, passwordSchema } from "@/lib/auth/crypto";
import { requestContext } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const ctx = await guardContext();
    await enforceRateLimit(RATE_LIMITS.REGISTER, ctx);
    const rc = await requestContext();

    const body = await req.json();

    // §15: "Nao coletar CPF de usuarios comuns sem necessidade definida."
    // → schema estrito rejeita chaves desconhecidas, incluindo CPF.
    const parsed = z
      .object({
        email: z.string().email().max(200),
        publicName: z.string().trim().min(2).max(80),
        displayName: z.string().trim().max(120).nullish(),
        password: passwordSchema,
        city: z.string().trim().max(120).nullish(),
        termsAccepted: z.literal(true, "Aceite os Termos de Uso."),
        privacyAccepted: z.literal(true, "Aceite a Politica de Privacidade."),
        ageConfirmed: z.literal(true, "Confirme a idade minima aplicavel."),
      })
      .strict()
      .parse(body);

    const exists = await prisma.user.findUnique({ where: { email: parsed.email.toLowerCase() } });
    if (exists) {
      // Resposta ambigua de proposito: nao confirma se o e-mail esta cadastrado.
      return jsonOk({
        message: "Se os dados estiverem validos, a confirmacao sera enviada por e-mail.",
      });
    }

    const passwordHash = await hashPassword(parsed.password);

    const user = await prisma.user.create({
      data: {
        email: parsed.email.toLowerCase(),
        passwordHash,
        publicName: parsed.publicName,
        displayName: parsed.displayName ?? null,
        city: parsed.city ?? null,
        status: "PENDING_VERIFICATION",
        roles: { create: { role: { connect: { key: "USER" } } } },
        profile: { create: { lgpdConsentAt: new Date() } },
        consents: {
          create: [
            { docKind: "TERMOS_DE_USO", docVersion: "1.0", given: true, ip: rc.ip, userAgent: rc.userAgent },
            { docKind: "POLITICA_DE_PRIVACIDADE", docVersion: "1.0", given: true, ip: rc.ip, userAgent: rc.userAgent },
          ],
        },
      },
      select: { id: true, email: true, publicName: true },
    });

    await audit({
      actorId: user.id,
      action: "auth.register",
      resource: "user",
      resourceId: user.id,
      ip: rc.ip,
      userAgent: rc.userAgent,
    });

    return NextResponse.json(
      { ok: true, data: { message: "Conta criada. Confirme o e-mail para ativar o acesso." } },
      { status: 201, headers: apiHeaders({ "x-request-id": requestId }) },
    );
  } catch (err) {
    const res = toHttpError(err, requestId);
    return new Response(res.body, { status: res.status, headers: apiHeaders({ "x-request-id": requestId }) });
  }
}
