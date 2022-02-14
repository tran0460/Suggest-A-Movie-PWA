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
        SEARCH.handleResult();
    },
    handleResult: () => {
        // displays the text "Search result for"
        let searchInput = document.querySelector('input').value
        let p = document.createElement('p')
        p.classList.add('h1', 'text-center')
        p.textContent = `Search results for: ${searchInput}`
        document.querySelector('.searchResults').prepend(p)
        //fetch the url
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
                if (url.includes('similar')) {
                    IDB.addMoviesToSimilarDB();
                } else {
                    IDB.addMoviesToSearchDB();
                }
                MEDIA.buildCards(data.results)
        })
            .catch(err => {
                console.warn(err.message)
        })
    },
    
    handleSimilar:(ev) => {
        let id = ev.currentTarget.id
        let p = document.createElement('p')
        p.classList.add('h1', 'text-center')
        p.textContent = `Similar movies to: ${ev.currentTarget.querySelector('.card-title').textContent}`
        document.querySelector('.similarResults').prepend(p)
        let url = `${SEARCH.baseUrl}/movie/${id}/similar?api_key=${SEARCH.api}`
        SEARCH.fetch(url)
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
            let options = {
                keyPath: 'id',
                autoIncrement: false,
            };
            IDB.DB.createObjectStore('searchStore', options);
            IDB.DB.createObjectStore('similarStore', options);
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
        let tx = IDB.DB.transaction('searchStore', 'readwrite');
        let searchStore = tx.objectStore('searchStore');
        console.log('preparing to add movies to search store');
        SEARCH.movieList.forEach(movie => {
            let addRequest = searchStore.add(movie); 
            addRequest.onsuccess = (ev) => {
            }
        })
    },
    addMoviesToSimilarDB: () => {
        let tx = IDB.DB.transaction('similarStore', 'readwrite');
        let similarStore = tx.objectStore('similarStore');
        console.log('preparing to add movies to similarStore')
        SEARCH.movieList.forEach(movie => {
            let addRequest = similarStore.add(movie); 
            addRequest.onsuccess = (ev) => {
            }
        })
    }
}

const MEDIA = {
    buildCards: (data) => {
        document.querySelector('.display-area').innerHTML = ''
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
        })
    }
}
document.addEventListener('DOMContentLoaded', APP.init);
