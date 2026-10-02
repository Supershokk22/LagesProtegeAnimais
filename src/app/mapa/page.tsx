import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/layout/chrome";
import { publicHeatmap } from "@/lib/analytics/observatorio";
import { CATEGORY_LABEL } from "@/components/map/categoryLabels";
import MapView from "@/components/map/MapLoader";


export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa de Proteção Animal de Lages",
  description:
    "Mapa de ocorrências agregadas por região: denúncias, animais perdidos e encontrados, adoções, ONGs, clínicas e campanhas.",
};

export default async function MapPage() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  let points: Awaited<ReturnType<typeof publicHeatmap>> = [];
  try {
    points = await publicHeatmap(from, now);
  } catch {
    /* banco indisponível */
  }

  // Alternativa textual: requisito de acessibilidade (§60) e melhor SEO.
  const grouped = new Map<string, { count: number; lat: number; lng: number }>();
  for (const p of points) {
    const key = `${p.lat},${p.lng}`;
    const g = grouped.get(key) ?? { count: 0, lat: p.lat, lng: p.lng };
    g.count += p.count;
    grouped.set(key, g);
  }

  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-7xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-verde-900">
            Mapa de Proteção Animal de Lages
          </h1>
          <p className="mt-2 max-w-3xl text-neutro-700">
            O mapa público exibe <strong>ocorrências agregadas por região</strong>. Nunca mostramos o
            ponto exato de uma denúncia — isso protegeria quem denunciou e quem foi citado.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <MapView points={points} showHeatmap />

            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              {[
                ["#dc2626", "Animal ferido / atropelamento"],
                ["#ea580c", "Risco imediato / preso"],
                ["#f59e0b", "Agressão / negligência"],
                ["#14532d", "Demais categorias"],
              ].map(([c, l]) => (
                <span key={l} className="flex items-center gap-2">
                  <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: c }} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl border border-neutro-300 bg-white p-5" aria-labelledby="precisao">
              <h2 id="precisao" className="font-bold text-verde-900">
                Níveis de precisão
              </h2>
              <dl className="mt-3 space-y-3 text-sm">
                {[
                  ["Exata", "Somente operadores autorizados. Exige 2FA e gera log de auditoria."],
                  ["Aproximada", "Usuários autorizados. Ponto deslocado dentro de um raio limitado."],
                  ["Agregada", "Público. Centro da grade da região; sem informação de endereço."],
                ].map(([t, d]) => (
                  <div key={t}>
                    <dt className="font-bold text-neutro-900">{t}</dt>
                    <dd className="text-neutro-600">{d}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-xl border border-neutro-300 bg-white p-5" aria-labelledby="regioes">
              <h2 id="regioes" className="font-bold text-verde-900">
                Regiões com registro
              </h2>
              {grouped.size === 0 ? (
                <p className="mt-2 text-sm text-neutro-500">
                  Nenhuma ocorrência publicada no período. Casos só aparecem depois de verificação de
                  fonte pela equipe.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {[...grouped.entries()]
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 12)
                    .map(([key, v]) => {
                      const [lat, lng] = key.split(",").map(Number);
                      return (
                        <li key={key} className="flex items-baseline justify-between gap-3 border-b border-neutro-100 pb-1.5">
                          <span className="font-mono text-xs text-neutro-600">
                            {lat.toFixed(2)}, {lng.toFixed(2)}
                          </span>
                          <span className="tabular-nums font-bold text-neutro-900">{v.count}</span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-neutro-300 bg-white p-5">
              <h2 className="font-bold text-verde-900">Filtros</h2>
              <div className="mt-3 space-y-2">
                <Link href="/denunciar" className="block text-sm font-semibold text-verde-900 underline underline-offset-2">
                  Registrar ocorrência
                </Link>
                <Link href="/perdidos" className="block text-sm font-semibold text-verde-900 underline underline-offset-2">
                  Animais perdidos
                </Link>
                <Link href="/encontrados" className="block text-sm font-semibold text-verde-900 underline underline-offset-2">
                  Animais encontrados
                </Link>
                <Link href="/ongs" className="block text-sm font-semibold text-verde-900 underline underline-offset-2">
                  ONGs, clínicas e pontos de apoio
                </Link>
              </div>
            </section>

            <p className="text-xs text-neutro-500">
              Dados do período: {from.toISOString().slice(0, 10)} a {now.toISOString().slice(0, 10)}.
              {[...new Set(points.map((p) => p.category))]
                .filter((c) => CATEGORY_LABEL[c])
                .map((c) => CATEGORY_LABEL[c])
                .join(" · ") || "Sem categorias no período."}
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}