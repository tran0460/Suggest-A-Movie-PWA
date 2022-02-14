const APP = {
    imageUrl: null,
    configData: null,
    init: () => {
        APP.registerSW();
        APP.addListeners();
        APP.getConfig();
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
        document.querySelector('.searchBtn').addEventListener('click', SEARCH.navigate)
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
    navigate: (ev) => {
        ev.preventDefault();
        // location.pathname = 'result.html'
        // SEARCH.navigate.onsuccess = (ev) => {
        //     SEARCH.handle();
        // }
        SEARCH.handle();
    },
    handle: (ev) => {
        // ev.preventDefault();
        console.log('handling search')
        let searchInput = document.querySelector('input').value
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
                SEARCH.movieList = data.results
                IDB.addMoviesToDB();
                MEDIA.buildCards(data.results)
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
    buildCards: (data) => {
        console.log('building cards')
        document.querySelector('.display-area').innerHTML = ''
        data.forEach(movie => {
            let li = document.createElement('li');
            let source =  `${APP.imageUrl}w154${movie.poster_path}`
            if (movie.poster_path === null) {
                source = './img/placeholder.png'
            }
            li.innerHTML = 
            `
            <div class="card m-2" style="width: 18rem;">
                <img class="card-img-top" src="${source}" alt="Card image cap">
                <div class="card-body">
                <h5 class="card-title">${movie.original_title}</h5>
                <p class="card-text">${movie.overview}</p>
                <a href="#" class="btn btn-primary">Similar movies</a>
                </div>
            </div>
            `
            document.querySelector('.display-area').append(li)
        })
    }
}
document.addEventListener('DOMContentLoaded', APP.init);
