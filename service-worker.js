// École Joyeuse — Service Worker v3.1.0
// Stratégie : cache-first pour assets statiques + JSON, network-first pour mises à jour
const CACHE_NAME = 'ecole-joyeuse-v3.1.0';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './ecole_joyeuse_curriculum.json',
  './examens_cep_concours.json',
  './icon-192.png',
  './icon-512.png'
];

// Installation : pré-cache des assets essentiels
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE).catch(err => {
        console.warn('[SW] Some assets failed to precache:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : cache-first pour les ressources de l'app
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        // Mettre en cache la réponse pour les futures requêtes
        if (response && response.status === 200 && response.type === 'basic') {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
        }
        return response;
      }).catch(() => {
        // Offline : fallback sur l'index pour la navigation
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
