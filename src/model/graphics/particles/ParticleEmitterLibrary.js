import { ParticleEmitter } from "./particular/engine/emitter/ParticleEmitter.js";
import { GameAssetType } from "../../engine/asset/GameAssetType.js";
import { assert } from "../../core/assert.js";

export class ParticleEmitterLibrary {
    /**
     *
     * @param {AssetManager} assetManager
     */
    constructor(assetManager) {
        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = assetManager;

        this.data = {};
    }

    /**
     * @param {Object} listing
     * @returns {Promise}
     */
    load(listing) {
        const assetManager = this.assetManager;
        const data = this.data;

        const promises = [];

        for (let id in listing) {
            const url = listing[id];

            assert.typeOf(id, "string", "id");
            assert.typeOf(url, "string", "url");

            const assetPromise = assetManager.promise(url, GameAssetType.JSON);

            promises.push(assetPromise);

            assetPromise.then(asset => {
                const json = asset.create();

                data[id] = json;
            });
        }

        return Promise.all(promises);
    }

    /**
     * @param {string} id
     * @returns {ParticleEmitter}
     */
    create(id) {
        const definition = this.data[id];

        if (definition === undefined) {
            throw new Error(`No definition found for emitter '${id}'`);
        }

        return ParticleEmitter.fromJSON(definition);
    }
}
