/**
 *
 * @constructor
 */
import { Tile, TileStatus } from "./Tile";

function Request(tile, successCallback, failureCallback) {
    this.tile = tile;
    this.successCallbacks = [successCallback];
    this.failureCallbacks = [failureCallback];
}

Request.prototype.attach = function (success, failure) {
    this.successCallbacks.push(success);
    this.failureCallbacks.push(failure);
};

function TileLoader(assetManager) {
    this.assetManager = assetManager;
    /**
     * number of tiles to be loaded concurrently
     * @type {number}
     */
    this.concurrency = 3;

    this.pending = new Set();

    this.queue = [];
}

/**
 *
 * @param {TileAddress} address
 */
TileLoader.prototype.promote = function (address) {
    const i = this.indexOfQueueRequestByTile(address);
    if (i === -1) {
        //couldn't find, nothing to do
        return;
    }
    //cut and put in the front
    const requests = this.queue.splice(i, 1);
    this.queue.unshift(requests[0]);
};

/**
 *
 * @param {TileAddress} address
 * @returns {number}
 */
TileLoader.prototype.indexOfQueueRequestByTile = function (address) {
    const queue = this.queue;
    const l = queue.length;
    for (let i = 0; i < l; i++) {
        const request = queue[i];
        const tile = request.tile;
        if (tile.address.equals(address)) {
            return i;
        }
    }

    return -1;
};

/**
 *
 * @param {TileAddress} address
 * @returns {boolean}
 */
TileLoader.prototype.remove = function (address) {
    const i = this.indexOfQueueRequestByTile(address);
    if (i !== -1) {
        this.queue.splice(i, 1);
        return true;
    } else {
        //TODO check pending queue, cancel load
    }
};

/**
 *
 * @param {Tile} tile
 * @param {function(tile:Tile)} successCallback
 * @param {function(tile:Tile)} failureCallback
 */
TileLoader.prototype.add = function (tile, successCallback, failureCallback) {
    for (let request of this.pending) {
        if (request.tile.address.equals(tile.address)) {
            //tile is already being loaded
            request.attach(successCallback, failureCallback);
            return;
        }
    }

    tile.status = TileStatus.Queued;

    const request = new Request(tile, successCallback, failureCallback);

    this.queue.push(request);
    this.prod();
};

/**
 *
 * @param {Tile} tile
 * @returns {string}
 */
function tileToURL(tile) {
    const address = tile.address;
    return `${address.mip}$${address.x}_${address.y}`;
}

/**
 *
 * @param {Request} request
 */
TileLoader.prototype.load = function (request) {
    this.pending.add(request);

    const tile = request.tile;
    const url = tileToURL(tile);
    tile.status = TileStatus.Loading;

    const self = this;

    function loadFinished() {
        self.pending.delete(request);
        self.prod();
    }

    function success(asset) {
        tile.status = TileStatus.Loaded;
        tile.sampler = asset.create();
        request.successCallbacks.forEach(function (cb) {
            cb(tile);
        });
        loadFinished();
    }

    function failure() {
        //oh well?
        request.failureCallbacks(function (cb) {
            cb(tile);
        });
        loadFinished();
    }

    //do load
    this.assetManager.get('image', url, success, failure);
};

/**
 * @private
 */
TileLoader.prototype.prod = function () {
    while (this.pending < this.concurrency) {
        const request = this.queue.shift();
        this.load(request);
    }
};

export {
    TileLoader
};