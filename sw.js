/**
 * SDFINANCEIRO — Service Worker (PWA)
 * Estratégia: Network-First com Fallback para Cache Offline
 * Garante que qualquer atualização publicada no Vercel seja carregada IMEDIATAMENTE pelos aparelhos
 */

const CACHE_NAME = 'sdfinanceiro-v5.1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/assets/logo.jpg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/js/storage.js',
  '/js/auth.js',
  '/js/users.js',
  '/js/accounts.js',
  '/js/bills.js',
  '/js/transactions.js',
  '/js/checks.js',
  '/js/agenda.js',
  '/js/charts.js',
  '/js/app.js'
];

// Instalação: ativa imediatamente sem esperar
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(err => console.warn('Cache inicial parcial:', err))
  );
});

// Ativação: LIMPA TODOS os caches antigos (v1, v2, etc.) imediatamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Apagando cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: NETWORK-FIRST (sempre busca a versão mais recente na internet)
// Só utiliza cache se o usuário estiver completamente offline
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a resposta for válida, atualiza o cache em segundo plano
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline: busca no cache local
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Para navegação de páginas offline, entrega index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
