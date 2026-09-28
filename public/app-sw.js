/**
 * Service worker de ToolsFoto (app instalable).
 *
 * Lo registra AppShell.astro solo en producción. Se llama app-sw.js y no
 * sw.js para no chocar con el archivo que algunas redes de anuncios piden
 * subir a la raíz para sus notificaciones push.
 *
 * Estrategias (solo peticiones GET del propio dominio; lo de terceros —
 * anuncios, analytics, CDN de FFmpeg, modelo de IA— no se toca nunca):
 *   - Páginas (navegación): red primero. Se guarda una copia para poder abrir
 *     sin conexión las páginas ya visitadas; si no hay copia, /offline.
 *     Como siempre se intenta la red antes, un deploy nuevo se ve al momento.
 *   - /_astro/*: caché primero. Los nombres llevan hash de contenido, así que
 *     un archivo con el mismo nombre nunca cambia.
 *   - Iconos, manifiesto e índice del buscador: se sirve la copia y se
 *     actualiza en segundo plano.
 *   - /ads/* queda fuera: los banners van siempre a la red.
 *
 * Para invalidar todo lo guardado, subir VERSION.
 */
const VERSION = 'v1';
const PAGES = `tf-pages-${VERSION}`;
const ASSETS = `tf-assets-${VERSION}`;
const STATIC = `tf-static-${VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE = [OFFLINE_URL, '/favicon.svg', '/icon-192.png'];
const MAX_PAGES = 60;
const MAX_ASSETS = 200;
// El runtime de ONNX (quitar fondo) pesa ~24 MB: no se duplica en la caché.
const MAX_ASSET_BYTES = 5 * 1024 * 1024;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [PAGES, ASSETS, STATIC];
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('tf-') && !keep.includes(n)).map((n) => caches.delete(n)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/ads/') || url.pathname.startsWith('/cdn-cgi/') || url.pathname === '/app-sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(page(event, url));
    return;
  }

  if (url.pathname.startsWith('/_astro/')) {
    if (url.pathname.endsWith('.wasm')) return;
    event.respondWith(asset(request));
    return;
  }

  if (/\.(?:png|svg|ico|jpg|webmanifest)$/.test(url.pathname) || url.pathname === '/search-index.json') {
    event.respondWith(staleWhileRevalidate(event));
  }
});

async function page(event, url) {
  const cache = await caches.open(PAGES);
  // La clave es la ruta sin query: /comprimir y /comprimir?utm=… son la misma página.
  const key = url.pathname;
  try {
    const response = (await event.preloadResponse) || (await fetch(event.request));
    if (response.ok && !response.redirected && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(cache.put(key, copy).then(() => trim(cache, MAX_PAGES)));
    }
    return response;
  } catch (err) {
    const saved = await cache.match(key);
    if (saved) return saved;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    throw err;
  }
}

async function asset(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  const size = Number(response.headers.get('content-length') || 0);
  if (response.ok && response.type === 'basic' && size <= MAX_ASSET_BYTES) {
    const copy = response.clone();
    cache.put(request, copy).then(() => trim(cache, MAX_ASSETS)).catch(() => {});
  }
  return response;
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(event.request, { ignoreSearch: true });
  const network = fetch(event.request)
    .then((response) => {
      if (response.ok && response.type === 'basic') cache.put(event.request, response.clone());
      return response;
    })
    .catch(() => hit || Response.error());
  if (hit) {
    event.waitUntil(network);
    return hit;
  }
  return network;
}

/** Borra las entradas más antiguas cuando la caché pasa del máximo. */
async function trim(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}
