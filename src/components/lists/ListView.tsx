import { prisma } from "@/lib/db";
import { SiteHeader, SiteFooter } from "@/components/layout/chrome";
import { SPECIES_LABEL } from "@/components/map/categoryLabels";

export const dynamic = "force-dynamic";

/**
 * COMPARTILHADO por /perdidos e /encontrados.
 *
 * §24 contato MEDIADO: o telefone/e-mail do dono nunca é exibido publicamente.
 * O contato acontece dentro da plataforma, e a equipe pode mediar quando
 * necessário. Isso é proteção contra golpe e contra exposição de terceiros.
 */
export async function ListView({
  mode,
  title,
  lead,
  ctaHref,
  ctaLabel,
}: {
  mode: "lost" | "found";
  title: string;
  lead: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  type LostRow = {
    id: string; animalName: string; species: string; breed: string | null;
    sex: string; color: string | null; size: string | null; distinguishing: string | null;
    lastSeenAt: Date | null; lastSeenPlace: string | null; createdAt: Date;
  };
  type FoundRow = {
    id: string; species: string; breed: string | null; sex: string; color: string | null;
    size: string | null; distinguishing: string | null; foundAt: Date | null;
    foundPlace: string; isInjured: boolean; hasChip: boolean; createdAt: Date;
  };

  // Banco indisponivel NAO pode derrubar a pagina publica: exibir vazio,
  // nunca erro 500 nem estimativa inventada (§79, §100).
  let items: Array<LostRow | FoundRow> = [];
  try {
    items =
      mode === "lost"
        ? await prisma.lostAnimal.findMany({
            where: { deletedAt: null, status: { in: ["ATIVO", "EM_CONTATO"] } },
            select: {
              id: true, animalName: true, species: true, breed: true, sex: true, color: true,
              size: true, distinguishing: true, lastSeenAt: true, lastSeenPlace: true, createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 80,
          })
        : await prisma.foundAnimal.findMany({
            where: { deletedAt: null, status: { in: ["ATIVO", "EM_CONTATO"] } },
            select: {
              id: true, species: true, breed: true, sex: true, color: true, size: true,
              distinguishing: true, foundAt: true, foundPlace: true, isInjured: true,
              hasChip: true, createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 80,
          });
  } catch {
    items = [];
  }

  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-7xl px-4 py-10">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-verde-900">{title}</h1>
          <p className="mt-3 text-lg text-neutro-700">{lead}</p>
        </header>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={ctaHref} className="rounded-lg bg-verde-900 px-5 py-3 text-sm font-bold text-white hover:bg-verde-700">
            {ctaLabel}
          </a>
          <a
            href={mode === "lost" ? "/encontrados" : "/perdidos"}
            className="rounded-lg border border-neutro-300 px-5 py-3 text-sm font-bold hover:bg-white"
          >
            {mode === "lost" ? "Ver animais encontrados" : "Ver animais perdidos"}
          </a>
        </div>

        <p className="mt-6 rounded-lg border border-azul-institucional/30 bg-azul-claro px-4 py-3 text-sm text-blue-900">
          <strong>Contato mediado:</strong> dados pessoais de quem perdeu ou encontrou não são
          publicados. O contato acontece dentro da plataforma para evitar golpes e exposição de
          terceiros.
        </p>

        {items.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-neutro-300 bg-white p-10 text-center text-neutro-500">
            Nenhum registro ativo no momento.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const isLost = mode === "lost";
              const name = isLost ? (it as LostRow).animalName : null;
              const where = isLost ? (it as LostRow).lastSeenPlace : (it as FoundRow).foundPlace;
              const when = isLost ? (it as LostRow).lastSeenAt : (it as FoundRow).foundAt;
              const injured = isLost ? false : (it as FoundRow).isInjured;
              const chip = isLost ? false : (it as FoundRow).hasChip;

              return (
                <li key={it.id} className="rounded-xl border border-neutro-300 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-verde-900">
                      {name ?? SPECIES_LABEL[it.species]}
                    </h2>
                    {injured && (
                      <span className="rounded bg-vermelho px-2 py-0.5 text-xs font-bold text-white">FERIDO</span>
                    )}
                  </div>
                  <p className="text-sm text-neutro-500">
                    {[
                      SPECIES_LABEL[it.species],
                      it.breed,
                      it.color,
                      it.size,
                    ].filter(Boolean).join(" · ")}
                  </p>
                  {where && <p className="mt-2 text-sm text-neutro-700"><strong>Local:</strong> {where}</p>}
                  {when && (
                    <p className="text-sm text-neutro-700">
                      <strong>{isLost ? "Visto pela última vez" : "Encontrado"}:</strong>{" "}
                      {new Date(when).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {it.distinguishing && (
                    <p className="mt-2 text-sm text-neutro-700">{it.distinguishing}</p>
                  )}
                  {chip && <p className="mt-2 text-xs text-verde-700">Possui microchip — compare o número.</p>}
                  <p className="mt-3 text-xs text-neutro-400">
                    Publicado em {new Date(it.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}