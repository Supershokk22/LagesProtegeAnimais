import { NextResponse } from "next/server";
import { toHttpError, apiHeaders } from "@/lib/api/response";
import { guardContext } from "@/lib/auth/guards";
import { ACCESS_COOKIE, REFRESH_COOKIE, revokeAllSessions } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function POST() {
  const requestId = crypto.randomUUID();
  try {
    const ctx = await guardContext();
    if (ctx.user) await revokeAllSessions(ctx.user.id, "LOGOUT_USER");
    const res = NextResponse.json(
      { ok: true, data: { message: "Sessao encerrada." } },
      { headers: apiHeaders({ "x-request-id": requestId }) },
    );
    res.cookies.delete(ACCESS_COOKIE);
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  } catch (err) {
    const res = toHttpError(err, requestId);
    return new Response(res.body, { status: res.status, headers: apiHeaders({ "x-request-id": requestId }) });
  }
}
