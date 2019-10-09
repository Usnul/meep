/**
 * Created by Alex on 21/03/2016.
 */
import Future from '../../model/core/process/Future';
import { makeModelView as _makeModelView, promiseMaterialLoaded } from "../../model/graphics/Utils";

import ConcurrentExecutor from '../../model/core/process/executor/ConcurrentExecutor.js';
import { futureTask } from "../../model/core/process/task/TaskUtils.js";
import { guessAssetType } from "../../model/engine/asset/GameAssetManager.js";


//use an executor to prevent stalling main thread when building previews
const executor = new ConcurrentExecutor(60, 1);


const cache = [];

function findInCache(url, size, focus) {
    function equalBoxes(a, b) {
        return a.x0 === b.x0 && a.x1 === b.x1 && a.y0 === b.y0 && a.y1 === b.y1;
    }

    let i = 0;
    const l = cache.length;
    for (; i < l; i++) {
        const piece = cache[i];
        if (piece.url === url && piece.size.equals(size) && equalBoxes(piece.focus, focus)) {
            return piece;
        }
    }
    return null;
}

/**
 *
 * @param {String} url
 * @param {AssetManager} assetManager
 * @param {Vector2} size
 * @param {THREE.WebGLRenderer} renderer
 * @param {AABB2} focus
 * @returns {Promise.<Image>}
 */
function makeModelView(url, assetManager, size, renderer, focus) {

    if (assetManager === undefined) {
        throw new Error("Asset Manager is not supplied");
    }

    return new Promise(function (fulfill, reject) {
        function makeImage(dataURL) {
            const node = document.createElement('img');
            node.src = dataURL;
            return node;
        }

        function resolveByURL(dataURL) {
            fulfill(makeImage(dataURL));
        }

        let piece = findInCache(url, size, focus);
        if (piece == null) {

            const dataURL = new Future(function (resolve, reject) {
                function success(model) {
                    function doMain() {
                        const modelView = _makeModelView(model, size, renderer, focus);
                        modelView.render();
                        const dataURL = modelView.domElement.toDataURL();
                        resolve(dataURL);
                    }


                    if (model.material !== undefined) {
                        promiseMaterialLoaded(model.material).then(doMain, reject);
                    } else {
                        doMain();
                    }
                }

                const assetType = guessAssetType(url);

                assetManager.get(url, assetType, success, reject);
            });

            const task = futureTask(dataURL, "Building Image URL");
            executor.run(task);

            piece = {
                complete: false,
                url: url,
                focus: focus,
                size: size,
                dataURL: dataURL
            };
            cache.push(piece);
        }
        piece.dataURL.then(resolveByURL, reject);
    });
}

export { makeModelView };
