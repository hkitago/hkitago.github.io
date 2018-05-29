var dataCacheName = 'LandscapeiOSTESTData-v1';
var cacheName = 'LandscapeiOSTEST-1';
var filesToCache = [
  '/',
  '/index.html',
  '/scripts/app.js'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil();
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil();
});

self.addEventListener('fetch', function(e) {
  console.log('[ServiceWorker] Fetch', e.request.url);
});
