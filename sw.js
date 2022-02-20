const version = 2;
let isOnline = true;
const staticCache = `PWAStaticCacheVersion${version}`
const dynamicCache = `PWADynamicCacheVersion${version}`
const cacheList = [
    '/',
    '/404.html',
    '/index.html',
    '/result.html',
    '/suggestions.html',
    '/js/app.js',
    '/sw.js',
    '/css/main.css',
    '/img/crying-face.png',
    '/img/placeholder.png',
    '/img/tmdb-svg.svg',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css'
]
const limitCacheSize = (nm, size) => {
    caches.open(nm).then((cache) => {
        cache.keys().then((keys) => {
            if (keys.length > size) {
                cache.delete(keys[0]).then(() => {
                limitCacheSize(nm, size);
            });
        }
        });
    });
};
self.addEventListener('install', (ev) => {
    ev.waitUntil(
        caches.open(staticCache)
        .then((cache) => {
            console.log(cache)
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
            fetch(ev.request, { mode: 'cors', credentials: 'omit' }) 
            .then((fetchRes) => {
                // if (!fetchRes.ok) throw new Error(fetchRes.statusText)
                return caches.open(dynamicCache).then((cache) => {
                    let copy = fetchRes.clone(); //make a copy of the response
                    cache.put(ev.request, copy); //put the copy into the cache
                    limitCacheSize(dynamicCache, 30)
                    return fetchRes; //send the original response back up the chain
                });
            })
            .catch((err) => {
                console.log('SW fetch failed');
                console.warn(err);
                console.log(ev.request.mode)
                return caches.match('/404.html').then(cacheRes => {
                    console.log(cacheRes)
                    return cacheRes
                })
            })
            );
        })
        ); //what do we want to send to the browser?
    }); 
    
    self.addEventListener('message', (ev) => {
        console.log(ev.data);
        if (ev.data.ONLINE) {
            isOnline = ev.data.ONLINE;
        }
        
    });
    function sendMessage(msg) {
        self.clients.matchAll().then(function (clients) {
            if (clients && clients.length) {
                clients[0].postMessage(msg);
            }
        });
    }
    
