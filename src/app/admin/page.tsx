import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { slaBoard } from "@/lib/analytics/observatorio";
import { URGENCY_LABEL, STATUS_LABEL, URGENCY_STYLE, STATUS_STYLE } from "@/components/map/categoryLabels";
import Link from "next/link";

export const dynamic = "force-dynamic";

/** HOME ADMIN (§110) — cards + fila de atendimento priorizada por urgência e SLA. */
export default async function AdminHomePage() {
  const user = await getSession();
  const today = new Date();
  const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const [hoje, urgentes, emAtraso, adocoes, perdidos, encontrados, usuarios, pendente, sla] =
    await Promise.all([
      prisma.report.count({ where: { createdAt: { gte: startOfDay }, deletedAt: null } }),
      prisma.report.count({ where: { deletedAt: null, closedAt: null, urgency: { in: ["URGENTE", "CRITICA"] } } }),
      prisma.report.count({ where: { deletedAt: null, closedAt: null, dueAt: { lt: new Date() } } }),
      prisma.adoption.count({ where: { adoptedAt: { gte: startOfDay } } }),
      prisma.lostAnimal.count({ where: { deletedAt: null, status: "ATIVO" } }),
      prisma.foundAnimal.count({ where: { deletedAt: null, status: "ATIVO" } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.contentReport.count({ where: { status: "PENDENTE" } }),
      slaBoard(),
    ]);

  const fila = await prisma.report.findMany({
    where: { deletedAt: null, closedAt: null },
    select: {
      id: true, protocol: true, category: true, status: true, urgency: true,
      createdAt: true, dueAt: true, isPublic: true, suggestedUrgency: true,
      neighborhood: { select: { name: true } },
    },
    orderBy: [{ urgency: "desc" }, { createdAt: "asc" }],
    take: 20,
  });

  const cards = [
    { l: "Denúncias hoje", v: hoje, tone: "default" },
    { l: "Urgentes/críticas", v: urgentes, tone: urgentes ? "danger" : "default" },
    { l: "Em atraso (SLA)", v: emAtraso, tone: emAtraso ? "danger" : "default" },
    { l: "Adoções hoje", v: adocoes, tone: "good" },
    { l: "Perdidos ativos", v: perdidos, tone: "default" },
    { l: "Encontrados ativos", v: encontrados, tone: "default" },
    { l: "Usuários", v: usuarios, tone: "default" },
    { l: "Moderação pendente", v: pendente, tone: pendente ? "warn" : "default" },
  ];

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-verde-900">
          Dashboard{user?.publicName ? ` — ${user.publicName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-neutro-600">{today.toLocaleDateString("pt-BR", { dateStyle: "full" })}</p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.l} className="rounded-xl border border-neutro-300 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutro-500">{c.l}</p>
            <p
              className={`mt-1 text-3xl font-black tabular-nums ${
                c.tone === "danger"
                  ? "text-vermelho"
                  : c.tone === "good"
                    ? "text-verde-700"
                    : c.tone === "warn"
                      ? "text-amber-700"
                      : "text-verde-900"
              }`}
            >
              {c.v}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {[
          ["Fora do prazo", sla?.totals.overdue ?? 0, "text-vermelho"],
          ["Vencem em 24 h", sla?.totals.dueSoon ?? 0, "text-amber-700"],
          ["No prazo", sla?.totals.onTime ?? 0, "text-verde-700"],
        ].map(([l, v, tone]) => (
          <div key={String(l)} className="rounded-xl border border-neutro-300 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-neutro-500">{l}</p>
            <p className={`text-2xl font-black tabular-nums ${tone}`}>{v as number}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-neutro-300 bg-white">
        <h2 className="border-b border-neutro-300 px-5 py-3 font-bold text-verde-900">Fila de atendimento</h2>
        {fila.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutro-500">Nenhuma denúncia em aberto.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutro-100 text-xs uppercase tracking-wide text-neutro-500">
                <tr>
                  <th className="px-4 py-2">Protocolo</th>
                  <th className="px-4 py-2">Categoria</th>
                  <th className="px-4 py-2">Urgência</th>
                  <th className="px-4 py-2">Sugerida</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Bairro</th>
                  <th className="px-4 py-2">Prazo</th>
                  <th className="px-4 py-2">Público</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutro-100">
                {fila.map((r) => {
                  const overdue = r.dueAt ? r.dueAt < new Date() : false;
                  return (
                    <tr key={r.id} className="hover:bg-verde-50/50">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/denuncias/${r.id}`}
                          className="font-mono font-bold text-verde-900 underline underline-offset-2"
                        >
                          {r.protocol}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{r.category}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded px-2 py-0.5 text-xs font-bold ${URGENCY_STYLE[r.urgency]}`}>
                          {URGENCY_LABEL[r.urgency]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-neutro-500">
                        {URGENCY_LABEL[r.suggestedUrgency ?? ""] ?? "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-neutro-600">{r.neighborhood?.name ?? "—"}</td>
                      <td className={`px-4 py-2.5 text-xs ${overdue ? "font-bold text-vermelho" : "text-neutro-600"}`}>
                        {r.dueAt ? r.dueAt.toLocaleDateString("pt-BR") : "—"}
                        {overdue && " (atrasado)"}
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        {r.isPublic ? (
                          <span className="rounded bg-verde-100 px-1.5 py-0.5 font-bold text-verde-900">publicado</span>
                        ) : (
                          <span className="text-neutro-500">interno</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}