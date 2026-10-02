import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/layout/chrome";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Animal em risco agora",
  description:
    "Central de emergência: orientações imediatas e contatos oficiais de Lages/SC para risco a animais, com fonte e data de verificação.",
};

/**
 * CENTRAL DE EMERGENCIA (§14)
 *
 * Tela SIMPLES por desenho. Regras:
 *  - nada de telefone inventado: sem `sourceUrl`, o card exibe
 *    "PENDENTE DE VERIFICACAO OFICIAL" e NAO mostra número;
 *  - a data da última verificação é sempre exibida;
 *  - a tela nunca pede cadastro (§99).
 */
export default async function EmergencyPage() {
  let contacts: Array<{
    id: string;
    organizationName: string;
    department: string | null;
    serviceType: string;
    phone: string | null;
    whatsapp: string | null;
    website: string | null;
    address: string | null;
    openingHours: string | null;
    status: string;
    sourceUrl: string | null;
    verifiedAt: Date | null;
    isEmergency: boolean;
  }> = [];

  try {
    contacts = await prisma.officialContact.findMany({
      where: { deletedAt: null },
      orderBy: [{ isEmergency: "desc" }, { displayOrder: "asc" }],
      select: {
        id: true, organizationName: true, department: true, serviceType: true,
        phone: true, whatsapp: true, website: true, address: true,
        openingHours: true, status: true, sourceUrl: true, verifiedAt: true, isEmergency: true,
      },
    });
  } catch {
    /* banco indisponível */
  }

  const emergency = contacts.filter((c) => c.isEmergency);
  const others = contacts.filter((c) => !c.isEmergency);

  const steps = [
    {
      t: "Não se exponha",
      d: "Não confronte quem estiver no local. Sua segurança vem antes de qualquer prova.",
    },
    {
      t: "Registre com precisão",
      d: "Data, hora, bairro e ponto de referência. Foto é útil, mas nunca exponha sua casa.",
    },
    {
      t: "Acione o canal oficial",
      d: "Emergência policial em ocorrência em andamento;Disque-Denúncia 181 e os órgãos abaixo.",
    },
    {
      t: "Não recolha sem condições",
      d: "Só aceite o animal se tiver alimentação, água, espaço fechado e meio de transporte ao atendimento.",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main id="conteudo">
        <section className="bg-vermelho text-white">
          <div className="mx-auto max-w-4xl px-4 py-12">
            <p className="text-sm font-bold uppercase tracking-widest text-white/80">Emergência</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Animal em risco agora</h1>
            <p className="mt-4 text-lg leading-relaxed text-white/90">
              Se há risco à vida do animal ou à sua integridade, acione imediatamente os canais
              oficiais. Esta tela é simples de propósito.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-10">
          <ol className="grid gap-3 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.t} className="rounded-xl border border-neutro-300 bg-white p-5">
                <span className="font-mono text-xs font-bold text-vermelho">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="mt-1 font-bold text-neutro-900">{s.t}</h2>
                <p className="mt-1 text-sm text-neutro-700">{s.d}</p>
              </li>
            ))}
          </ol>

          {emergency.length > 0 && (
            <section className="mt-12" aria-labelledby="emerg">
              <h2 id="emerg" className="text-2xl font-black tracking-tight text-verde-900">
                Canais de emergência
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {emergency.map((c) => (
                  <ContactCard key={c.id} c={c} highlight />
                ))}
              </div>
            </section>
          )}

          <section className="mt-12" aria-labelledby="outros">
            <h2 id="outros" className="text-2xl font-black tracking-tight text-verde-900">
              Órgãos e entidades
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {others.map((c) => (
                <ContactCard key={c.id} c={c} />
              ))}
            </div>
            {contacts.length === 0 && (
              <p className="mt-4 rounded-lg border border-dashed border-neutro-300 bg-white p-6 text-sm text-neutro-500">
                Nenhum contato oficial cadastrado. Enquanto a equipe não verifica os dados junto aos
                órgãos, nada é exibido — preferimos um campo em branco a um telefone errado.
              </p>
            )}
          </section>

          <section className="mt-12 rounded-xl border-2 border-verde-900 bg-verde-50 p-6">
            <h2 className="text-lg font-bold text-verde-900">Prefere registrar por aqui?</h2>
            <p className="mt-2 text-sm text-neutro-700">
              O fluxo de denúncia em modo emergência tem menos etapas e gera protocolo na hora.
              Complementar, nunca substituto.
            </p>
            <a
              href="/denunciar"
              className="mt-4 inline-block rounded-lg bg-verde-900 px-5 py-3 text-sm font-bold text-white hover:bg-verde-700"
            >
              Registrar denúncia
            </a>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function ContactCard({
  c,
  highlight = false,
}: {
  c: {
    id: string;
    organizationName: string;
    department: string | null;
    serviceType: string;
    phone: string | null;
    whatsapp: string | null;
    website: string | null;
    address: string | null;
    openingHours: string | null;
    status: string;
    sourceUrl: string | null;
    verifiedAt: Date | null;
    isEmergency: boolean;
  };
  highlight?: boolean;
}) {
  const verified = c.status === "VERIFICADO" && !!c.sourceUrl;
  const verifiable = !!c.sourceUrl;

  return (
    <article
      className={`rounded-xl border bg-white p-5 ${
        highlight ? "border-vermelho/40" : "border-neutro-300"
      }`}
    >
      <h3 className="font-bold text-neutro-900">{c.organizationName}</h3>
      {c.department && <p className="text-sm font-medium text-neutro-700">{c.department}</p>}
      <p className="mt-1 text-sm text-neutro-500">{c.serviceType}</p>

      {/* REGRA §14: nunca exibir telefone sem fonte */}
      {c.phone && verifiable ? (
        <a href={`tel:${c.phone.replace(/\D/g, "")}`} className="mt-3 block text-2xl font-black text-verde-900">
          {c.phone}
        </a>
      ) : (
        <p className="mt-3 rounded-md bg-neutro-100 px-3 py-2 text-sm font-semibold text-neutro-500">
          PENDENTE DE VERIFICAÇÃO OFICIAL
        </p>
      )}

      {c.whatsapp && verifiable && (
        <p className="mt-1 text-sm text-neutro-700">WhatsApp: {c.whatsapp}</p>
      )}
      {c.address && verifiable && <p className="mt-1 text-sm text-neutro-700">{c.address}</p>}
      {c.openingHours && <p className="mt-1 text-sm text-neutro-500">Atendimento: {c.openingHours}</p>}

      {c.website && (
        <a
          href={c.website}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-3 inline-block text-sm font-semibold text-azul-institucional underline underline-offset-2"
        >
          Site oficial ↗
        </a>
      )}

      <p className="mt-3 border-t border-neutro-300 pt-2 text-xs text-neutro-500">
        {verified
          ? `Última verificação: ${c.verifiedAt!.toLocaleDateString("pt-BR")}`
          : "Não verificado — confirme o contato diretamente no site oficial antes de usar."}
      </p>
    </article>
  );
}