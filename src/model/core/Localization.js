import ObservedString from "./model/ObservedString.js";
import levenshtein from "fast-levenshtein";

const VARIABLE_REGEX = /\$\{([a-zA-Z0-9_]+)\}/gi;

/**
 *
 * @param {string} template
 * @param {object} seed
 * @returns {string}
 */
function seedTemplate(template, seed) {

    const result = template.replace(VARIABLE_REGEX, function (match, varName) {
        const value = seed[varName];

        if (value === undefined) {
            console.error(`No value provided for variable '${varName}' in template '${template}', seed:`, seed);
        }

        return value;
    });

    return result;
}

export class Localization {
    constructor() {
        /**
         *
         * @type {AssetManager|null}
         */
        this.assetManager = null;

        this.json = {};

        /**
         *
         * @type {ObservedString}
         */
        this.locale = new ObservedString('');
    }

    /**
     *
     * @param {AssetManager} am
     */
    setAssetManager(am) {
        this.assetManager = am;
    }

    /**
     *
     * @param {string} locale
     * @returns {Promise}
     */
    loadLocale(locale) {
        const assetManager = this.assetManager;

        const self = this;

        return new Promise(function (resolve, reject) {
            assetManager.get(`data/database/text/${locale}.json`, 'json', function (asset) {
                const json = asset.create();

                self.json = json;

                self.locale.set(locale);

                resolve();
            }, reject);
        });
    }

    /**
     *
     * @param {String} id
     * @return {boolean}
     */
    hasString(id) {
        return this.json[id] !== undefined;
    }

    /**
     *
     * @param {string} id
     * @param {object} [seed]
     *
     * @returns {string}
     */
    getString(id, seed = {}) {
        const value = this.json[id];

        if (value === undefined) {


            //try to find similar keys
            const similarities = Object.keys(this.json).map(function (key) {
                const distance = levenshtein.get(key, id);
                return {
                    key,
                    distance
                };
            });

            similarities.sort(function (a, b) {
                return a.distance - b.distance;
            });

            const suggestions = similarities.slice(0, 3).map(p => p.key);

            console.error(`No localization value for id='${id}', seed=${JSON.stringify(seed)}, approximate matches: ${suggestions.join(', ')}`);

            //no value
            return `@${id}`;
        }

        //value needs to be seeded
        const seededValue = seedTemplate(value, seed);

        return seededValue;
    }
}
