const APP = {
    imageUrl: null,
    configData: null,
    init: () => {
        APP.registerSW();
        APP.addListeners();
        APP.getConfig();
        IDB.initDB();
        APP.checkURL();
        // console.log('init')
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
    checkURL: () => {

    }
}
const SEARCH = {
    baseUrl : 'https://api.themoviedb.org/3/',
    api: 'f8950444a4c0c67cbff1553083941ae3',
    movieList: [],
    input: null,
    movieId: null,
    navigate: (ev) => {
        ev.preventDefault();
        if (document.querySelector('.display-area')) {document.querySelector('.display-area').innerHTML = ''};
        SEARCH.movieList = [];
        // location.pathname = 'result.html'
        SEARCH.handleResult();
    },
    handleResult: () => {
        // displays the text "Search result for"
        if (document.querySelector('p.text-center')) {
            document.querySelector('p.text-center').textContent = ''
        }
        let searchInput = document.querySelector('input').value
        SEARCH.input = searchInput;
        if (location.pathname.includes('result')){
        let p = document.createElement('p')
        p.classList.add('h1', 'text-center')
        p.textContent = `Search results for: ${searchInput}`
        document.querySelector('.searchResults').prepend(p)
        }
        let tx = IDB.DB.transaction('searchStore', 'readwrite');
        let searchStore = tx.objectStore('searchStore');
        let getData = searchStore.get(SEARCH.input.toLowerCase())
        getData.onsuccess = (ev) => {
            if (ev.target.result.results != undefined) {
            SEARCH.movieList = [...ev.target.result.results]
                MEDIA.buildCards(SEARCH.movieList)
            } else {
                //fetch the url
                let url = `${SEARCH.baseUrl}search/movie?api_key=${SEARCH.api}&query=${searchInput}`;
                SEARCH.fetch(url, 'searchStore')
            }
        }
    },
    fetch : (url, type) => {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Fetch failed ${response.status}`)
                return response.json()
        })
            .then(data => {
                console.log('fetching')
                SEARCH.movieList = data.results
                switch (type) {
                    case 'searchStore': 
                        IDB.addMoviesToSearchDB();
                        break;
                    case 'similarStore':
                        IDB.addMoviesToSimilarDB();
                        break;
                }
                console.log(type)
                MEDIA.buildCards(data.results)
        })
            .catch(err => {
                console.warn(err.message)
        })
    },
    
    handleSimilar:(ev) => {
        let id = ev.currentTarget.id
        SEARCH.movieId = id
        if (document.querySelector('.similarResults')) {
        let p = document.createElement('p')
        p.classList.add('h1', 'text-center')
        p.textContent = `Similar movies to: ${SEARCH.movieName}`
        document.querySelector('.similarResults').prepend(p)
}
        let tx = IDB.DB.transaction('similarStore', 'readwrite');
        let similarStore = tx.objectStore('similarStore');
        let getRequest = similarStore.get(SEARCH.movieId)
        getRequest.onerror = (err) => {console.log('something went wrong')}
        getRequest.onsuccess = (ev) => {
            if (ev.target.result != undefined) {
                SEARCH.movieList = [...ev.target.result]
                console.log(SEARCH.movieList)
                MEDIA.buildCards(SEARCH.movieList)
                } else {
                    //fetch the url
                    let url = `${SEARCH.baseUrl}movie/${id}/similar?api_key=${SEARCH.api}`;
                    SEARCH.fetch(url, 'similarStore')
                }
        }
    }
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
    addMoviesToSearchDB: () => {
        console.log('addMoviesToSearchDB')
        let tx = IDB.DB.transaction('searchStore', 'readwrite');
        let searchStore = tx.objectStore('searchStore');
        let obj = {
            keyword: SEARCH.input,
            results: SEARCH.movieList
        };
        let addRequest = searchStore.add(obj, SEARCH.input); 
            addRequest.onsuccess = (ev) => {
                // let url = new URL('./result.html', location.origin)
                // location.href = url
            }
    },
    addMoviesToSimilarDB: () => {
        let tx = IDB.DB.transaction('similarStore', 'readwrite');
        let similarStore = tx.objectStore('similarStore');
        let obj = {
            movieId: SEARCH.movieId,
            results: SEARCH.movieList
        };
            let addRequest = similarStore.add(obj, SEARCH.movieId); 
            addRequest.onsuccess = (ev) => {
            }
    }
}

const MEDIA = {
    buildCards: (data) => {
        if (document.querySelector('.display-area')) {document.querySelector('.display-area').innerHTML = ''
        data.forEach(movie => {
            let li = document.createElement('li');
            let source =  `${APP.imageUrl}w154${movie.poster_path}`
            if (movie.poster_path === null) {
                source = './img/placeholder.png'
            }
            li.innerHTML = 
            `
            <div class="card m-2 pe-none" id="${movie.id}"style="width: 18rem;">
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
            btn.addEventListener('click', SEARCH.handleSimilar)
        })}
    }
}
document.addEventListener('DOMContentLoaded', APP.init);
