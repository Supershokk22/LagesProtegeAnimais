import { SiteHeader, SiteFooter } from "@/components/layout/chrome";
import { prisma } from "@/lib/db";
import { SPECIES_LABEL } from "@/components/map/categoryLabels";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Adotar — Adote um amigo",
  description:
    "Animais disponíveis para adoção em Lages/SC, com processo responsável, termo de guarda responsável e acompanhamento pós-adoção.",
};

export default async function AdoptionPage() {
  let animals: Array<{
    id: string; name: string | null; species: string; breed: string | null;
    sex: string; ageMonths: number | null; size: string | null; color: string | null;
    isNeutered: boolean; isVaccinated: boolean; specialNeeds: string | null;
    temperament: string | null;
    organization: { publicName: string; verificationStatus: string } | null;
    images: { attachment: { publicUrl: string | null } }[];
  }> = [];

  try {
    animals = await prisma.animal.findMany({
      where: { deletedAt: null, status: { in: ["DISPONIVEL", "RESERVADO"] } },
      select: {
        id: true, name: true, species: true, breed: true, sex: true, ageMonths: true,
        size: true, color: true, isNeutered: true, isVaccinated: true,
        specialNeeds: true, temperament: true,
        organization: { select: { publicName: true, verificationStatus: true } },
        images: { select: { attachment: { select: { publicUrl: true } } }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });
  } catch {
    /* banco indisponível */
  }

  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-7xl px-4 py-10">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-verde-900">Adote um amigo</h1>
          <p className="mt-3 text-lg text-neutro-700">
            Adoção em Lages passa por processo responsável. Não exigimos renda nem bairro: o que
            avaliamos é commitment com a vida do animal.
          </p>
        </header>

        <section className="mt-8 rounded-xl border border-verde-600 bg-verde-50 p-6">
          <h2 className="text-lg font-bold text-verde-900">Como funciona o processo</h2>
          <ol className="mt-3 flex flex-wrap gap-2 text-sm">
            {["Interesse", "Avaliação", "Contato", "Entrevista", "Aprovado", "Adoção", "Acompanhamento"].map(
              (s, i) => (
                <li key={s} className="rounded-full bg-white px-3 py-1 font-semibold text-verde-900">
                  <span className="mr-1 font-mono text-xs text-verde-600">{i + 1}</span>
                  {s}
                </li>
              ),
            )}
          </ol>
          <p className="mt-3 text-sm text-neutro-700">
            Após a adoção há acompanhamento em <strong>7, 30, 90 e 180 dias</strong>. Devolver o
            animal a um protetor parceira é sempre melhor do que abandonar — a rede existe para isso.
          </p>
        </section>

        {animals.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-neutro-300 bg-white p-10 text-center text-neutro-500">
            Nenhum animal disponível no momento. Novas entradas aparecem quando ONGs e protetores
            cadastram os animais.
          </p>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {animals.map((a) => (
              <li key={a.id} className="overflow-hidden rounded-xl border border-neutro-300 bg-white">
                <div className="flex aspect-[4/3] items-center justify-center bg-neutro-100 text-sm text-neutro-500">
                  {a.images[0]?.attachment.publicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.images[0].attachment.publicUrl} alt={a.name ?? "Animal"} className="h-full w-full object-cover" />
                  ) : (
                    "Sem foto"
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-verde-900">{a.name ?? SPECIES_LABEL[a.species]}</h3>
                  <p className="text-sm text-neutro-500">
                    {[SPECIES_LABEL[a.species], a.breed, a.color].filter(Boolean).join(" · ")}
                  </p>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutro-700">
                    <div><dt className="text-neutro-500">Sexo</dt><dd className="font-semibold">{a.sex}</dd></div>
                    <div>
                      <dt className="text-neutro-500">Idade</dt>
                      <dd className="font-semibold">
                        {a.ageMonths === null ? "Não informada" : a.ageMonths < 12 ? `${a.ageMonths} meses` : `${Math.floor(a.ageMonths / 12)} ano(s)`}
                      </dd>
                    </div>
                    <div><dt className="text-neutro-500">Castrado</dt><dd className="font-semibold">{a.isNeutered ? "Sim" : "Não"}</dd></div>
                    <div><dt className="text-neutro-500">Vacinado</dt><dd className="font-semibold">{a.isVaccinated ? "Sim" : "Não"}</dd></div>
                  </dl>

                  {a.specialNeeds && (
                    <p className="mt-3 rounded-md bg-amarelo/15 px-3 py-2 text-xs text-amber-900">
                      Necessidades especiais: {a.specialNeeds}
                    </p>
                  )}

                  {a.organization && (
                    <p className="mt-3 text-xs text-neutro-500">
                      {a.organization.publicName}
                      {a.organization.verificationStatus === "VERIFICADO" && (
                        <span className="ml-1 rounded bg-verde-100 px-1.5 py-0.5 font-bold text-verde-900">
                          PROJETO VERIFICADO
                        </span>
                      )}
                    </p>
                  )}

                  <a
                    href={`/adocao/${a.id}`}
                    className="mt-4 block rounded-lg bg-verde-900 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-verde-700"
                  >
                    Quero adotar
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}

        <section className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            ["Termo de guarda responsável", "Você concorda em manter o animal conforme a lei, prover abrigo, alimentação, atendimento veterinário e castração quando indicada."],
            ["Sem critério discriminatório", "Não pedimos renda, bairro, estado civil nem planos sobre filhos. Isso é ilegal e está fora da política da plataforma."],
            ["Devolução assistida", "Se não der certo, devolva ao protetor. A rede medeia e o animal não volta para a rua."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-neutro-300 bg-white p-5">
              <h2 className="font-bold text-verde-900">{t}</h2>
              <p className="mt-1.5 text-sm text-neutro-700">{d}</p>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
