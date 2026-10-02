import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Bloqueia areas autenticadas e o modulo restrito de impedimentos.
        disallow: ["/admin", "/minha-conta", "/api/", "/entrar"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}