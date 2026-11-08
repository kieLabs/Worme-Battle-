const CACHE_NAME = 'worms-battle-gamerkie-v4';
const APP_SHELL = [
  './', './index.html', './style.css', './manifest.webmanifest',
  './js/config.js', './js/logic.js', './js/storage.js', './js/worm.js',
  './js/camera.js', './js/ai.js', './js/food.js', './js/collision.js',
  './js/powerups.js', './js/particles.js', './js/missions.js',
  './js/achievements.js', './js/shop.js', './js/game.js', './js/audio.js',
  './js/ui.js', './js/controls.js', './js/main.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
