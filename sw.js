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
    '/img/sad-face.png',
    '/img/placeholder.png',
    '/img/tmdb-svg.svg',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
    "/img/tmdb-big-logo.svg",
    '/img/favicon-16x16.png',
    '/img/favicon-32x32.png',
    '/img/apple-touch-icon.png',
    '/img/mstile-150x150.png',
    '/img/android-chrome-192x192.png',
    '/img/android-chrome-512x512.png',
    '/favicon.ico',
    '/manifest.json'
]
const limitCacheSize = (nm, size) => {
    caches.open(nm).then((cache) => {
        console.log('cache opened')
        cache.keys().then((keys) => {
            let numOfKeys = keys.length;
            if (numOfKeys > size) {
                return cache.delete(keys[numOfKeys - 1]).then(() => {
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
            fetch(ev.request) 
            .then((fetchRes) => {
                if (fetchRes.status > 399) throw new Error(fetchRes.statusText)
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
                console.log(ev.request.method)
                return caches.match('/404.html').then(res => {
                    return res
                })
            })
            );
        })
        ); //what do we want to send to the browser?
    }); 
    
    self.addEventListener('message', (ev) => {
        console.log('msg received')
        isOnline = ev.data.ONLINE;
        console.log(isOnline)
    });
    function sendMessage(msg) {
        self.clients.matchAll().then(function (clients) {
            if (clients && clients.length) {
                clients[0].postMessage(msg);
            }
        });
    }
    
