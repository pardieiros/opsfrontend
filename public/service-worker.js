const CACHE_NAME = 'app-cache-v2'; // Incrementar versão para forçar atualização
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png'
];

// Função para limpar caches antigos
const clearOldCaches = async () => {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => {
      if (cacheName !== CACHE_NAME) {
        console.log('Removendo cache antigo:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
};

self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache aberto');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker ativando...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      clearOldCaches()
    ])
  );
});

self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);
  
  // Bypass service worker para API endpoints ou requests cross-origin
  if (requestURL.origin !== self.location.origin || 
      requestURL.pathname.startsWith('/api/') ||
      requestURL.pathname.includes('socket.io') ||
      requestURL.pathname.includes('pusher')) {
    return; // Deixar a rede lidar com este request
  }

  // Para requests de navegação, sempre tentar a rede primeiro
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Se a rede funcionar, atualizar o cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se a rede falhar, usar cache
          console.log('Usando cache para navegação');
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Para outros requests (CSS, JS, imagens), usar cache-first com fallback para rede
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Só cachear se a resposta for válida
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
      })
  );
});

// Listener para mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});