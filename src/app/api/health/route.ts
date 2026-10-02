import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — liveness + readiness (§71).
 * db=down retorna 503: o orquestrador/balanceador remove a instância do pool.
 */
export async function GET() {
  const started = Date.now();
  let db: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }

  return new Response(
    JSON.stringify({
      ok: db === "up",
      data: {
        status: db === "up" ? "healthy" : "degraded",
        db,
        storageDriver: process.env.STORAGE_DRIVER ?? "PRIVATE",
        uptimeSec: Math.floor(process.uptime()),
        checkedInMs: Date.now() - started,
      },
    }),
    { status: db === "up" ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}