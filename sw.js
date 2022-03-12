const version = 3;
let isOnline = true;
const staticCache = `PWAStaticCacheVersion${version}`
const dynamicCache = `PWADynamicCacheVersion${version}`
const imgCache = `PWAImgCacheVersion${version}`
const cacheList = [
    './',
    '/404.html',
    '/index.html',
    '/result.html',
    '/suggestions.html',
    '/js/app.js',
    '/sw.js',
    './css/main.css',
    '/MAD9022-Suggest-A-Movie-PWA/404.html',
    '/MAD9022-Suggest-A-Movie-PWA/index.html',
    '/MAD9022-Suggest-A-Movie-PWA/result.html',
    '/MAD9022-Suggest-A-Movie-PWA/suggestions.html',
    '/MAD9022-Suggest-A-Movie-PWA/js/app.js',
    '/MAD9022-Suggest-A-Movie-PWA/sw.js',
    './css/main.css',
    './img/sad-face.png',
    './img/placeholder.png',
    './img/tmdb-svg.svg',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
    "./img/tmdb-big-logo.svg",
    './img/favicon-16x16.png',
    './img/favicon-32x32.png',
    './img/apple-touch-icon.png',
    './img/mstile-150x150.png',
    './img/android-chrome-192x192.png',
    './img/android-chrome-512x512.png',
    './favicon.ico',
    './manifest.json'
]
function limitCacheSize(nm, size) {
    //remove some files from the dynamic cache
    caches.open(nm).then((cache) => {
        return cache.keys().then((keys) => {
        let numOfKeys = keys.length;
        if (numOfKeys > size) {
        return cache.delete(keys[0]).then(() => {
            return limitCacheSize(nm, size);
            });
        }
        });
    });
}
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
                if (key === staticCache || key === dynamicCache || key === imgCache) {
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
                if (fetchRes.type === 'opaque'){
                    return caches.open(imgCache).then((cache) => {
                        let copy = fetchRes.clone(); //make a copy of the response
                        cache.put(ev.request, copy); //put the copy into the cache
                        cache.keys().then((keys) => {
                            if (keys.length > 40) limitCacheSize(imgCache, 40)
                        })
                        return fetchRes; //send the original response back up the chain
                    });
                } else {
                    return caches.open(dynamicCache).then((cache) => {
                        let copy = fetchRes.clone(); //make a copy of the response
                        cache.put(ev.request, copy); //put the copy into the cache
                        return fetchRes; //send the original response back up the chain
                    });
                }
            })
            .catch((err) => {
                console.log('SW fetch failed');
                if (ev.request.mode === "navigate") {
                    return caches.match("/404.html").then((cacheRes) => {
                    location.href = `${location.origin}/404.html`
                        return cacheRes;
                    });
                }
            })
            );
        })
        ); //what do we want to send to the browser?
    }); 
self.addEventListener('message', (ev) => {
    console.log('msg received')
        if (ev.data.ONLINE){
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

