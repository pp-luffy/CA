const CACHE_NAME = 'upsc-hub-cache-v1';

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

// Fetch Event: Stale-While-Revalidate Strategy
// This allows the app to load instantly from cache, while updating the cache in the background.
self.addEventListener('fetch', event => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    // Specifically handle the GitHub API requests (don't permanently cache the file lists)
    if (event.request.url.includes('api.github.com/repos/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clonedRes = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Default Stale-While-Revalidate for all other files (like html/weekly/*)
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Return cached response if offline and fetch fails
            });

            // Return cached immediately if found, else wait for network
            return cachedResponse || fetchPromise;
        })
    );
});
