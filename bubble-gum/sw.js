// Offline support: keep a copy of the game so it opens without internet.
// Bump VERSION whenever a file below changes so devices pick up the new copy.
const VERSION = 'bubble-gum-v2';
const PREFIX = VERSION.replace(/v\d+$/, '');   // e.g. 'spark-count-'
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      // All the games share one website, so only clear out this game's own old copies
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k.startsWith(PREFIX)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve the saved copy right away, and refresh it from the network in the background
// so the next launch gets any update.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const saved = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request)
        .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => saved || Response.error());
      if (saved) { e.waitUntil(fresh); return saved; }
      return fresh;
    })
  );
});
