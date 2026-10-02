import { SiteHeader, SiteFooter } from "@/components/layout/chrome";

export const metadata = {
  title: "Você está offline",
  description: "Página de fallback para modo de baixa conectividade.",
};

/** §65 — modo de baixa conectividade. O rascunho NÃO é perdido. */
export default function OfflinePage() {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-black tracking-tight text-verde-900">Você está sem conexão</h1>
        <p className="mt-3 text-neutro-700">
          Não há internet no momento. As páginas abaixo já salvas continuam disponíveis.
        </p>

        <div className="mt-6 rounded-xl border border-amarelo bg-amarelo/10 p-5">
          <h2 className="font-bold text-amber-900">Sua denúncia não foi perdida</h2>
          <p className="mt-1 text-sm text-neutro-700">
            O rascunho fica salvo neste dispositivo até você enviar. Ao reconectar, volte à página de
            denúncia e conclua o envio.
          </p>
        </div>

        <ul className="mt-6 space-y-2 text-sm">
          {[["/denunciar", "Registrar denúncia (rascunho salvo)"], ["/emergencia", "Contatos oficiais de emergência"], ["/perdidos", "Animais perdidos"], ["/observatorio", "Observatório"]].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="font-semibold text-verde-900 underline underline-offset-4">{label}</a>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-neutro-600">
          Em risco iminente, acione os canais oficiais — eles não dependem deste site.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}