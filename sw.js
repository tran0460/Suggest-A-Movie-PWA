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
    '/img/tmdb-svg.svg'
]
const limitCacheSize = (nm, size = 25) => {
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
        fetch(ev.request, { mode: 'cors', credentials: 'omit' })
            .then((response) => {
                if (!response.ok) throw new Error(response.statusText)
                if (response.status === 200)
                console.log('fetch success')
                return caches.open(dynamicCache).then((cache) => {
                    let copy = response.clone()
                    cache.put(ev.request, copy)
                console.log(ev.request.mode)
                console.log(ev.request.credentials)
                    return response
                    })
                })
            .catch(error => {
                console.log('SW fetch failed')
                console.log(ev.request)
                console.log(ev.request.mode)
            })
    )
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
        //Respond to last focused tab
        clients[0].postMessage(msg);
        }
    });
}

function checkForConnection(){
    //try to talk to a server and do a fetch() with HEAD method.
    //to see if we are really online or offline
    //send a message back to the browser
}