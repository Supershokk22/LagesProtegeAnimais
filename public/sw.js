/* eslint-disable no-restricted-globals */
/**
 * SERVICE WORKER — LAGES PROTEGE ANIMAIS (§63, §65)
 *
 * Estratégia:
 *  - PRECACHE: casca do app (HTML/CSS/JS essencial). Sem isso não há
 *    "instalabilidade" nem abertura offline.
 *  - NAVIGATION: network-first com fallback de página offline. Uma denúncia
 *    precisa ser mais nova que o cache, nunca mais velha.
 *  - ESTÁTICOS (/_next/static): cache-first, imutável por hash de build.
 *  - API GET público: stale-while-revalidate — mapa, adoção e observatório
 *    abrem instantaneamente e atualizam em segundo plano.
 *  - API POST: NUNCA cacheada. Uma denúncia em rascunho é responsabilidade do
 *    formulário (localStorage), não do service worker.
 *
 * §65 MODO DE BAIXA CONECTIVIDADE: o rascunho vive em localStorage e o envio
 * é explícito. O SW apenas garante que a página não quebra sem rede.
 */

const VERSION = "v1";
const CACHE_STATIC = `lpa-static-${VERSION}`;
const CACHE_PAGES = `lpa-pages-${VERSION}`;
const CACHE_API = `lpa-api-${VERSION}`;
const CACHE_OFFLINE = `lpa-offline-${VERSION}`;

const PRECACHE_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const OFFLINE_FALLBACK = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_STATIC);
      // addAll falha inteiro se um item falhar: adiciona um a um.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("lpa-") && !k.endsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Nunca cachear páginas autenticadas: servir HTML de outra sessão é vazamento.
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/minha-conta")) {
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(handleNavigation(req));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }

  if (url.pathname.startsWith("/api/v1/") && url.searchParams.get("layer")) {
    event.respondWith(staleWhileRevalidate(req, CACHE_API));
    return;
  }

  if (req.destination === "style" || req.destination === "script" || req.destination === "font") {
    event.respondWith(staleWhileRevalidate(req, CACHE_STATIC));
  }
});

async function handleNavigation(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_PAGES);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(req, { ignoreSearch: false });
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_FALLBACK, { cacheName: CACHE_OFFLINE });
    if (offline) return offline;
    const fallback = await caches.open(CACHE_OFFLINE);
    const page = await fallback.match(OFFLINE_FALLBACK);
    return (
      page ??
      new Response(
        "<!doctype html><meta charset=utf-8><title>Offline</title><h1>Você está offline</h1><p>Sem conexão com a internet. Seu rascunho de denúncia continua salvo neste dispositivo.</p>",
        { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
      )
    );
  }
}

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req, { cacheName });
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(cacheName);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    return new Response("", { status: 504 });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);
  return cached ?? (await network) ?? new Response("", { status: 504 });
}

/* --- Push (§42, §63) ---------------------------------------------------- */

self.addEventListener("push", (event) => {
  let payload = { title: "Lages Protege Animais", body: "Você tem uma atualização.", url: "/" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* payload malformado */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.url,
      data: { url: payload.url },
      requireInteraction: false,
      vibrate: [120, 60, 120],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? "/"));
});