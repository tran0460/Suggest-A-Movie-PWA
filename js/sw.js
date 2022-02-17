const version = 1;
const staticCache = `PWAStaticCacheVersion${version}`
const dynamicCache = `PWADynamicCacheVersion${version}`
const cacheList = [
    '/',
    '/404.html',
    '/index.html',
    '/result.html',
    '/suggestions.html',
    '/js/app.js',
    '/js/sw.js',
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
    console.log('SW detected fetch')
    ev.respondWith(
    caches.match(ev.request).then((cacheRes) => {
        return (
            cacheRes ||
            fetch(ev.request)
            .then((fetchRes) => {
              //TODO: check here for the 404 error
                if (! fetchRes.ok) throw new Error(fetchRes.statusText)
                return caches.open(dynamicCache).then((cache) => {
                    console.log('yoohoo')
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
self.addEventListener('message', (ev)=>{
    //check ev.data to get the message
});

function sendMessage(msg){
    //send a message to the browser from the service worker
};

function limitCache(){
    //remove some files from the dynamic cache
}

function checkForConnection(){
    //try to talk to a server and do a fetch() with HEAD method.
    //to see if we are really online or offline
    //send a message back to the browser
}