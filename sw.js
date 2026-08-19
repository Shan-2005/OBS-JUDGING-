const CACHE_NAME = 'robofest-obs-v2';
const ASSETS = [
  './',
  './index.html',
  './participant.html',
  './849204.html',
  './css/styles.css',
  './js/app.js',
  './js/auth.js',
  './js/store.js',
  './js/eligibility.js',
  './js/scoring.js',
  './js/bracket.js',
  './js/supabase.js',
  './assets/logo_red.png',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
