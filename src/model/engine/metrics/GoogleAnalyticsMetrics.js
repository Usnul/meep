import { Metrics } from "./Metrics.js";

// const GOOGLE_ANALYTICS_KEY = 'UA-66021000-1'; //Lazy-Kitty.com
const GOOGLE_ANALYTICS_KEY = 'UA-138821093-1'; //Itch.com

function loadAnalytics(api) {


    (function (target, s, domTag, sourceURL, property) {
        target['GoogleAnalyticsObject'] = property;

        if (target[property] === undefined) {
            target[property] = function () {
                const api = target[property];

                if (api.q === undefined) {
                    api.q = [];
                }

                api.q.push(arguments);
            };
        }

        target[property].l = 1 * new Date();

        const a = s.createElement(domTag);
        const m = s.getElementsByTagName(domTag)[0];

        a.async = 1;
        a.src = sourceURL;

        m.parentNode.insertBefore(a, m)
    })(document, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

    api.ga = ga;

    api.ga('create', GOOGLE_ANALYTICS_KEY, 'auto');
}


function loadGTAG(MEASUREMENT_ID) {

    (function (target, s, domTag, sourceURL) {

        const a = s.createElement(domTag);
        const m = s.getElementsByTagName(domTag)[0];

        a.async = 1;
        a.src = sourceURL;

        m.parentNode.insertBefore(a, m)
    })(document, document, 'script', `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`);


    window.dataLayer = window.dataLayer || [];

    function gtag() {
        dataLayer.push(arguments);
    }

    gtag('js', new Date());

    gtag('config', MEASUREMENT_ID);


    return gtag;
}

export class GoogleAnalyticsMetrics extends Metrics {
    constructor() {
        super();

        this.api = {
            gtag: loadGTAG(GOOGLE_ANALYTICS_KEY)
        };


    }

    record(type, event) {
        const payload = Object.assign({}, event);

        if (typeof event.category === "string") {
            payload.event_category = event.category;
        }

        if (typeof event.label === "string") {
            payload.event_label = event.label;
        }

        if (ENV_PRODUCTION) {
            this.api.gtag('event', type, payload);
        } else {
            console.log("[DEBUG] metric would be sent", type, payload);
        }
    }
}
