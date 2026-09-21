const CACHE = 'hmh-group-v7-theme-logos';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './img/logo.svg',
  './img/logo-dark.svg',
  './img/logo-light.svg',
  './img/pwa.svg',
  './img/pwa-192.png',
  './img/pwa-512.png',
  './img/bg.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Always fetch the navbar logo from the server first so updated logo.svg is not trapped in an old SW cache.
  if (url.pathname.endsWith('/img/logo.svg')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => res)
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
