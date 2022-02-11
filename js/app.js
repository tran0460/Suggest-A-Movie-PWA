const APP = {
    init: () => {
        APP.registerSW();
        console.log('init')
    },
    registerSW: () => {
    navigator.serviceWorker.register('/js/sw.js').catch(function (err) {
        console.warn(err);
    });
    navigator.serviceWorker.ready.then((registration) => {
        });
    },
}

APP.init()