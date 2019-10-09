/**
 * Created by Alex on 01/04/2014.
 */


import { BitSet } from "./binary/BitSet.js";
import { assert } from "./assert.js";

/**
 *
 * @constructor
 */
function IdPool() {
    /**
     * @private
     * @type {BitSet}
     */
    this.bitSet = new BitSet();
}

/**
 *
 * @returns {number}
 */
IdPool.prototype.get = function () {
    const bitIndex = this.bitSet.nextClearBit(0);

    this.bitSet.set(bitIndex, true);

    return bitIndex;
};

/**
 * Attempt to request a specific ID from the pool.
 * @param {number} id
 * @return {boolean} true if request succeeds, false otherwise
 */
IdPool.prototype.getSpecific = function (id) {
    if (this.isUsed(id)) {
        return false;
    }

    this.bitSet.set(id, true);
    return true;
};

/**
 *
 * @param {number} id
 * @returns {boolean}
 */
IdPool.prototype.isUsed = function (id) {
    return this.bitSet.get(id);
};

/**
 * Traverse all IDs currently in use
 * @param {function(id:number)} visitor
 */
IdPool.prototype.traverseUsed = function (visitor) {
    assert.equal(typeof visitor, 'function', `visitor must be a function, instead was '${typeof visitor}'`);

    const bitSet = this.bitSet;

    for (let i = bitSet.nextSetBit(0); i !== -1; i = bitSet.nextSetBit(i + 1)) {
        visitor(i);
    }

};

/**
 *
 * @param {number} id
 */
IdPool.prototype.release = function (id) {
    this.bitSet.clear(id);
};

IdPool.prototype.reset = function () {
    this.bitSet.reset();
};

export default IdPool;
