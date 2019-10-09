/**
 * Created by Alex on 03/09/2014.
 */


import BoundedValue from "../../core/model/BoundedValue";
import { ObservedMap } from "../../core/collection/ObservedMap";
import { AssetDescription } from "./Asset.js";
import { HashMap } from "../../core/collection/HashMap.js";
import { extractAssetListFromManager } from "./preloader/extractAssetListFromManager.js";

/**
 *
 * @param {function(asset:Asset)} successCallback
 * @param {function(error:*)} failureCallback
 * @param {function(loaded:number, total:number):void} progressCallback
 * @constructor
 */
function AssetRequest(successCallback, failureCallback, progressCallback) {
    this.successCallback = successCallback;
    this.failureCallback = failureCallback;
    this.pogressCallback = progressCallback;
}


/**
 *
 * @param {AssetDescription} description
 * @constructor
 */
function PendingAsset(description) {
    this.description = description;
    this.requests = [];
    this.progress = new BoundedValue(0, 0);
}


/**
 *
 * @constructor
 */
function AssetManager() {
    /**
     *
     * @type {HashMap<AssetDescription, Asset>}
     */
    this.assets = new HashMap({
        keyEqualityFunction(a, b) {
            return a.equals(b);
        },
        keyHashFunction(key) {
            return key.hash();
        }
    });

    /**
     *
     * @type {ObservedMap<AssetDescription, PendingAsset>}
     */
    this.requestMap = new ObservedMap(new HashMap({
        keyEqualityFunction(a, b) {
            return a.equals(b);
        },
        keyHashFunction(key) {
            return key.hash();
        }
    }));

    this.loaders = {};
}

AssetManager.prototype.dumpLoadedAssetList = function () {
    return JSON.stringify(extractAssetListFromManager(this), 3, 3);
};

/**
 * @param {String} path
 * @param {String} type
 * @returns {Promise.<Asset>}
 */
AssetManager.prototype.promise = function (path, type) {
    const self = this;

    return new Promise(function (resolve, reject) {
        self.get(path, type, resolve, reject);
    });
};

/**
 *
 * @param {String} path
 * @param {String} type
 * @param {function(asset:Asset)} callback
 * @param {function(*)} failure
 * @param {function(loaded:number, total:number)} [progress]
 */
AssetManager.prototype.get = function (path, type, callback, failure, progress) {
    if (typeof path !== "string") {
        throw new Error("Path must be string. Path = " + JSON.stringify(path));
    }

    const assetDescription = new AssetDescription(path, type);

    const asset = this.assets.get(assetDescription);

    if (asset !== undefined) {
        callback(asset);
    } else {
        //create request object
        const assetRequest = new AssetRequest(callback, failure, progress);
        //submit request
        this.submitRequest(path, type, assetRequest);
    }
};

/**
 *
 * @param {string} path
 * @param {string} type
 * @param {AssetRequest} request
 * @private
 */
AssetManager.prototype.submitRequest = function (path, type, request) {
    const requestMap = this.requestMap;

    const assetDescription = new AssetDescription(path, type);

    let pendingAsset = requestMap.get(assetDescription);
    if (pendingAsset !== undefined) {
        //already loading
        pendingAsset.requests.push(request);
        return;
    }

    pendingAsset = new PendingAsset(assetDescription);

    requestMap.set(assetDescription, pendingAsset);

    const requests = pendingAsset.requests;
    requests.push(request);

    const loader = this.loaders[type];

    if (loader === void 0) {
        if (typeof request.failureCallback === "function") {
            request.failureCallback(`no loader exists for asset type '${type}', valid types are: ${Object.keys(this.loaders).join(', ')}`);
        } else {
            //uncaught
            console.error("Uncaught asset load failure: No loader for asset type", type);
        }
        return;
    }

    const assets = this.assets;

    function success(asset) {
        //link asset description
        asset.description = assetDescription;

        //register asset
        assets.set(assetDescription, asset);
        requests.forEach(function (request) {
            try {
                request.successCallback(asset);
            } catch (e) {
                console.error("Failed to execute asset success callback", e);
            }
        });
        //clear callbacks
        requestMap.delete(assetDescription);
    }

    function failure(error) {
        requests.forEach(function (request) {
            try {
                request.failureCallback(error);
            } catch (e) {
                console.error("Failed to execute asset failure callback", e);
            }
        });
        //clear callbacks
        requestMap.delete(assetDescription);
    }

    function progress(current, total) {
        requests.forEach(function (request) {
            if (typeof request.pogressCallback !== "function") {
                //progress callback is not a function, ignore
                return;
            }

            try {
                request.pogressCallback(current, total);
            } catch (e) {
                console.error("Failed to execute asset progress callback", e);
            }
        });

        pendingAsset.progress.setValue(current);
        pendingAsset.progress.setUpperLimit(total);
    }

    try {
        loader(path, success, failure, progress);
    } catch (e) {
        console.error(`Loader failed on invocation. path=${path}, type=${type}`, request, 'Loader exception: ', e);
        failure(e);
    }
};

/**
 *
 * @param {string} type
 * @param {function(path:String,success:function, failure: function, progress: function(current:number, total:number))} loader
 */
AssetManager.prototype.registerLoader = function (type, loader) {
    if (this.loaders.hasOwnProperty(type)) {
        console.error(`Loader for type '${type}' is already registered. Old:`, this.loaders[type], ', New:', loader);
        return;
    }

    this.loaders[type] = loader;
};

/**
 * @template T
 * Retrieve an asset if it is loaded, returns null if asset is not loaded.
 * @param {String} path
 * @param {String} type
 * @returns {Asset<T>|null}
 */
AssetManager.prototype.tryGet = function (path, type) {
    const assetDescription = new AssetDescription(path, type);

    const asset = this.assets.get(assetDescription);

    if (asset !== undefined) {
        return asset;
    } else {
        return null;
    }
};

export {
    AssetManager
};
