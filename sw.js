const CACHE_NAME = 'sd-financas-pro-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './css/components.css',
  './js/storage.js',
  './js/charts.js',
  './js/transactions.js',
  './js/accounts.js',
  './js/budgets.js',
  './js/simulator.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
