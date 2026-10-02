import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonOk, toHttpError, apiHeaders } from "@/lib/api/response";
import { guardContext, enforceRateLimit } from "@/lib/auth/guards";
import { RATE_LIMITS } from "@/lib/ratelimit";
import { publicHeatmap } from "@/lib/analytics/observatorio";
import { LAGES_CENTER } from "@/lib/geo/protection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/map
 *
 * Endpoint que alimenta o mapa público. Duas respostas possíveis:
 *  - heatmap: células agregadas com n >= 5 (nunca o ponto do relato)
 *  - markers:Lost/Found/ONG/Clinic, já com precisão reduzida pelo servidor
 *
 * O cliente NUNCA recebe `exactLat/exactLng`.
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const ctx = await guardContext();
    await enforceRateLimit(RATE_LIMITS.API_PUBLIC, ctx);

    const url = new URL(req.url);
    const q = z
      .object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        layer: z.enum(["heatmap", "markers", "both"]).default("both"),
        minCount: z.coerce.number().int().min(1).max(200).default(5),
      })
      .parse(Object.fromEntries(url.searchParams));

    const to = q.to ?? new Date();
    const from = q.from ?? new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 11, 1));

    const payload: Record<string, unknown> = {
      period: { from: from.toISOString(), to: to.toISOString() },
      center: LAGES_CENTER,
      precisionNotice:
        "Todos os pontos são agregados por região. A coordenada exata do relato nunca é exposta.",
    };

    if (q.layer === "heatmap" || q.layer === "both") {
      payload.heatmap = await publicHeatmap(from, to, q.minCount);
    }

    if (q.layer === "markers" || q.layer === "both") {
      const [lost, found, animals, orgs, clinics] = await Promise.all([
        prisma.lostAnimal.findMany({
          where: { deletedAt: null, status: { in: ["ATIVO", "EM_CONTATO"] }, publicLat: { not: null } },
          select: {
            id: true, animalName: true, species: true, publicLat: true, publicLng: true,
            publicPrecision: true, lastSeenPlace: true, createdAt: true,
          },
          orderBy: { createdAt: "desc" }, take: 400,
        }),
        prisma.foundAnimal.findMany({
          where: { deletedAt: null, status: { in: ["ATIVO", "EM_CONTATO"] }, publicLat: { not: null } },
          select: {
            id: true, species: true, color: true, publicLat: true, publicLng: true,
            publicPrecision: true, foundPlace: true, createdAt: true, isInjured: true,
          },
          orderBy: { createdAt: "desc" }, take: 400,
        }),
        prisma.animal.findMany({
          where: { deletedAt: null, status: "DISPONIVEL", publicLat: { not: null } },
          select: {
            id: true, name: true, species: true, publicLat: true, publicLng: true,
            publicPrecision: true, ageMonths: true, size: true,
          },
          orderBy: { createdAt: "desc" }, take: 400,
        }),
        prisma.organization.findMany({
          where: { isPublic: true, active: true, deletedAt: null, publicLat: { not: null } },
          select: {
            id: true, publicName: true, kind: true, publicLat: true, publicLng: true,
            openingHours: true, verificationStatus: true,
          },
          take: 300,
        }),
        prisma.clinic.findMany({
          where: { isPublic: true, deletedAt: null, publicLat: { not: null } },
          select: { id: true, name: true, publicLat: true, publicLng: true, emergency24h: true, phone: true },
          take: 200,
        }),
      ]);

      payload.markers = [
        ...lost.map((l) => ({
          id: `lost:${l.id}`,
          kind: "LOST" as const,
          label: `Perdido: ${l.animalName}`,
          meta: l.lastSeenPlace ?? undefined,
          lat: l.publicLat!,
          lng: l.publicLng!,
          precision: l.publicPrecision,
        })),
        ...found.map((f) => ({
          id: `found:${f.id}`,
          kind: "FOUND" as const,
          label: `Encontrado: ${f.species}${f.isInjured ? " (ferido)" : ""}`,
          meta: f.foundPlace,
          lat: f.publicLat!,
          lng: f.publicLng!,
          precision: f.publicPrecision,
        })),
        ...animals.map((a) => ({
          id: `animal:${a.id}`,
          kind: "ANIMAL" as const,
          label: `Para adoção: ${a.name ?? a.species}`,
          meta: a.ageMonths ? `${Math.floor(a.ageMonths / 12)} ano(s)` : undefined,
          lat: a.publicLat!,
          lng: a.publicLng!,
          precision: a.publicPrecision,
        })),
        ...orgs.map((o) => ({
          id: `org:${o.id}`,
          kind: "ORG" as const,
          label: o.publicName,
          meta: `${o.kind}${o.verificationStatus === "VERIFICADO" ? " · verificado" : ""}`,
          lat: o.publicLat!,
          lng: o.publicLng!,
          precision: "APROXIMADA",
        })),
        ...clinics.map((c) => ({
          id: `clinic:${c.id}`,
          kind: "CLINIC" as const,
          label: c.name,
          meta: c.emergency24h ? "Atendimento 24h" : undefined,
          lat: c.publicLat!,
          lng: c.publicLng!,
          precision: "APROXIMADA",
        })),
      ];
    }

    const res = jsonOk(payload, { requestId });
    return new Response(res.body, { status: 200, headers: apiHeaders({ "x-request-id": requestId }) });
  } catch (err) {
    const res = toHttpError(err, requestId);
    return new Response(res.body, { status: res.status, headers: apiHeaders({ "x-request-id": requestId }) });
  }
}