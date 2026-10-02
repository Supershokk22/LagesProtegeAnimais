import type { MetadataRoute } from "next";

/** §61 SEO — sitemap com URLs públicas e áreas autenticadas excluídas. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticPages: Array<[string, number]> = [
    ["", 1.0],
    ["/denunciar", 0.95],
    ["/emergencia", 0.9],
    ["/mapa", 0.9],
    ["/adocao", 0.9],
    ["/perdidos", 0.85],
    ["/encontrados", 0.85],
    ["/ongs", 0.7],
    ["/veterinarios", 0.7],
    ["/campanhas", 0.7],
    ["/comunidade", 0.7],
    ["/voluntariado", 0.7],
    ["/orientacoes", 0.6],
    ["/como-funciona", 0.6],
    ["/sobre", 0.6],
    ["/observatorio", 0.8],
    ["/transparencia", 0.8],
    ["/legal/termos-de-uso", 0.4],
    ["/legal/politica-de-privacidade", 0.4],
    ["/legal/politica-de-cookies", 0.3],
    ["/legal/politica-de-retencao", 0.3],
  ];

  return staticPages.map(([path, priority]) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "daily",
    priority,
  }));
}