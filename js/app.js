const APP = {
    imageUrl: null,
    configData: null,
    init: () => {
        APP.registerSW();
        APP.addListeners();
        IDB.initDB();
        console.log('init')
    },
    getConfig: () => {
        const url = `https://api.themoviedb.org/3/configuration?api_key=f8950444a4c0c67cbff1553083941ae3`
        fetch(url) 
            .then(response => {
            if (response.ok) {
                return response.json()
            } else {
            throw new Error(`something went wrong : ${response.status}`)
            }
        })
        .then(data => {
            APP.imageUrl = data.images.secure_base_url
            APP.configData = data.images
        })
        .catch(error => 
            alert(`Theres been an ERROR!!!!!!!! ${error.name}, ${error.message}`))
    },
    addListeners: () => {
        document.querySelector('.searchBtn').addEventListener('click', SEARCH.handle)
    },
    registerSW: () => {
    navigator.serviceWorker.register('/js/sw.js').catch(function (err) {
        console.warn(err);
    });
    navigator.serviceWorker.ready.then((registration) => {
        });
    },
}
const SEARCH = {
    baseUrl : 'https://api.themoviedb.org/3/',
    api: 'f8950444a4c0c67cbff1553083941ae3',
    movieList: [],
    handle: () => {
        let searchInput = document.querySelector('input').value
        // const url = `${SEARCH.baseUrl}search/movie?api_key=${SEARCH.api}&query=${searchInput}`
        let url = `${SEARCH.baseUrl}search/movie?api_key=${SEARCH.api}&query=${searchInput}`;
        SEARCH.fetch(url)
    },
    fetch : (url) => {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Fetch failed ${response.status}`)
                return response.json()
        })
            .then(data => {
                console.log(url)
                console.log(data)
                SEARCH.movieList = data.results
                console.log(SEARCH.movieList)
                IDB.addMoviesToDB();
        })
            .catch(err => {
                console.warn(err.message)
        })
    },
}

const IDB = {
    DB: null,
    initDB: () => {
        let version = 1
        let dbOpenRequest = indexedDB.open('SuggestAMovieDB', version);
            dbOpenRequest.onupgradeneeded = function (ev) {
            IDB.DB = ev.target.result; 
            try {
                DB.deleteObjectStore('searchStore');
                DB.deleteObjectStore('recommendedStore');
            } catch (err) {
                console.log('error deleting old DB');
            }
            let searchStoreOptions = {
                keyPath: 'id',
                autoIncrement: false,
            };
            IDB.DB.createObjectStore('searchStore', searchStoreOptions);
            IDB.DB.createObjectStore('recommendedStore');
        }
            dbOpenRequest.onerror = function (err) {
            console.warn(err.message)
        }
            dbOpenRequest.onsuccess = function (ev) {
            IDB.DB = dbOpenRequest.result
            console.log(IDB.DB.name, `ready to be used.`);
        }
    },
    addMoviesToDB: () => {
        console.log(SEARCH.movieList)
        let tx = IDB.DB.transaction('searchStore', 'readwrite');
        let searchStore = tx.objectStore('searchStore');
        console.log(searchStore)
        console.log('preparing to add movies')
        SEARCH.movieList.forEach(movie => {
            let addRequest = searchStore.add(movie); 
            addRequest.onsuccess = (ev) => {
            }
        })
    }
}

const MEDIA = {
}
document.addEventListener('DOMContentLoaded', APP.init);
