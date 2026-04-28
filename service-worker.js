// Service Worker École Joyeuse v2.0
// Stratégie: Cache-first pour assets, Network-first pour API

const CACHE_NAME = 'ecole-joyeuse-v2.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/ecole_joyeuse_icon.png',
  '/ecole_joyeuse_square.png'
];

// Installation : cache les assets essentiels
self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache ouvert, ajout des assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoie les anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch : stratégie cache-first
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Ignore chrome-extension et autres protocoles
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Réponse depuis cache:', event.request.url);
          return cachedResponse;
        }
        
        console.log('[SW] Fetch réseau:', event.request.url);
        return fetch(event.request).then((response) => {
          // Ne cache que les réponses valides
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone la réponse car elle ne peut être consommée qu'une fois
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        }).catch(() => {
          // Fallback offline
          console.log('[SW] Offline, pas de cache disponible');
          return new Response(
            '<h1>Offline</h1><p>Cette ressource n\'est pas disponible hors ligne.</p>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
  );
});

// Message handler (pour communication avec l'app)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
