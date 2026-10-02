import type { NextConfig } from "next";

/**
 * CONFIGURACAO DE PRODUCAO
 *
 * Compatibilidade de hospedagem e o ponto mais importante daqui:
 *
 * 1. `output: "standalone"` — gera `.next/standalone` com um servidor
 *    autocontido (Node minimo + arquivos necessarios). E o modo que faz o
 *    deploy funcionar em VPS/Hostinger com memoria limitada e em container.
 *    Sem isso, a plataforma precisa instalar as devDependencies em producao.
 *
 * 2. `serverExternalPackages: ["@prisma/client"]` — mantem o Prisma Client
 *    fora do bundle do Turbopack/webpack. Sem isso o driver nativo tenta ser
 *    empacotado e o build quebra em Linux (o engine foi gerado para Windows
 *    aqui, mas no host e' .deb).
 *
 * 3. `transpilePackages` cobre o barrel de tipos gerado pelo Prisma.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Headers de seguranca (§43).
  // A CSP vem do proxy (Caddy/Cloudflare) — aqui ficam os headers que o
  // Next controla diretamente.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=(), interest-cohort=()",
          },
        ],
      },
      {
        // Tiles do OpenStreetMap sao de terceiros: o mapa precisa de CSP
        // permissiva para img-src/connect-src. As demais rotas ficam restritas.
        source: "/mapa",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
              "connect-src 'self' https://*.tile.openstreetmap.org",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Prisma nunca entra no bundle.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],

  // O barrel de enums do Prisma ja e'CJS; nao ha barrel ESM para transpilar.

  // Imagens: semOptimization para o storage privado (o proxy ja servido
  // via rota autenticada; otimizar exigiria URL publica).
  images: {
    unoptimized: true,
  },

  // Log de erro legivel em producao.
  logging: {
    fetches: { fullUrl: false },
  },
};

export default nextConfig;