// École Joyeuse — Service Worker KILL-SWITCH
// Phase démo : aucun PWA, aucun cache, aucune installation.
// Ce fichier existe uniquement pour désenregistrer automatiquement les anciens
// service workers actifs chez les visiteurs ayant déjà visité une version précédente
// du site. Au prochain reload de leur navigateur, ce SW prend le contrôle, purge
// tous les caches, se désenregistre lui-même et force le rechargement des pages.

self.addEventListener('install', event => {
  // Prendre le contrôle immédiatement sans attendre la fermeture des onglets
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      // 1. Purger tous les caches stockés par l'ancien SW
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      console.log('[SW kill-switch] tous les caches purgés');

      // 2. Désenregistrer ce service worker
      await self.registration.unregister();
      console.log('[SW kill-switch] service worker désenregistré');

      // 3. Forcer le rechargement de toutes les pages clientes pour servir la version sans SW
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        try { client.navigate(client.url); } catch(e) { /* ignore */ }
      });
    } catch (err) {
      console.warn('[SW kill-switch] erreur pendant le nettoyage:', err);
    }
  })());
});

// Pendant la transition, ne pas intercepter les requêtes — passe-plat réseau direct
self.addEventListener('fetch', event => {
  // Ne rien faire : laisser le navigateur gérer normalement
});
