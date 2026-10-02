import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/layout/chrome";
import { prisma } from "@/lib/db";
import { monthlySeries, slaBoard, publicHeatmap } from "@/lib/analytics/observatorio";
import { CATEGORY_LABEL } from "@/components/map/categoryLabels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel de Transparência",
  description:
    "Central de transparência: somente dados agregados, anonimizados e revisados. Nenhum dado pessoal é exibido.",
};

/**
 * PAINEL DE TRANSPARÊNCIA (§100)
 * Regra dura: este arquivo NÃO importa nenhuma coluna de dado pessoal.
 * Todo acesso é por função agregadora com k-anonimato.
 */
export default async function TransparencyPage() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  let series: Awaited<ReturnType<typeof monthlySeries>> = [];
  let heat: Awaited<ReturnType<typeof publicHeatmap>> = [];
  let maxSeries = 1;
  let slaTotals = { overdue: 0, dueSoon: 0, onTime: 0 };
  let counts = {
    reportsPublished: 0,
    reportsPendingSource: 0,
    contactsVerified: 0,
    contactsPending: 0,
    orgsVerified: 0,
    protectorsVerified: 0,
    animalsPublished: 0,
  };

  try {
    series = await monthlySeries(12);
    maxSeries = Math.max(1, ...series.map((s) => s.total));
    slaTotals = (await slaBoard()).totals;
    heat = await publicHeatmap(from, now);

    const [
      reportsPublished,
      reportsPendingSource,
      contactsVerified,
      contactsPending,
      orgsVerified,
      protectorsVerified,
      animalsPublished,
    ] = await Promise.all([
      prisma.report.count({ where: { isPublic: true, deletedAt: null } }),
      prisma.report.count({
        where: { deletedAt: null, isPublic: false, status: { in: ["REABERTA", "FINALIZADA", "ATENDIDA"] } },
      }),
      prisma.officialContact.count({ where: { status: "VERIFICADO", deletedAt: null } }),
      prisma.officialContact.count({ where: { status: { not: "VERIFICADO" }, deletedAt: null } }),
      prisma.organization.count({ where: { verificationStatus: "VERIFICADO", deletedAt: null } }),
      prisma.protector.count({ where: { status: "VERIFICADO" } }),
      prisma.animal.count({ where: { status: "DISPONIVEL", deletedAt: null } }),
    ]);

    counts = {
      reportsPublished,
      reportsPendingSource,
      contactsVerified,
      contactsPending,
      orgsVerified,
      protectorsVerified,
      animalsPublished,
    };
  } catch {
    /* banco indisponível: exibir zeros, nunca estimativas */
  }

  const totalContacts = counts.contactsVerified + counts.contactsPending;

  const cards: Array<[string, number, string]> = [
    ["Casos publicados", counts.reportsPublished, "Somente com fonte verificável"],
    ["Aguardando verificação de fonte", counts.reportsPendingSource, "Não exibidos publicamente"],
    ["Contatos oficiais verificados", counts.contactsVerified, `de ${totalContacts} cadastrados`],
    ["Contatos pendentes", counts.contactsPending, "Exibem PENDENTE DE VERIFICAÇÃO OFICIAL"],
    ["Fora do prazo (SLA)", slaTotals.overdue, "Casos abertos além do prazo"],
    ["ONGs verificadas", counts.orgsVerified, "Documentação conferida"],
    ["Protetores verificados", counts.protectorsVerified, "Exibem selo"],
    ["Animais para adoção", counts.animalsPublished, "Publicados"],
  ];

  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-7xl px-4 py-10">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-verde-900">Painel de transparência</h1>
          <p className="mt-3 text-lg text-neutro-700">
            Este painel exibe <strong>somente dados agregados, anonimizados e revisados</strong>.
            Nenhum nome, e-mail, telefone, endereço ou coordenada exata é apresentado.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([l, v, d]) => (
            <div key={l} className="rounded-xl border border-neutro-300 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutro-500">{l}</p>
              <p className="mt-1 text-3xl font-black tabular-nums text-verde-900">{v}</p>
              <p className="mt-1 text-xs text-neutro-500">{d}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-xl border border-neutro-300 bg-white p-6">
          <h2 className="text-xl font-bold text-verde-900">Série mensal de ocorrências publicadas</h2>
          <div className="mt-5 flex h-40 items-end gap-1.5" role="img" aria-label="Série mensal de ocorrências publicadas">
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
        </section>

        <section className="mt-10 rounded-xl border border-neutro-300 bg-white p-6">
          <h2 className="text-xl font-bold text-verde-900">Registro público de ocorrências</h2>
          {heat.length === 0 ? (
            <p className="mt-3 text-sm text-neutro-500">
              Nenhuma ocorrência com fonte verificada foi publicada até o momento. Enquanto não houver
              confirmação oficial, o sistema exibe &quot;INFORMACAO PENDENTE DE VERIFICACAO&quot; e não
              publica o caso.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Ocorrências publicadas agregadas por período, categoria, situação e célula geográfica
                </caption>
                <thead>
                  <tr className="border-b border-neutro-300 text-xs uppercase tracking-wide text-neutro-500">
                    <th scope="col" className="py-2 pr-4">Período</th>
                    <th scope="col" className="py-2 pr-4">Categoria</th>
                    <th scope="col" className="py-2 pr-4">Situação</th>
                    <th scope="col" className="py-2 pr-4">Ocorrências</th>
                    <th scope="col" className="py-2">Célula (agregada)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutro-100">
                  {heat.slice(0, 40).map((h) => (
                    <tr key={h.key}>
                      <td className="py-2 pr-4 tabular-nums">{h.period}</td>
                      <td className="py-2 pr-4">{CATEGORY_LABEL[h.category] ?? h.category}</td>
                      <td className="py-2 pr-4">{h.status}</td>
                      <td className="py-2 pr-4 tabular-nums font-bold">{h.count}</td>
                      <td className="py-2 font-mono text-xs text-neutro-500">
                        {h.lat}, {h.lng}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            [
              "Fontes aceitas",
              "Prefeitura de Lages, Câmara Municipal, Polícia Civil, Polícia Militar Ambiental, Ministério Público, Tribunal de Justiça, IBAMA, órgãos estaduais e federais, imprensa confiável.",
            ],
            [
              "O que nunca fazemos",
              "Publicar coordenada exata de relato, nome de pessoa citada, contato de terceiros, estatística sem método declarado, ou caso sem fonte.",
            ],
            [
              "Retificação",
              "Informação publicada com erro é retirada e o registro de correção fica no histórico interno de auditoria.",
            ],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-neutro-300 bg-white p-5">
              <h2 className="font-bold text-verde-900">{t}</h2>
              <p className="mt-1.5 text-sm text-neutro-700">{d}</p>
            </div>
          ))}
        </section>

        <p className="mt-10 text-sm text-neutro-600">
          Solicitações de dados do titular:{" "}
          <Link
            href="/legal/politica-de-privacidade"
            className="font-semibold text-verde-900 underline underline-offset-4"
          >
            Política de Privacidade
          </Link>{" "}
          · Prazo de resposta: 15 dias.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}