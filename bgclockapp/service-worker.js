var dataCacheName = 'bgClockAppData-v1';
var cacheName = 'bgClockApp-1';
var filesToCache = [
  './',
  './index.html',
  './scripts/app.js',
  './lib/idb.js',
  './styles/default.css',
  './styles/dark.css',
  './styles/bright.css'
];

self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching App Shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  //console.log('[ServiceWorker] Fetch', event.request.url);
});
