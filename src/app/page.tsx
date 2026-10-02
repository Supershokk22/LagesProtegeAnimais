import Link from "next/link";
import { SiteHeader, SiteFooter, LogoMark } from "@/components/layout/chrome";
import { prisma } from "@/lib/db";
import { kpis, monthlySeries } from "@/lib/analytics/observatorio";
import { resolvePermissions } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

/**
 * HOMEPAGE (§5)
 * Ordem exigida pelo documento:
 * Hero -> indicadores -> mapa -> adocao -> perdidos -> encontrados ->
 * campanhas -> noticias -> eventos -> ONGs -> protetores -> comunidades ->
 * contatos -> relatorios -> parceiros.
 */
export default async function HomePage() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  let k: Awaited<ReturnType<typeof kpis>> | null = null;
  let series: Awaited<ReturnType<typeof monthlySeries>> = [];
  let adoptionCount = 0;
  let lostCount = 0;
  let foundCount = 0;
  let orgCount = 0;
  let protectors = 0;

  try {
    // Sem sessao: passa no visualizador publico → k-anonimato ativo.
    k = await kpis(from, now, { permissions: resolvePermissions(["VISITOR"]) });
    series = await monthlySeries(12);
    [adoptionCount, lostCount, foundCount, orgCount, protectors] = await Promise.all([
      prisma.animal.count({ where: { deletedAt: null, status: "DISPONIVEL" } }),
      prisma.lostAnimal.count({ where: { deletedAt: null, status: "ATIVO" } }),
      prisma.foundAnimal.count({ where: { deletedAt: null, status: "ATIVO" } }),
      prisma.organization.count({ where: { isPublic: true, active: true, deletedAt: null } }),
      prisma.protector.count({ where: { status: "VERIFICADO" } }),
    ]);
  } catch {
    // Sem banco (build estatico / preview): a home renderiza com zeros reais,
    // nunca com numeros inventados.
  }

  const actions = [
    { href: "/denunciar", label: "Denunciar maus-tratos", tone: "primary" as const, desc: "Maus-tratos, abandono, falta de água, animal ferido." },
    { href: "/emergencia", label: "Animal em risco agora", tone: "danger" as const, desc: "Orientação imediata e contatos oficiais." },
    { href: "/adocao", label: "Adotar", tone: "default" as const, desc: "Animais disponíveis, com processo responsável." },
    { href: "/perdidos", label: "Perdi meu animal", tone: "default" as const, desc: "Anuncie com contato mediado." },
    { href: "/encontrados", label: "Encontrei um animal", tone: "default" as const, desc: "Tente o reencontro antes do resgate." },
    { href: "/voluntariado", label: "Quero ajudar", tone: "default" as const, desc: "Lares temporarios, transporte, divulgacao." },
    { href: "/mapa", label: "Ver mapa", tone: "default" as const, desc: "Ocorrências agregadas por região." },
  ];

  const maxTotal = Math.max(1, ...series.map((s) => s.total));

  return (
    <>
      <SiteHeader />

      <main id="conteudo">
        {/* ---------------------------------------------------------- HERO */}
        <section className="relative overflow-hidden bg-verde-900 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
                <LogoMark className="h-4 w-4" tone="light" />
                Lages · Santa Catarina
              </p>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
                Lages unida pela
                <br />
                proteção dos animais.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">
                Denuncie, acompanhe, adote, encontre, ajude e participe da construção de uma cidade
                mais segura para todos os animais.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/denunciar"
                  className="rounded-lg bg-verde-500 px-6 py-3.5 text-base font-bold text-verde-900 transition-colors hover:bg-verde-100"
                >
                  Denunciar agora
                </Link>
                <Link
                  href="/como-funciona"
                  className="rounded-lg border-2 border-white/30 px-6 py-3.5 text-base font-bold transition-colors hover:bg-white/10"
                >
                  Como funciona
                </Link>
              </div>

              <p className="mt-6 text-sm text-white/60">
                Você pode registrar sem criar conta. Toda denúncia gera protocolo{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">LPA-ANO-NNNNNN</code>.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ AÇÕES */}
        <section className="mx-auto max-w-7xl px-4 py-10" aria-labelledby="acoes">
          <h2 id="acoes" className="sr-only">
            Ações principais
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`group rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-card ${
                  a.tone === "danger"
                    ? "border-vermelho/30 bg-vermelho/5 hover:border-vermelho"
                    : a.tone === "primary"
                      ? "border-verde-900/20 bg-verde-50 hover:border-verde-900"
                      : "border-neutro-300 bg-white hover:border-verde-600"
                }`}
              >
                <span
                  className={`block text-base font-bold ${
                    a.tone === "danger" ? "text-vermelho" : "text-verde-900"
                  }`}
                >
                  {a.label}
                </span>
                <span className="mt-1.5 block text-sm text-neutro-500">{a.desc}</span>
              </Link>
            ))}
            <div className="rounded-xl border border-dashed border-neutro-300 bg-white/50 p-5">
              <span className="block text-sm font-semibold text-neutro-500">
                Transparência: nenhuma denúncia vira culpa automática. Todo caso publicado tem fonte
                verificável e data de consulta.
              </span>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- INDICADORES */}
        <section className="border-y border-neutro-300 bg-white" aria-labelledby="indicadores">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="indicadores" className="text-3xl font-black tracking-tight text-verde-900">
                  Indicadores públicos
                </h2>
                <p className="mt-2 text-sm text-neutro-500">
                  Dados agregados do ano corrente. Distribuição por bairro é suprimida quando a
                  amostra é insuficiente (k-anonimato).
                </p>
              </div>
              <Link href="/observatorio" className="text-sm font-bold text-verde-900 underline underline-offset-4">
                Ver observatório completo →
              </Link>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <Kpi label="Denúncias no ano" value={k?.reportsReceived ?? 0} />
              <Kpi label="Em aberto" value={k?.reportsOpen ?? 0} />
              <Kpi label="Urgentes/críticas" value={k?.criticalOpen ?? 0} tone="danger" />
              <Kpi label="Fora do prazo" value={k?.overdue ?? 0} tone={k?.overdue ? "danger" : "default"} />
              <Kpi label="Adoções" value={k?.adoptions ?? 0} tone="good" />
              <Kpi label="Tempo médio 1ª resposta" value={k?.avgFirstResponseHours ?? null} suffix="h" />
            </dl>

            {/* série temporal em CSS puro: zero JS no caminho crítico */}
            <div className="mt-10">
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutro-500">
                Evolução mensal das denúncias
              </h3>
              <div className="mt-4 flex h-40 items-end gap-1.5" role="img" aria-label="Série mensal de denúncias registradas">
                {series.length === 0 ? (
                  <p className="text-sm text-neutro-500">Sem série disponível.</p>
                ) : (
                  series.map((s) => (
                    <div key={s.period} className="group flex flex-1 flex-col items-center gap-1">
                      <div className="relative flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t bg-verde-500 transition-colors group-hover:bg-verde-600"
                          style={{ height: `${Math.max(3, (s.total / maxTotal) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums text-neutro-500">{s.period.slice(5)}</span>
                      <span className="sr-only">
                        {s.period}: {s.total} denúncia(s), {s.closed} encerrada(s)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- MAPA */}
        <section className="mx-auto max-w-7xl px-4 py-14" aria-labelledby="mapa">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <h2 id="mapa" className="text-3xl font-black tracking-tight text-verde-900">
                Mapa de Proteção Animal de Lages
              </h2>
              <p className="mt-3 leading-relaxed text-neutro-700">
                O mapa público mostra ocorrências <strong>agregadas por região</strong>. Nunca
                exibimos o ponto exato de uma denúncia: expor a localização de um relato expõe quem
                denunciou e quem foi citado.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-neutro-700">
                <li className="flex gap-2">
                  <span aria-hidden className="text-verde-700">✓</span> Precisão{" "}
                  <code className="rounded bg-neutro-100 px-1">EXATA</code> — apenas operadores autorizados
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-verde-700">✓</span> Precisão{" "}
                  <code className="rounded bg-neutro-100 px-1">APROXIMADA</code> — usuários autorizados
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-verde-700">✓</span> Precisão{" "}
                  <code className="rounded bg-neutro-100 px-1">AGREGADA</code> — público
                </li>
              </ul>
              <Link
                href="/mapa"
                className="mt-7 inline-block rounded-lg bg-verde-900 px-5 py-3 text-sm font-bold text-white hover:bg-verde-700"
              >
                Abrir mapa interativo
              </Link>
            </div>

            <div className="rounded-xl border border-neutro-300 bg-white p-6 shadow-card">
              <p className="text-sm font-bold uppercase tracking-wide text-neutro-500">
                Distribuição por bairro
              </p>
              <ul className="mt-4 space-y-2.5">
                {(k?.byNeighborhood ?? []).slice(0, 8).map((n) => {
                  const max = Math.max(1, ...(k?.byNeighborhood ?? []).map((x) => x.count));
                  return (
                    <li key={n.neighborhood}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className={n.suppressed ? "text-neutro-500 italic" : "font-semibold text-neutro-900"}>
                          {n.neighborhood}
                        </span>
                        <span className="tabular-nums text-neutro-500">{n.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutro-100">
                        <div
                          className={`h-full rounded-full ${n.suppressed ? "bg-neutro-300" : "bg-verde-500"}`}
                          style={{ width: `${(n.count / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
                {(k?.byNeighborhood?.length ?? 0) === 0 && (
                  <li className="text-sm text-neutro-500">Sem dados registrados no período.</li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- ANIMAIS */}
        <section className="border-y border-neutro-300 bg-white py-14" aria-labelledby="animais">
          <div className="mx-auto max-w-7xl px-4">
            <h2 id="animais" className="text-3xl font-black tracking-tight text-verde-900">
              Animais
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <BigCard href="/adocao" title="Para adoção" value={adoptionCount} desc="Processo responsável com acompanhamento." />
              <BigCard href="/perdidos" title="Perdidos" value={lostCount} desc="Anúncios ativos com contato mediado." />
              <BigCard href="/encontrados" title="Encontrados" value={foundCount} desc="Busca de correspondência com perdidos." />
              <BigCard href="/ongs" title="ONGs e protetores" value={orgCount + protectors} desc="Rede verificada documentalmente." />
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- COMO FUNCIONA */}
        <section className="mx-auto max-w-7xl px-4 py-14" aria-labelledby="como-funciona">
          <h2 id="como-funciona" className="text-3xl font-black tracking-tight text-verde-900">
            Como funciona
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { n: "01", t: "Denuncie", d: "Em 6 etapas. Emergência tem caminho reduzido." },
              { n: "02", t: "Receba protocolo", d: "LPA-ANO-NNNNNN, enviado na hora." },
              { n: "03", t: "Acompanhe", d: "Área do denunciante com status e mensagens." },
              { n: "04", t: "Órgão analisa", d: "Triagem humana define a urgência final." },
              { n: "05", t: "Atendimento", d: "Encaminhamento com SLA monitorado." },
              { n: "06", t: "Resultado", d: "Procedente, improcedente ou atendida — com justificativa." },
            ].map((s) => (
              <li key={s.n} className="rounded-xl border border-neutro-300 bg-white p-5">
                <span className="font-mono text-xs font-bold text-verde-600">{s.n}</span>
                <span className="mt-1.5 block font-bold text-neutro-900">{s.t}</span>
                <span className="mt-1 block text-sm text-neutro-500">{s.d}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* -------------------------------------------------- TRANSPARÊNCIA */}
        <section className="border-t border-neutro-300 bg-neutro-900 py-14 text-white">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-3xl font-black tracking-tight">Compromisso de transparência</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <Principle
                title="Nunca inventar"
                d="Telefone, e-mail, órgão, endereço, processo, estatística ou ONG sem fonte. Enquanto não houver confirmação oficial, exibimos PENDENTE DE VERIFICAÇÃO OFICIAL."
              />
              <Principle
                title="Nunca culpabilizar"
                d="Nenhuma denúncia transforma automaticamente uma pessoa citada em culpada. Antes da decisão competente usamos “pessoa mencionada na denúncia”."
              />
              <Principle
                title="Nunca expor"
                d="Coordenadas exatas e dados pessoais ficam restritos à equipe autorizada, com registro de auditoria de cada acesso."
              />
            </div>
            <Link
              href="/transparencia"
              className="mt-9 inline-block rounded-lg bg-white px-5 py-3 text-sm font-bold text-neutro-900 hover:bg-verde-100"
            >
              Abrir painel de transparência
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Kpi({
  label,
  value,
  suffix,
  tone = "default",
}: {
  label: string;
  value: number | null;
  suffix?: string;
  tone?: "default" | "danger" | "good";
}) {
  return (
    <div className="rounded-xl border border-neutro-300 bg-creme p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutro-500">{label}</dt>
      <dd
        className={`mt-1.5 text-3xl font-black tabular-nums ${
          tone === "danger" ? "text-vermelho" : tone === "good" ? "text-verde-700" : "text-verde-900"
        }`}
      >
        {value === null ? "—" : value}
        {value !== null && suffix ? <span className="text-lg">{suffix}</span> : null}
      </dd>
    </div>
  );
}

function BigCard({ href, title, value, desc }: { href: string; title: string; value: number; desc: string }) {
  return (
    <Link href={href} className="group rounded-xl border border-neutro-300 p-6 transition-all hover:-translate-y-0.5 hover:border-verde-600 hover:shadow-card">
      <span className="text-sm font-semibold uppercase tracking-wide text-neutro-500">{title}</span>
      <span className="mt-2 block text-4xl font-black tabular-nums text-verde-900">{value}</span>
      <span className="mt-2 block text-sm text-neutro-500">{desc}</span>
    </Link>
  );
}

function Principle({ title, d }: { title: string; d: string }) {
  return (
    <div className="border-l-2 border-verde-500 pl-5">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{d}</p>
    </div>
  );
}