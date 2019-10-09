/**
 * Created by Alex on 30/07/2015.
 */

function loadScript(url, callback) {
    // Adding the script tag to the head as suggested before
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}

export default new Promise(function (fulfill, reject) {
    window.gapiLoadedHandler = function () {
        delete window.gapiLoadedHandler;
        fulfill(gapi);
    };
    loadScript("https://apis.google.com/js/client.js?onload=gapiLoadedHandler", function () {
        console.log("Gapi script loaded");
    });
});