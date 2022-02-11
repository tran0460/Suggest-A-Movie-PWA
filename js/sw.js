const version = 1;
const staticCache = `PWAStaticCacheVersion${version}`
const dynamicCache = `PWADynamicCacheVersion${version}`
const cacheList = [
    '/404.html',
    '/index.html',
    '/result.html',
    '/suggestions.html',
    '/js/app.js',
    '/js/sw.js',
    '/css/main.css',
]
self.addEventListener('install', (ev) => {
    ev.waitUntil(
        caches.open(staticCache).then((cache) => {
            cache.addAll(cacheList);
        })
    )
})
self.addEventListener('activate', (ev) => {
    ev.waitUntil(
    caches
        .keys()
        .then((keys) => {
        return Promise.all(
            keys
            .filter((key) => {
                if (key === staticCache || key === dynamicCache) {
                return false;
                } else {
                return true;
                }
            })
            .map((key) => caches.delete(key))
            ); 
        })
        .catch(console.warn)
    );
});
self.addEventListener('fetch', (ev) => {
    ev.respondWith(
    caches.match(ev.request).then((cacheRes) => {
        return (
            cacheRes ||
            fetch(ev.request)
            .then((fetchRes) => {
              //TODO: check here for the 404 error
                if (! fetchRes.ok) throw new Error(fetchRes.statusText)
                return caches.open(dynamicCache).then((cache) => {
                  let copy = fetchRes.clone(); //make a copy of the response
                  cache.put(ev.request, copy); //put the copy into the cache
                return fetchRes; //send the original response back up the chain
                });
            })
            .catch((err) => {
                console.log('SW fetch failed');
                console.warn(err);
                if(ev.request.mode === 'navigate') {
                return caches.match('/404.html').then(cacheRes => {
                return cacheRes
                })
            }
            })
        );
    })
    );
});