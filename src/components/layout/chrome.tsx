import Link from "next/link";

/* ============================================================================
   IDENTIDADE VISUAL (§3)
   Simbolo: pata + escudo (protecao). Construido em SVG para funcionar em
   qualquer tamanho e em fundo claro ou escuro, sem depender de fonte de icone.
   ========================================================================== */

type LogoProps = {
  className?: string;
  variant?: "horizontal" | "vertical" | "mark";
  tone?: "dark" | "light";
};

export function LogoMark({ className = "h-10 w-10", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const shield = tone === "dark" ? "#14532D" : "#22C55E";
  const paw = tone === "dark" ? "#FAFAF5" : "#14532D";
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Lages Protege Animais">
      <title>Lages Protege Animais</title>
      {/* Escudo: protecao institucional */}
      <path
        d="M32 3 57 11v22c0 14.2-10.3 24.6-25 28C17.3 57.6 7 47.2 7 33V11L32 3Z"
        fill={shield}
      />
      {/* Paw: quatro dedos + almofada */}
      <g fill={paw}>
        <ellipse cx="22.5" cy="28" rx="3.6" ry="4.6" />
        <ellipse cx="30" cy="24.5" rx="3.7" ry="4.8" />
        <ellipse cx="37.5" cy="26.5" rx="3.6" ry="4.6" />
        <ellipse cx="43" cy="32.5" rx="3.2" ry="4.1" />
        <path d="M32 33c6.4 0 11.6 5.1 11.6 11.3 0 4.4-3.4 7.4-7.9 7.4-1.9 0-2.7-.6-3.7-.6s-1.8.6-3.7.6c-4.5 0-7.9-3-7.9-7.4C20.4 38.1 25.6 33 32 33Z" />
      </g>
    </svg>
  );
}

export function Logo({ className = "", variant = "horizontal", tone = "dark" }: LogoProps) {
  const primary = tone === "dark" ? "text-verde-900" : "text-white";
  const secondary = tone === "dark" ? "text-neutro-500" : "text-white/80";

  if (variant === "mark") return <LogoMark className={className} tone={tone} />;

  if (variant === "vertical") {
    return (
      <span className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <LogoMark className="h-14 w-14" tone={tone} />
        <span className={`text-center text-sm font-extrabold uppercase tracking-widest ${primary}`}>
          Lages
          <br />
          Protege
          <br />
          Animais
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9" tone={tone} />
      <span className="flex flex-col leading-none">
        <span className={`text-[15px] font-extrabold uppercase tracking-[0.14em] ${primary}`}>
          Lages Protege
        </span>
        <span className={`text-[13px] font-bold uppercase tracking-[0.28em] ${secondary}`}>Animais</span>
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */

export function SiteHeader() {
  const nav = [
    { href: "/denunciar", label: "Denunciar", accent: true },
    { href: "/mapa", label: "Mapa" },
    { href: "/emergencia", label: "Emergência" },
    { href: "/adocao", label: "Adotar" },
    { href: "/perdidos", label: "Perdidos" },
    { href: "/encontrados", label: "Encontrados" },
    { href: "/comunidade", label: "Comunidade" },
    { href: "/ongs", label: "ONGs" },
    { href: "/observatorio", label: "Observatório" },
    { href: "/transparencia", label: "Transparência" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutro-300 bg-creme/95 backdrop-blur no-print">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" aria-label="Página inicial — Lages Protege Animais">
          <Logo />
        </Link>

        <nav aria-label="Navegação principal" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {nav.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-neutro-700 transition-colors hover:bg-verde-50 hover:text-verde-900"
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <Link
            href="/entrar"
            className="rounded-md px-4 py-2 text-sm font-semibold text-neutro-700 hover:bg-neutro-100"
          >
            Entrar
          </Link>
          <Link
            href="/denunciar"
            className="rounded-md bg-verde-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-verde-700"
          >
            Denunciar
          </Link>
        </div>
      </div>

      {/* Faixa de emergencia sempre visível — caso de vida */}
      <div className="bg-vermelho text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 text-xs font-semibold">
          <span className="uppercase tracking-wide">Emergência:</span>
          <span>Animal em risco agora? Acesse a central de emergência.</span>
          <Link href="/emergencia" className="underline underline-offset-2">
            Abrir central →
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const cols = [
    {
      title: "Denunciar e acompanhar",
      links: [
        { href: "/denunciar", label: "Registrar denúncia" },
        { href: "/denunciar/consultar", label: "Consultar protocolo" },
        { href: "/emergencia", label: "Animal em risco agora" },
        { href: "/orientacoes", label: "Orientações" },
      ],
    },
    {
      title: "Animais",
      links: [
        { href: "/adocao", label: "Adotar" },
        { href: "/perdidos", label: "Perdi meu animal" },
        { href: "/encontrados", label: "Encontrei um animal" },
        { href: "/voluntariado", label: "Quero ajudar" },
      ],
    },
    {
      title: "Rede",
      links: [
        { href: "/ongs", label: "ONGs e protetores" },
        { href: "/veterinarios", label: "Clínicas e veterinários" },
        { href: "/comunidade", label: "Comunidades" },
        { href: "/campanhas", label: "Campanhas e eventos" },
      ],
    },
    {
      title: "Institucional",
      links: [
        { href: "/observatorio", label: "Observatório municipal" },
        { href: "/transparencia", label: "Painel de transparência" },
        { href: "/como-funciona", label: "Como funciona" },
        { href: "/sobre", label: "Sobre a plataforma" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/legal/termos-de-uso", label: "Termos de uso" },
        { href: "/legal/politica-de-privacidade", label: "Política de privacidade" },
        { href: "/legal/politica-de-cookies", label: "Política de cookies" },
        { href: "/legal/politica-de-retencao", label: "Política de retenção" },
      ],
    },
  ];

  return (
    <footer className="mt-20 border-t border-neutro-300 bg-neutro-900 text-neutro-300 no-print">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="max-w-xs">
            <Logo tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-neutro-500">
              Proteção, cuidado e responsabilidade. Tecnologia e comunidade protegendo vidas em Lages-SC.
            </p>
            <p className="mt-4 text-xs text-neutro-500">
              Nenhuma denúncia transforma automaticamente uma pessoa citada em culpada. Todo caso
              publicado possui fonte verificável.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {cols.map((c) => (
              <div key={c.title}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-white">{c.title}</h2>
                <ul className="mt-3 space-y-2">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-neutro-500 hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-neutro-500">
          <p>
            © {new Date().getFullYear()} Lages Protege Animais. Projeto de utilidade pública.
          </p>
          <p className="mt-1">
            Em caso de risco iminente, acione imediatamente os canais oficiais de emergência. Esta
            plataforma não substitui o atendimento emergencial.
          </p>
        </div>
      </div>
    </footer>
  );
}