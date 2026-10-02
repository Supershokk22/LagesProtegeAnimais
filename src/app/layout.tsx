import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "Lages Protege Animais";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP} — Proteção, cuidado e responsabilidade`,
    template: `%s | ${APP}`,
  },
  description:
    "Plataforma municipal de proteção e bem-estar animal de Lages/SC: denúncias de maus-tratos, resgates, adoção responsável, animais perdidos e encontrados, rede comunitária e observatório municipal.",
  applicationName: APP,
  keywords: [
    "proteção animal",
    "Lages",
    "Santa Catarina",
    "denúncia de maus-tratos",
    "abandono de animais",
    "adoção responsável",
    "Cobea",
    "bem-estar animal",
  ],
  authors: [{ name: APP }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: APP,
    title: `${APP} — Proteção, cuidado e responsabilidade`,
    description:
      "Denuncie, acompanhe, adote, encontre, ajude e participe da construção de uma cidade mais segura para todos os animais.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: APP }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP}`,
    description: "Tecnologia e comunidade protegendo vidas.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#14532d",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}