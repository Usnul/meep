import Vector2 from "../../../core/geom/Vector2";
import { Cache } from "../../../core/Cache";

/**
 *
 * @param {number} index
 * @constructor
 */
function TilePageSlot(index) {
    /**
     * @type {number}
     */
    this.index = index;
    this.position = new Vector2();

    /**
     *
     * @type {Tile|null}
     */
    this.tile = null;

    this.isWritten = false;
    this.isDirty = false;
}

TilePageSlot.prototype.empty = function () {
    this.tile = null;
    this.isDirty = this.isWritten;
    this.isWritten = false;
};

function TilePage() {
    this.size = new Vector2(0, 0);
    this.capacity = 0;
    this.emptySlots = [];

    this.padding = 0;

    this.queueWrite = [];

    const self = this;

    /**
     *
     * @type {Cache.<Tile, TilePageSlot>}
     */
    this.active = new Cache({
        keyWeigher: function () {
            return 0;
        },
        valueWeigher: function () {
            return 1;
        },
        removeListener: function (tile, slot) {
            slot.empty();
            self.emptySlots.push(slot);

            //remove from write queue
            const i = self.queueWrite.indexOf(slot);
            if (i !== -1) {
                self.queueWrite.splice(i, 1);
            }
        }
    });

}

TilePage.prototype.init = function (pageResolution, tileResolution, padding = 4) {
    this.padding = padding;

    //compute size of the page in tiles
    this.size.set(Math.floor(pageResolution.x / (tileResolution.x + padding * 2)), Math.floor(pageResolution.y / (tileResolution.y + padding * 2)));

    //figure out how many tiles we can hold
    this.capacity = this.size.x * this.size.y;

    //empty out write queue
    this.queueWrite = [];

    //create slots
    this.emptySlots = [];

    for (let x = 0; x < this.size.x; x++) {
        for (let y = 0; y < this.size.y; y++) {
            const slot = new TilePageSlot();
            slot.position.set(x, y);
            this.emptySlots.push(slot);
        }
    }


    this.active.drop();
    this.active.setMaxWeight(this.capacity);
};


/**
 * Get a slot with best matching tile, if requested tile is not found, its closest mip ancestor will be returned, if no mip ancestor exists - null will be returned
 * @param {number} x
 * @param {number} y
 * @param {number} mip
 * @returns {TilePageSlot}
 */
TilePage.prototype.getBestTile = function (x, y, mip) {
    let best = null;

    for (let [tile, slot] of this.active) {
        //check if it's a tile we are interested in
        const address = tile.address;
        if (address._includes(x, y, mip)) {
            if (best === null || address.mip < best.tile.address.mip) {

                best = slot;

                if (tile.address.mip === mip) {
                    //found exact match
                    break;
                }
            }
        }
    }

    return best;
};

/**
 *
 * @param {Tile} tile
 */
TilePage.prototype.put = function (tile) {
    if (this.active.contains(tile)) {
        return false;
    } else {
        if (this.emptySlots.length === 0) {
            this.active.evictOne();
        }

        //pick free slot
        const slot = this.emptySlots.pop();
        if (slot === undefined) {
            //something went wrong
            throw new Error(`Failed to obtain a free page slot`);
        }

        slot.tile = tile;

        this.active.put(tile, slot);

        //add to write queue
        this.queueWrite.push(slot);
    }
};

TilePage.prototype.update = function () {
    const queueWrite = this.queueWrite;

    const length = queueWrite.length;
    for (let i = 0; i < length; i++) {
        const slot = queueWrite[i];
        //TODO write slot

        this.sampler.copyWithPadding(slot.tile.sampler, x, y, width, height, padding);
    }

    //drop the queue
    this.queueWrite.length = 0;
};

export {
    TilePage
};