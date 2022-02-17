const APP = {
    imageUrl: null,
    configData: null,
    init: () => {
        APP.registerSW();
        APP.addListeners();
        APP.getConfig();
        IDB.initDB();
        APP.checkURL();
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
        document.querySelector('.searchBtn').addEventListener('click', SEARCH.handleSearch)
    },
    registerSW: () => {
    navigator.serviceWorker.register('/js/sw.js').catch(function (err) {
        console.warn(err);
    });
    navigator.serviceWorker.ready.then((registration) => {
        });
    },
    checkURL: () => {
        // if (location.pathname.includes('result')){
        // let p = document.createElement('p')
        // p.classList.add('h1', 'text-center')
        // p.textContent = `Search results for: ${searchInput}`
        // document.querySelector('.searchResults').prepend(p)
        // }
    }
}
const SEARCH = {
    baseUrl : 'https://api.themoviedb.org/3/',
    api: 'f8950444a4c0c67cbff1553083941ae3',
    movieList: [],
    input: null,
    movieId: null,
    fetch : (url, type) => {
        console.log(url)
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Fetch failed ${response.status}`)
                return response.json()
        })
            .then(data => {
                console.log('fetching for ',type)
                SEARCH.movieList = data.results
                IDB.addResultsToDB(data.results, type);
                IDB.getDBResults(type, SEARCH.input)
        })
            .catch(err => {
                console.warn(err.message)
        })
    },
    handleSearch: (ev) => {
        ev.preventDefault()
        console.log(ev.target.id)
        //check what button is clicked
            if (ev.currentTarget.id === 'get-result') {
                let searchInput = document.querySelector('input').value
                SEARCH.input = searchInput;
                IDB.getDBResults('searchStore', searchInput)
            }
                else {
                let id = parseInt(ev.currentTarget.id)
                SEARCH.movieId = id
                console.log(id)
                IDB.getDBResults('similarStore', id)
            }
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
                DB.deleteObjectStore('similarStore');
            } catch (err) {
                console.log('error deleting old DB');
            }
            IDB.DB.createObjectStore('searchStore');
            IDB.DB.createObjectStore('similarStore');
        }
            dbOpenRequest.onerror = function (err) {
            console.warn(err.message)
        }
            dbOpenRequest.onsuccess = function (ev) {
            IDB.DB = dbOpenRequest.result
            console.log(IDB.DB.name, `ready to be used.`);
        }
    },
    createTransaction: (storeName)=>{
        let tx = IDB.DB.transaction(storeName, 'readwrite');        //create a transaction to use for some interaction with the database
        return tx;
    },
    addResultsToDB: (obj, storeName)=>{
        let tx = IDB.DB.transaction(storeName, 'readwrite');
        let searchStore = tx.objectStore(storeName);
        let formatData = {
            keyword: SEARCH.input,
            results: obj
        };
        let addRequest = searchStore.add(formatData, SEARCH.input); 
        addRequest.on
    },
    getDBResults: (storeName, keyValue) => {
        let getFromStore= IDB.createTransaction(storeName).objectStore(storeName)
        let getRequest = getFromStore.get(keyValue);
        getRequest.onsuccess = (ev) => {
            if (ev.target.result != undefined) {
                console.log(ev.target.result)
                SEARCH.movieList = [...ev.target.result.results]
                MEDIA.buildCards(SEARCH.movieList)
                } else {
                    //fetch the url
                    if (typeof keyValue === 'string') {
                        let url = `${SEARCH.baseUrl}search/movie?api_key=${SEARCH.api}&query=${keyValue}`;
                        SEARCH.fetch(url, storeName)
                    } 
                    if (typeof keyValue === 'number') {
                        let url = `${SEARCH.baseUrl}movie/${keyValue};/similar?api_key=${SEARCH.api}`;
                        SEARCH.fetch(url, storeName)
                    }
                }
            }
        }
}
const MEDIA = {
    buildCards: (data) => {
        console.log('building cards', data);
        if (document.querySelector('.display-area')) {document.querySelector('.display-area').innerHTML = ''
        data.forEach(movie => {
            let li = document.createElement('li');
            let source =  `${APP.imageUrl}w154${movie.poster_path}`
            if (movie.poster_path === null) {
                source = './img/placeholder.png'
            }
            li.innerHTML = 
            `
            <div class="card m-2 pe-none" id=${movie.id} style="width: 18rem;">
                <img class="card-img-top" src="${source}" alt="Card image cap">
                <div class="card-body">
                <h5 class="card-title">${movie.original_title}</h5>
                <p class="card-text">${movie.overview}</p>
                <a  class="btn btn-primary pe-auto" id="get-similar">Similar movies</a>
                </div>
            </div>
            `
            document.querySelector('.display-area').append(li)
        })
        document.querySelectorAll('div.card').forEach (btn => {
            btn.addEventListener('click', SEARCH.handleSearch)
        })}
    }
}
document.addEventListener('DOMContentLoaded', APP.init);
