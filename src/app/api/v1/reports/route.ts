import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toHttpError, jsonOk, apiHeaders, jsonError } from "@/lib/api/response";
import { reportCreateSchema } from "@/lib/validation/schemas";
import { createReport } from "@/lib/reports/service";
import { guardContext, enforceRateLimit } from "@/lib/auth/guards";
import { RATE_LIMITS } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/v1/reports
 * Cria denuncia. Aberta a cidadao (com ou sem conta) — §99 exige caminho
 * minimo para emergencia. Rate limit amplo com janela adaptativa (§67).
 */
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const ctx = await guardContext();
    await enforceRateLimit(RATE_LIMITS.REPORT_CREATE, ctx);

    // Limite de payload antes de parsear: barrar cedo economiza CPU/memoria.
    const maxBody = Number(process.env.MAX_UPLOAD_BYTES ?? 26_214_400);
    const len = Number(req.headers.get("content-length") ?? 0);
    if (len > maxBody) {
      return jsonError("UPLOAD_TOO_LARGE", "Corpo da requisicao excede o limite.", undefined, requestId);
    }

    const body = reportCreateSchema.parse(await req.json());
    const result = await createReport(body, ctx.user, { ip: ctx.ip, userAgent: ctx.userAgent });

    return NextResponse.json(
      {
        ok: true,
        data: {
          protocol: result.protocol,
          status: result.status,
          suggestedUrgency: result.suggestedUrgency,
          triage: {
            score: result.triage.score,
            factors: result.triage.factors.map((f) => ({ label: f.label, points: f.points, evidence: f.evidence })),
          },
          message:
            "Denuncia registrada. Guarde o numero de protocolo para acompanhar o atendimento.",
        },
        meta: { requestId },
      },
      { status: 201, headers: apiHeaders({ "x-request-id": requestId }) },
    );
  } catch (err) {
    const res = toHttpError(err, requestId);
    return new Response(res.body, { status: res.status, headers: apiHeaders({ "x-request-id": requestId }) });
  }
}

/**
 * GET /api/v1/reports
 * Lista publica: SOMENTE occorrencias publicadas com fonte verificada.
 * Sem coordenadas exatas, sem PII, sem texto livre.
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const url = new URL(req.url);
    const q = z
      .object({
        page: z.coerce.number().int().min(1).max(1000).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
        category: z.string().max(40).optional(),
        status: z.string().max(40).optional(),
        neighborhoodId: z.string().uuid().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      })
      .parse(Object.fromEntries(url.searchParams));

    const where = {
      deletedAt: null,
      isPublic: true,
      ...(q.category ? { category: q.category as never } : {}),
      ...(q.status ? { status: q.status as never } : {}),
      ...(q.neighborhoodId ? { neighborhoodId: q.neighborhoodId } : {}),
      ...(q.from || q.to
        ? { publishedAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        select: {
          id: true, protocol: true, category: true, status: true, publicSummary: true,
          species: true, animalCount: true, neighborhoodId: true,
          publicLat: true, publicLng: true, publicPrecision: true,
          publishedAt: true, externalOrg: true,
          sources: {
            where: { status: "VERIFICADO" },
            select: { sourceOrg: true, sourceUrl: true, documentDate: true, consultedAt: true },
            take: 3,
          },
        },
        orderBy: { publishedAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);

    return jsonOk(
      rows.map((r) => ({
        protocol: r.protocol,
        category: r.category,
        status: r.status,
        summary: r.publicSummary ?? "INFORMACAO PENDENTE DE VERIFICACAO",
        species: r.species,
        animalCount: r.animalCount,
        neighborhoodId: r.neighborhoodId,
        // Precisao agregada: o publico nunca recebe o ponto do relato.
        location: r.publicLat !== null ? { lat: r.publicLat, lng: r.publicLng, precision: r.publicPrecision } : null,
        publishedAt: r.publishedAt,
        officialSource: r.externalOrg,
        sources: r.sources,
      })),
      { requestId, page: q.page, pageSize: q.pageSize, total },
    );
  } catch (err) {
    const res = toHttpError(err, requestId);
    return new Response(res.body, { status: res.status, headers: apiHeaders({ "x-request-id": requestId }) });
  }
}