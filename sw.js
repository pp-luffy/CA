const CACHE_NAME = 'upsc-hub-cache-v2';

// Files to cache immediately when the user visits the page
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Inter:wght@400;500;600;700&display=swap'
];

// Install Event: Cache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CORE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event: Clear old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Clean Stale-While-Revalidate for all static files
self.addEventListener('fetch', event => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    // Default Stale-While-Revalidate for all files (manifest, HTML pages, etc.)
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const clonedRes = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clonedRes);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Fails silently if offline, relies on cachedResponse
            });

            // Return cached immediately if found, else wait for network
            return cachedResponse || fetchPromise;
        })
    );
});
