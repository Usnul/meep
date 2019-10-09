/**
 *
 * @enum {number}
 */
const TileStatus = {
    Initial: 0,
    Queued: 1,
    Loading: 2,
    Loaded: 3
};

/**
 *
 * @constructor
 */
function TileAddress() {
    /**
     *
     * @type {number}
     */
    this.mip = 0;
    /**
     *
     * @type {number}
     */
    this.x = 0;
    /**
     *
     * @type {number}
     */
    this.y = 0;
}

/**
 *
 * @param {TileAddress} other
 * @returns {boolean}
 */
TileAddress.prototype.equals = function (other) {
    return this.x === other.x && this.y === other.y && this.mip === other.mip;
};

/**
 * Returns true if this address is a equal or higher mip level of what requested address
 * @returns {boolean}
 */
TileAddress.prototype._includes = function (x, y, mip) {
    if (this.mip < mip) {
        //lower level mip
        return false;
    }
    const mipDelta = this.mip - mip;

    const expectedX = x << mipDelta;

    if (this.x !== expectedX) {
        return false;
    }

    const expectedY = y << mipDelta;

    if (this.y !== expectedY) {
        return false;
    }

    //match
    return true;
};

/**
 *
 * @constructor
 * @class
 */
function Tile() {
    /**
     *
     * @type {TileAddress}
     */
    this.address = new TileAddress();
    /**
     *
     * @type {Sampler2D|null}
     */
    this.sampler = null;
    /**
     *
     * @type {TileStatus}
     */
    this.status = TileStatus.Initial;
    this.referenceCount = 0;
}

Tile.prototype.byteSize = function () {
    const sampler = this.sampler;

    if (sampler === null || sampler.data === null || sampler.data === undefined) {
        return 0;
    }

    return sampler.data.length;
};

export {
    TileStatus,
    Tile,
    TileAddress
};