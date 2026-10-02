import { openApiSpec } from "@/lib/api/openapi";
import { jsonOk } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-static";

/** GET /api/v1/openapi - especificacao viva (sem build step no deploy). */
export async function GET() {
  return jsonOk(openApiSpec);
}
