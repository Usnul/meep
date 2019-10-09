/**
 * @author Alex Goldring 2014
 */

import Engine from '../../../model/engine/Engine';
import Preloader from "../../../model/engine/asset/preloader/Preloader";
import { GameAssetType } from "../../../model/engine/asset/GameAssetType.js";
import { arrayPickBestElement } from "../../../model/core/collection/ArrayUtils.js";

/**
 *
 * @param {Engine} engine
 * @returns {Promise}
 */
function setLocale(engine) {
    if (engine.localization.locale.getValue() !== "") {
        //locale already set
        return Promise.resolve();
    }

    function getURLHash() {
        const result = {};

        if (window === undefined) {
            return result;
        }

        const location = window.location;

        const hash = location.hash;

        const hashRegEx = /([a-zA-Z0-9\-\_]+)\=([a-zA-Z0-9\-\_]+)/g;

        let match;
        while ((match = hashRegEx.exec(hash)) !== null) {
            const variableName = match[1];
            const value = match[2];

            result[variableName] = value;
        }

        return result;
    }

    //load supported languages
    const pLanguages = engine.assetManager.promise('data/database/text/languages.json', GameAssetType.JSON).then(asset => asset.create());

    function pickLanguageByNavigator() {
        /**
         *
         * @type {ReadonlyArray<string>}
         */
        const languages = window.navigator.languages;

        return pLanguages.then(translationLanguages => {
            //extract language ids
            const translationKeys = Object.keys(translationLanguages);

            function computeLanguageScore(code) {
                const numPreferences = languages.length;

                const index = languages.indexOf(code);
                if (index !== -1) {
                    return (numPreferences - index) * 1.1;
                } else {
                    const codePrefix = code.split('-')[0];

                    //only search by first portion
                    for (let i = 0; i < numPreferences; i++) {
                        const lang = languages[i];

                        const langPrefix = lang.split('-')[0];

                        if (codePrefix.toLowerCase() === langPrefix.toLowerCase()) {
                            //partial match, same language group
                            return (numPreferences - i) * 1;
                        }
                    }
                }

                return 0;
            }


            const scoredKeys = translationKeys.map(key => {
                return {
                    key,
                    score: computeLanguageScore(key)
                };
            });

            const best = arrayPickBestElement(scoredKeys, o => o.score);

            if (best.score === 0) {
                return 'en-gb';
            } else {
                return best.key;
            }
        });
    }

    const urlHash = getURLHash();

    let locale;
    if (urlHash.lang !== undefined) {
        locale = Promise.resolve(urlHash.lang);
    } else {
        locale = pickLanguageByNavigator();
    }

    return locale.then(l => engine.localization.loadLocale(l));
}

class GameBootstrap {
    constructor() {
    }

    boot({ parentNode }) {
        const engine = window.engine = new Engine();

        const preloader = new Preloader();
        preloader.on.error.add(function (e) {
            console.error(e);
        });

        const assetManager = engine.assetManager;


        setLocale(engine);

        //initialize game view
        const view = engine.viewStack;
        parentNode.appendChild(view.el);
    }
}

export default GameBootstrap;
