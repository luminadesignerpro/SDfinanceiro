const CACHE_NAME = 'sd-fin-v1';
const ASSETS = [
  './',
  './index.html',
  './css/design-tokens.css',
  './css/layout.css',
  './css/components.css',
  './js/storage.js',
  './js/state.js',
  './js/dashboard.js',
  './js/transactions.js',
  './js/accounts.js',
  './js/cards.js',
  './js/bills.js',
  './js/goals.js',
  './js/investments.js',
  './js/reports.js',
  './js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
