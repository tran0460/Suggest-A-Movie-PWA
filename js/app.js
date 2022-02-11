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
        })
            .catch(err => {
                console.warn(err.message)
        })
    },
}

const IDB = {
    DB: null,
    initDB: () => {
        let version = 2
        let dbOpenRequest = indexedDB.open('movieDB', version);
            dbOpenRequest.onupgradeneeded = function (ev) {
            DB = ev.target.result; 
            try {
                DB.deleteObjectStore('movieStore');
            } catch (err) {
                console.log('error deleting old DB');
            }
            let searchStore = DB.createObjectStore('searchStore');
            let resultStore = DB.createObjectStore('resultStore');
        }
            dbOpenRequest.onerror = function (err) {
            console.warn(err.message)
        }
            dbOpenRequest.onsuccess = function (ev) {

        }
    }
}

const MEDIA = {
}
document.addEventListener('DOMContentLoaded', APP.init);
