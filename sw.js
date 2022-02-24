const version = 2;
let isOnline = true;
const staticCache = `PWAStaticCacheVersion${version}`
const dynamicCache = `PWADynamicCacheVersion${version}`
const imgCache = `PWAImgCacheVersion${version}`
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
function limitCacheSize(nm, size) {
    // console.log('abcd')
    //remove some files from the dynamic cache
    caches.open(nm).then((cache) => {
        return cache.keys().then((keys) => {
        let numOfKeys = keys.length;
        // console.log(size, numOfKeys)
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
                    console.log(fetchRes)
                console.log(isOnline)
                if (fetchRes.status > 399) throw new Error(fetchRes.statusText)

                if (fetchRes.type === 'opaque'){
                    return caches.open(imgCache).then((cache) => {
                        let copy = fetchRes.clone(); //make a copy of the response
                        cache.put(ev.request, copy); //put the copy into the cache
                        cache.keys().then((keys) => {
                            if (keys.length > 30) limitCacheSize(imgCache, 30)
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
                console.warn(err);
                console.log(ev.request.method)
                if (ev.request.mode === "navigate") {
                    return caches.match("/404.html").then((cacheRes) => {
                        return cacheRes;
                    });
                }
            })
            );
        })
        ); //what do we want to send to the browser?
    }); 
// self.addEventListener("fetch", (ev) => {
//       console.log(ev);
//       ev.respondWith(
//         caches.match(ev.request.url).then((cacheRes) => {
//           if (cacheRes) {
//             return cacheRes;
//           } // End here if resource is in cache.
//           console.warn(isOnline);
//           if (!isOnline) {
//             // Check if not online, if offline go to 404
//             // let userLocation = location.href.userLocation.replace(
//             //   "index",
//             //   "results"
//             // );
//             location.href = "http://localhost:5501/404.html"; // navigate to 404
//             return;
//           } else {
//             fetch(ev.request)
//               .then((fetchRes) => {
//                 if (fetchRes.status > 399)
//                   throw new NetworkError(
//                     fetchRes.message,
//                     fetchRes.request.status,
//                     fetchRes.statusText
//                   );
//                 // if (fetchRes.status > 399) throw new Error(fetchRes.statusText);
//                 return caches.open(dynamicCache).then((cache) => {
//                   let copy = fetchRes.clone();
//                   cache.put(ev.request, copy);
//                     cache.keys().then((keys) => {
//                         if (keys.length > 20) limitCacheSize(dynamicCache, 20)
//                     })
//                   return fetchRes;
//                 });
//               })
//               .catch((err) => {
//                 console.log("SW fetch failed");
//                 console.warn(err);
//                 if (ev.request.mode === "navigate") {
//                   return caches.match("/404.html").then((cacheRes) => {
//                     return cacheRes;
//                   });
//                 }
//               });
//           }
//         })
//       );
//     });
self.addEventListener('message', (ev) => {
    console.log('msg received')
        if (ev.data.ONLINE){
        isOnline = ev.data.ONLINE;
        console.log(isOnline)
        }

});
function sendMessage(msg) {
    self.clients.matchAll().then(function (clients) {
        if (clients && clients.length) {
            clients[0].postMessage(msg);
        }
    });
}

