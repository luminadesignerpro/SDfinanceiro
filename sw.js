const CACHE_NAME = 'sd-fin-v2-sidebar-integration';
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
  './js/agenda.js',
  './js/reports.js',
  './js/users.js',
  './js/app.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first strategy to ensure real-time updates while maintaining offline availability
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(response => {
      if (response && response.status === 200 && e.request.method === 'GET') {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
      }
      return response;
    }).catch(() => caches.match(e.request))
  );
});
