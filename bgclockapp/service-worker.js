const dataCacheName = 'bgClockAppData-v1';
const cacheName = 'bgClockApp-5';
const filesToCache = [
  './',
  './index.html',
  './scripts/app.js',
  './scripts/localization.js',
  './lib/idb.js',
  './styles/default.css',
  './styles/dark.css',
  './styles/light.css'
];

self.addEventListener('install', function(event) {
  //console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(cacheName)
    .then(function(cache) {
      //console.log('[ServiceWorker] Caching App Shell');
      //return cache.addAll(filesToCache);
      cache.addAll(filesToCache.map(function(fileToCache) {
         return new Request(fileToCache, { cache: 'no-cache', mode: 'no-cors' });
      }))
      .then(function() {
        //console.log('All resources have been fetched and cached.');
      });
    })
  );
});

self.addEventListener('activate', function(event) {
  //console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys()
    .then(function(cachedNames) {
      return Promise.all(
        cachedNames.map(function(cachedName) {
          if (cacheName.indexOf(cachedName) === -1) {
            // If this cache name isn't present in the array of "expected" cache names, then delete it.
            //console.log('Deleting out of date cache:', cachedName);
            return caches.delete(cachedName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  //console.log('[ServiceWorker] Fetch', event.request.url);
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return;
  }
  event.respondWith(
    caches.match(event.request)
    .then(function(response) {
      //return response || fetchAndCache(event.request);
      return response || fetch(event.request);
    })
  );
});

const fetchAndCache = function(url){
  return fetch(url)
  .then(function(response) {
    // Check if we received a valid response
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return caches.open(cacheName)
    .then(function(cache) {
      cache.put(url, response.clone());
      return response;
    });
  })
  .catch(function(error) {
    //console.log('Request failed:', error);
    // You could return a custom offline 404 page here
  });
};