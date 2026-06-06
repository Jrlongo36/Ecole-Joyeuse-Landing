// sw.js — École Joyeuse
// Ce Service Worker se désinstalle immédiatement.
// Il vide tous les caches et se supprime lui-même.
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  await self.registration.unregister();
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(c => c.navigate && c.navigate(c.url));
});
