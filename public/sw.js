/* Spider GIS demo — service worker.
 *
 * Hand-written rather than generated: the policy is five rules, and the one that
 * matters is a negative — the 11 MB snapshot must NOT be precached, or a first visit
 * on hotel wifi stares at a blank screen. See.
 *
 *   app shell      precache on install      ~1 MB, makes the app open offline
 *   /data/layers   stale-while-revalidate   5 MB, fetched on first map paint
 *   /data/details  cache-first              4 MB, only if a feature is clicked
 *   basemap tiles  cache-first, capped      visited tiles work offline, rest go grey
 *   cdnjs assets   cache-first              Leaflet's marker icons
 *
 * The precache list and the cache version both come from /sw-assets.json, written by
 * scripts/gen-sw-manifest.mjs after `next build`. Two reasons it is not inline here:
 * Next.js asset filenames are content-hashed and unknown until build time, and those
 * files are requested before this worker activates on a first visit — so without an
 * explicit precache an offline reload would serve cached HTML with no JS behind it.
 * The list's hash is the version, so a redeploy evicts the previous snapshot.
 */

const TILE_LIMIT = 300;

let manifestPromise = null;

function manifest() {
  if (!manifestPromise) {
    manifestPromise = fetch('/sw-assets.json', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      // next dev has no manifest; the worker is not registered there, but a stale
      // registration should degrade to runtime caching rather than throw.
      .then(m => m || { version: 'dev', assets: [] })
      .catch(() => ({ version: 'dev', assets: [] }));
  }
  return manifestPromise;
}

async function cacheName(kind) {
  const { version } = await manifest();
  return `${kind}-${version}`;
}

// ── lifecycle ───────────────────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const { assets } = await manifest();
      const cache = await caches.open(await cacheName('shell'));
      // addAll rejects the whole install if any single URL 404s, which would leave
      // the site with no worker at all. Individual puts degrade instead.
      await Promise.all(assets.map(url => cache.add(url).catch(() => {})));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const { version } = await manifest();
      const names = await caches.keys();
      await Promise.all(
        names.filter(n => !n.endsWith(`-${version}`)).map(n => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

// ── strategies ──────────────────────────────────────────────────────────────

async function cacheFirst(request, kind) {
  const cache = await caches.open(await cacheName(kind));
  const hit = await cache.match(request);
  if (hit) return hit;

  const res = await fetch(request).catch(() => null);
  if (!res) return new Response('', { status: 504 });

  // Opaque responses (no-cors tiles) have status 0 — still worth caching.
  if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, kind) {
  const cache = await caches.open(await cacheName(kind));
  const hit = await cache.match(request);

  const network = fetch(request)
    .then(res => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  // Serve the cached copy immediately when there is one; the refresh lands in the
  // cache for next time.
  return hit || (await network) || new Response('', { status: 504 });
}

async function cacheFirstCapped(request, kind, limit) {
  const cache = await caches.open(await cacheName(kind));
  const hit = await cache.match(request);
  if (hit) return hit;

  const res = await fetch(request).catch(() => null);
  if (!res) return new Response('', { status: 504 });

  if (res.ok || res.type === 'opaque') {
    await cache.put(request, res.clone());
    // Rough FIFO trim — Cache Storage keys come back in insertion order.
    const keys = await cache.keys();
    if (keys.length > limit) {
      await Promise.all(keys.slice(0, keys.length - limit).map(k => cache.delete(k)));
    }
  }

  return res;
}

// Navigations: try the network so a new deploy is picked up, fall back to the
// cached shell so a reload works offline.
async function navigate(request) {
  const cache = await caches.open(await cacheName('shell'));
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    const url = new URL(request.url);
    return (
      (await cache.match(request)) ||
      // trailingSlash: true means every route is <path>/index.html.
      (await cache.match(url.pathname)) ||
      (await cache.match('/')) ||
      Response.error()
    );
  }
}

// ── routing ─────────────────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
    return;
  }

  if (sameOrigin && url.pathname.startsWith('/data/layers/')) {
    event.respondWith(staleWhileRevalidate(request, 'layers'));
    return;
  }

  if (sameOrigin && url.pathname.startsWith('/data/details/')) {
    event.respondWith(cacheFirst(request, 'details'));
    return;
  }

  if (sameOrigin && (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/icons/'))) {
    event.respondWith(cacheFirst(request, 'shell'));
    return;
  }

  // basemap.at (orthophoto + vector) and OpenStreetMap — see lib/tiles.ts
  if (url.hostname === 'mapsneu.wien.gv.at' || url.hostname === 'tile.openstreetmap.org') {
    event.respondWith(cacheFirstCapped(request, 'tiles', TILE_LIMIT));
    return;
  }

  // Leaflet's default marker icons, loaded from cdnjs in MapInner.tsx
  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(cacheFirst(request, 'vendor'));
  }
});
