// Vezni List — the offline copy (GitHub Pages folder only; build_web.py copies this file there).
//
// The page is always asked of the NETWORK FIRST, so a newly published version reaches the
// device the moment it is online; the copy kept here is only the safety net for no signal
// (or a signal so weak that nothing answers within a few seconds). build_web.py stamps
// VERSION on every build, so each publish is a new worker that refreshes the offline copy
// and throws the old one away.
//
// The workbook is never answered from here when the app asks for it ("Check for Updates
// Now" and the quiet check on opening send cache: no-store): an offline press must fail
// honestly, never re-load an older file and roll the data back (the "newer wins" rule).
const VERSION = '2026-11-07T16:25:48Z';
const CACHE = 'vezni-list-' + VERSION;
const SCOPE = self.registration.scope;                       // the folder this worker serves
const PAGE = SCOPE + 'index.html';
const CORE = ['index.html'];
const EXTRA = ['manifest.webmanifest', 'apple-touch-icon.png', 'roundel.svg', 'wallmap.jpg', 'Vezni%20List%20Guide.pdf'];
const PAGE_WAIT_MS = 6000;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // no-cache = ask the server "still the same?" — a quick 304 when the browser already holds it
    await c.addAll(CORE.map(u => new Request(SCOPE + u, { cache: 'no-cache' })));
    await Promise.all(EXTRA.map(u => c.add(new Request(SCOPE + u, { cache: 'no-cache' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('vezni-list-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

function keep(key, resp) {
  if (!resp || !resp.ok || resp.type !== 'basic' || resp.redirected) return Promise.resolve();
  return caches.open(CACHE).then(c => c.put(key, resp)).catch(() => {});
}

function networkFirst(e, key, waitMs) {
  const req = e.request;
  const net = fetch(req);
  e.waitUntil(net.then(r => keep(key, r.clone())).catch(() => {}));
  const fromCache = () => caches.match(key, { ignoreSearch: true });
  return new Promise(resolve => {
    let done = false, timer = 0;
    const finish = r => { if (!done && r) { done = true; clearTimeout(timer); resolve(r); } };
    if (waitMs) timer = setTimeout(() => fromCache().then(finish), waitMs);
    // a server hiccup (5xx) on a good connection also falls back to the kept copy
    net.then(r => r.ok ? finish(r) : fromCache().then(m => finish(m || r)), () => fromCache().then(m => finish(m || Response.error())));
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                          // the update check's HEAD goes straight out
  const url = new URL(req.url);
  if (!url.href.startsWith(SCOPE)) return;                     // Matricula, maps: not ours to keep
  const key = url.origin + url.pathname;
  if (/\.xlsx$/i.test(url.pathname)) {
    if (req.cache === 'no-store') {                            // the app's own update check: network only
      const net = fetch(req);
      e.waitUntil(net.then(r => keep(key, r.clone())).catch(() => {}));
      e.respondWith(net);
      return;
    }
    e.respondWith(networkFirst(e, key, 0));
    return;
  }
  const isPage = req.mode === 'navigate' && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
  e.respondWith(networkFirst(e, isPage ? PAGE : key, isPage ? PAGE_WAIT_MS : 0));
});
