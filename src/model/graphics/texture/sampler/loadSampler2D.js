/**
 * Created by Alex on 30/10/2014.
 */
import { Sampler2D } from './Sampler2D';
import { GameAssetType } from "../../../engine/asset/GameAssetType.js";


/**
 *
 * @param {string} url
 * @param {AssetManager} assetManager
 * @returns {Promise<Sampler2D>}
 */
export default function loadSampler2D(url, assetManager) {
    return new Promise(function (resolve, reject) {
        assetManager.get(url, GameAssetType.Image, (asset) => {
            const imageData = asset.create();

            const width = imageData.width;
            const height = imageData.height;

            const data = imageData.data;

            //
            const bufferSize = width * height;
            const buffer = new Float32Array(bufferSize);
            //
            for (let i = 0; i < bufferSize; i++) {
                const j = (i * 4);
                buffer[i] = (data[j] + data[j + 1] + data[j + 2]) / 765;
            }
            const sampler2D = new Sampler2D(buffer, 1, width, height);
            resolve(sampler2D);
        }, reject);
    });
};
