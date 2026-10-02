import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/layout/chrome";
import { kpis, monthlySeries, slaBoard } from "@/lib/analytics/observatorio";
import { resolvePermissions } from "@/lib/auth/permissions";
import { CATEGORY_LABEL, URGENCY_LABEL } from "@/components/map/categoryLabels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Observatório Municipal de Proteção Animal",
  description:
    "Indicadores públicos de denúncias, atendimentos, resgates, adoções, reencontros, castrações e incessos Ocorridos ao longo do tempo.",
};

export default async function ObservatoryPage() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  let k: Awaited<ReturnType<typeof kpis>> | null = null;
  let series: Awaited<ReturnType<typeof monthlySeries>> = [];
  let sla: Awaited<ReturnType<typeof slaBoard>> | null = null;

  try {
    // Visualizador público: k-anonimato ativo (MIN_CELL_SIZE = 5)
    k = await kpis(from, now, { permissions: resolvePermissions(["VISITOR"]) });
    series = await monthlySeries(12);
    sla = await slaBoard();
  } catch {
    /* banco indisponível */
  }

  const maxSeries = Math.max(1, ...series.map((s) => s.total));
  const maxCat = Math.max(1, ...(k?.byCategory ?? []).map((c) => c.count));

  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-7xl px-4 py-10">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-verde-900">
            Observatório Municipal de Proteção Animal
          </h1>
          <p className="mt-3 text-lg text-neutro-700">
            Números do ano corrente, consolidados apenas a partir de registros protocolados na
            plataforma. Nenhum indicador aqui é estimado ou projetado.
          </p>
        </header>

        <section className="mt-8" aria-labelledby="volume">
          <h2 id="volume" className="text-xl font-bold text-verde-900">Volume de registros</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {[
              ["Denúncias", k?.reportsReceived ?? 0],
              ["Encerradas", k?.reportsClosed ?? 0],
              ["Em aberto", k?.reportsOpen ?? 0],
              ["Fora do prazo", k?.overdue ?? 0],
              ["Adoções", k?.adoptions ?? 0],
              ["Reencontros", k?.reunions ?? 0],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-xl border border-neutro-300 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutro-500">{l}</p>
                <p className="mt-1 text-3xl font-black tabular-nums text-verde-900">{v as number}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-neutro-300 bg-white p-6">
            <h2 className="text-xl font-bold text-verde-900">Série mensal</h2>
            <div className="mt-5 flex h-52 items-end gap-1.5">
              {series.length === 0 ? (
                <p className="text-sm text-neutro-500">Sem série disponível.</p>
              ) : (
                series.map((s) => (
                  <div key={s.period} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-bold tabular-nums text-neutro-600">{s.total}</span>
                    <div
                      className="w-full rounded-t bg-verde-500"
                      style={{ height: `${Math.max(3, (s.total / maxSeries) * 100)}%` }}
                    />
                    <span className="text-[10px] text-neutro-500">{s.period.slice(5)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutro-300 bg-white p-6">
            <h2 className="text-xl font-bold text-verde-900">Distribuição por categoria</h2>
            <ul className="mt-5 space-y-3">
              {(k?.byCategory ?? []).slice(0, 10).map((c) => (
                <li key={c.category}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-neutro-900">
                      {CATEGORY_LABEL[c.category] ?? c.category}
                    </span>
                    <span className="tabular-nums text-neutro-500">{c.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutro-100">
                    <div className="h-full rounded-full bg-verde-600" style={{ width: `${(c.count / maxCat) * 100}%` }} />
                  </div>
                </li>
              ))}
              {(k?.byCategory?.length ?? 0) === 0 && (
                <li className="text-sm text-neutro-500">Sem registros no período.</li>
              )}
            </ul>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-neutro-300 bg-white p-6">
            <h2 className="text-xl font-bold text-verde-900">Urgência em aberto</h2>
            <ul className="mt-4 space-y-2">
              {(k?.byUrgency ?? []).map((u) => (
                <li key={u.urgency} className="flex items-center justify-between border-b border-neutro-100 py-2 text-sm">
                  <span className="font-semibold text-neutro-900">{URGENCY_LABEL[u.urgency] ?? u.urgency}</span>
                  <span className="tabular-nums text-neutro-500">{u.count}</span>
                </li>
              ))}
              {(k?.byUrgency?.length ?? 0) === 0 && <li className="text-sm text-neutro-500">Sem dados.</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-neutro-300 bg-white p-6">
            <h2 className="text-xl font-bold text-verde-900">Rede e resultados</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              {[
                ["ONGs verificadas", k?.ongsPartner ?? 0],
                ["Protetores verificados", k?.verifiedProtectors ?? 0],
                ["Voluntários", k?.volunteers ?? 0],
                ["Castrações", k?.castrations ?? 0],
                ["Vacinações", k?.vaccinations ?? 0],
                ["Campanhas ativas", k?.campaignsActive ?? 0],
                ["Animais disponíveis", k?.animalsAvailable ?? 0],
                ["Anuncios de perdidos", k?.lostActive ?? 0],
              ].map(([l, v]) => (
                <div key={String(l)} className="rounded-lg bg-neutro-100 p-3">
                  <dt className="text-xs text-neutro-500">{l}</dt>
                  <dd className="text-xl font-black tabular-nums text-verde-900">{v as number}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-neutro-300 bg-white p-6">
          <h2 className="text-xl font-bold text-verde-900">Painel de SLA</h2>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="rounded-lg bg-vermelho/10 px-3 py-2 font-bold text-vermelho">
              {sla?.totals.overdue ?? 0} fora do prazo
            </span>
            <span className="rounded-lg bg-amarelo/15 px-3 py-2 font-bold text-amber-900">
              {sla?.totals.dueSoon ?? 0} vencem em 24 h
            </span>
            <span className="rounded-lg bg-verde-100 px-3 py-2 font-bold text-verde-900">
              {sla?.totals.onTime ?? 0} no prazo
            </span>
          </div>
          <p className="mt-3 text-xs text-neutro-500">
            Os tempos de SLA são estrutura técnica. Os prazos oficiais devem ser definidos pelo órgão
            competente e registrados em <code className="rounded bg-neutro-100 px-1">sla_policies.defined_by_org</code>.
          </p>
        </section>

        <section className="mt-10 rounded-xl border border-dashed border-neutro-300 bg-white p-6">
          <h2 className="text-xl font-bold text-verde-900">Limitações metodológicas</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutro-700">
            {[
              "Denúncia registrada não equivale a fato confirmado. Casos só são publicados com fonte verificável.",
              "Subnotificação e sub-registro são prováveis e não são medidos por esta plataforma.",
              "Distribuição espacial usa agregação por grade: leitura de ordem de grandeza, não contagem precisa.",
              "A equipe de triagem define a urgência final; a declaração do cidadão é apenas um insumo.",
              "Nenhum número aqui é projetado. Campo sem dado exibe traço, não estimativa.",
            ].map((t) => (
              <li key={t} className="flex gap-2"><span aria-hidden className="text-neutro-400">•</span>{t}</li>
            ))}
          </ul>
          <Link href="/transparencia" className="mt-5 inline-block text-sm font-bold text-verde-900 underline underline-offset-4">
            Ver painel de transparência →
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}