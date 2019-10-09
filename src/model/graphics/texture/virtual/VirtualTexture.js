import { Tile, TileStatus } from "./Tile";
import { TileLoader } from "./TileLoader";
import { Cache } from "../../../core/Cache";
import Vector2 from "../../../core/geom/Vector2";
import { TilePage } from "./TilePage";
import { create32BitCodec } from "../../../core/binary/32BitEncoder.js";


/**
 *
 * @param tileSize
 * @param textureSize
 * @returns {{encode: (function(..value:number): number), decode: (function(number, number[]): void)}}
 */
function buildAddressEncoder(tileSize, textureSize) {
    const numberOfTiles = Math.ceil(textureSize / tileSize);
    const numberOfMips = Math.ceil(Math.log2(numberOfTiles));

    const bitsPerMip = Math.ceil(Math.log2(numberOfMips));
    const bitsPerCoordinate = Math.ceil(Math.log2(numberOfTiles));

    return create32BitCodec([bitsPerCoordinate, bitsPerCoordinate, bitsPerMip]);
}

const BYTES_PER_MEGABYTE = 1024 * 1024;

const DEFAULT_CACHE_SIZE = 100 * BYTES_PER_MEGABYTE;

const DEFAULT_PAGE_SIZE = new Vector2(2048, 2048);

const DEFAULT_PADDING = 4;

/**
 *
 * @param {AssetManager} assetManager
 * @constructor
 */
function VirtualTexture(assetManager) {
    this.addressCodec = null;


    /**
     * Active page cache texture
     * @type {TilePage}
     */
    this.page = new TilePage();

    const loader = this.loader = new TileLoader(assetManager);

    /**
     *
     * @type {Cache.<number, Tile>}
     */
    this.cache = new Cache({
        keyWeigher: function (key) {
            return 8;
        },
        valueWeigher: function (tile) {
            return 1;
        },
        removeListener: function (key, value) {
            loader.remove(value.address);
        }
    });

    /**
     * When a tile is loaded, this bias is used to add portion of tile's usage count to coarser mip level tile.
     * In effect, it controls likelihood fetching lower resolution mip for a tile. Value should be between 0 and 1, value of 0 means - no bias, value of 1 means - making lower resolution mip at least as likely to get fetched
     * @type {number}
     * @private
     */
    this.__settingMipBias = 0.7;

    this.maxMipLevel = 0;
    this.tileResolution = new Vector2(0, 0);
    this.resolution = new Vector2(0, 0);
    this.sizeInTiles = new Vector2(0, 0);
}

/**
 *
 * @param {number} address
 * @returns {Tile}
 */
VirtualTexture.prototype.getTile = function (address) {
    const cachedTile = this.cache.get(address);
    if (cachedTile !== null) {
        return cachedTile;
    }

    const decodedAddress = [];

    this.addressCodec.decode(address, decodedAddress);

    const [x, y, mip] = decodedAddress;

    //tile is not cached
    const tile = new Tile();
    tile.address.x = x;
    tile.address.y = y;
    tile.address.mip = mip;

    this.cache.put(address, tile);
    this.loader.add(tile);
};

/**
 *
 * @param {number} [cacheSize] resolution of the cache for tiles
 * @param {Vector2} [pageSize] size of the texture page
 * @param {number} [padding]
 * @param {Vector2} resolution maximum mip-level resolution fo the texture
 * @param {Vector2} tileResolution resolution or a single tile
 */
VirtualTexture.prototype.init = function ({
                                              cacheSize = DEFAULT_CACHE_SIZE,
                                              pageSize = DEFAULT_PAGE_SIZE,
                                              padding = DEFAULT_PADDING,
                                              resolution,
                                              tileResolution
                                          }) {
    this.resolution.copy(resolution);
    this.tileResolution.copy(tileResolution);

    //build address codec
    this.addressCodec = buildAddressEncoder(tileResolution, resolution);

    //initialize cache
    this.cache.drop();
    this.cache.setMaxWeight(cacheSize);

    const tileByteSize = tileResolution.x * tileResolution.y * 4;
    const cacheValueWeigher = new Function('tile', `return ${tileByteSize};`);

    this.cache.setValueWeigher(cacheValueWeigher);

    //initialize page
    this.page.init(pageSize, tileResolution, padding);

    const sizeInTiles = resolution.clone().divide(tileResolution);

    if (sizeInTiles.x % 1 !== 0 || sizeInTiles.y % 1 !== 0) {
        throw new Error(`Texture resolution must be a multiple of tile resolution, instead multiples were ${JSON.stringify(sizeInTiles.toJSON())}`);
    }

    this.sizeInTiles.copy(sizeInTiles);
    this.maxMipLevel = Math.ceil(Math.log2(Math.max(sizeInTiles.x, sizeInTiles.y)));
};

/**
 *
 * @param {TileUsage} input
 */
VirtualTexture.prototype.updateUsage = function (input) {
    const usage = input.clone();

    const addressCodec = this.addressCodec;

    const settingMipBias = this.__settingMipBias;

    const maxMipLevel = this.maxMipLevel;

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} mip
     * @param {number} count
     */
    function registerUsage(x, y, mip, count) {
        if (mip > maxMipLevel) {
            //invalid mip, do nothing
            return;
        }

        const address = addressCodec.encode(x, y, mip);
        usage.add(address, count);

        //include earlier levels
        const x1 = Math.floor(x / 2);
        const y1 = Math.floor(y / 2);
        registerUsage(x1, y1, mip + 1, count * settingMipBias);
    }

    const decodedAddress = [0, 0, 0];
    input.traverse(function (address, count) {

        //decode address
        addressCodec.decode(address, decodedAddress);

        const x = decodedAddress[0];
        const y = decodedAddress[1];
        const mip = decodedAddress[2];

        //include earlier levels
        registerUsage(x, y, mip + 1, count * settingMipBias);
    });

    //we have a collection of pages with usage count at this point

    usage.sort();


    let remainingPageSlots = this.page.capacity;
    const self = this;
    const page = this.page;
    usage.traverse(function (address, count) {
        const tile = self.getTile(address);
        if (remainingPageSlots > 0 && tile.status === TileStatus.Loaded) {
            //tile is loaded, put it into page
            if (page.put(tile)) {
                //tile was added into the page
                remainingPageSlots--;
            }
        }
    });

    if (remainingPageSlots !== this.page.capacity) {
        //page was modified
        this.page.update();
    }

    //reorder loading queue, put used tiles at the front with most used being foremost
    usage.traverseReverse(function (address, count) {
        self.loader.promote(address);
    });
};

export {
    VirtualTexture
}