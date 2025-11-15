const CACHE_NAME = 'mayra-khata-cache-v1';
// This list includes the core app shell files.
// A build step that generates this list automatically would be more robust.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/context/AppContext.tsx',
  '/types.ts',
  '/components/Icons.tsx',
  '/components/common/Header.tsx',
  '/components/common/Footer.tsx',
  '/components/SplashScreen.tsx',
  '/components/AuthScreen.tsx',
  '/components/HomeScreen.tsx'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache, caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate worker immediately
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      ).then(() => self.clients.claim()); // Take control of all clients
    })
  );
});

self.addEventListener('fetch', event => {
  // Use a cache-first strategy for all requests.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request because it's a stream and can only be consumed once.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response.
            // Opaque responses (type 'opaque') are for no-cors requests to third-party domains.
            // These should be cached to make CDNs work offline.
            if (!response || response.status !== 200 && response.type !== 'opaque') {
              return response;
            }
            
            // Clone the response because it's a stream and can be consumed only once.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});