import { assert } from "../assert.js";
import { max3, min2 } from "../math/MathUtils.js";

/**
 * @readonly
 * @type {number[]}
 */
const MaskSet = [
    0x01,
    0x02,
    0x04,
    0x08,
    0x10,
    0x20,
    0x40,
    0x80,
];

/**
 *
 * @type {number[]}
 */
const MaskClear = [];
for (let i = 0; i < 8; i++) {
    MaskClear[i] = ~MaskSet[i];
}

/**
 * Used for overallocating space when bit set needs to grow
 * @constant
 * @type {number}
 */
const GROW_FACTOR = 1.3;

/**
 * Used to allow some un-assigned space to be retained when shrinking
 * @constant
 * @type {number}
 */
const SHRINK_FACTOR = 0.5;

/**
 * Minimum number of bits to increase the capacity by
 * @type {number}
 */
const RESIZE_COUNT_THRESHOLD = 128;

/**
 * Dynamically sized bit field
 * @constructor
 */
function BitSet() {
    /**
     * Number of bits currently in use
     * @private
     * @type {number}
     */
    this.__length = 0;
    /**
     * Current capacity in bits, this is at least equal to length
     * @private
     * @type {number}
     */
    this.__capacity = 64;
    /**
     * @private
     * @type {Uint8Array}
     */
    this.__data = new Uint8Array(this.__capacity >> 3);

    /**
     * Acceleration parameter. Used to speed up search for next clear bit.
     * @type {number}
     * @private
     */
    this.__firstClearBitIndex = 0;
}

/**
 *
 * @param {number} numBits
 */
BitSet.prototype.setCapacity = function (numBits) {
    if (this.__length > numBits) {
        throw  new Error(`Current length is greater than requested size`);
    }
    this.__resize(numBits);
};

/**
 * Number of bits currently used for flags.
 * @returns {number}
 */
BitSet.prototype.size = function () {
    return this.__length;
};

/**
 * Number of bits reserved for the field, note that not all of these bits are typically being used.
 * @returns {number}
 */
BitSet.prototype.capacity = function () {
    return this.__capacity;
};

/**
 *
 * @param {int} bitCapacity
 * @private
 */
BitSet.prototype.__resize = function (bitCapacity) {
    assert.ok(Number.isInteger(bitCapacity), `bitCapacity must be an integer, instead was '${bitCapacity}'`)

    const byteCapacity = Math.ceil(bitCapacity / 8);

    const oldData = this.__data;
    const newData = new Uint8Array(byteCapacity);

    //copy data from old container

    const oldDataSize = oldData.length;

    if (oldDataSize < byteCapacity) {
        newData.set(oldData);
    } else {
        //creating a sub-array is using heap memory, so we prefer to avoid it
        newData.set(oldData.subarray(0, byteCapacity));
    }

    this.__data = newData;

    this.__capacity = byteCapacity * 8;
};

/**
 *
 * @param {int} newLength
 * @private
 */
BitSet.prototype.__setLength = function (newLength) {
    this.__length = newLength;

    const capacity = this.__capacity;

    if (newLength > capacity) {

        const growSize = Math.ceil(max3(newLength, capacity + RESIZE_COUNT_THRESHOLD, capacity * GROW_FACTOR));

        this.__resize(growSize);

    } else {
        if (newLength < capacity - RESIZE_COUNT_THRESHOLD && newLength < capacity * SHRINK_FACTOR) {

            this.__resize(newLength);

        }

        if (this.__firstClearBitIndex > newLength) {
            //update first clear bit index when shrinking
            this.__firstClearBitIndex = newLength;
        }
    }
};

/**
 * Returns the index of the nearest bit that is set to true that occurs on or before the specified starting index
 * @param {int} fromIndex
 * @returns {int} Index of previous set bit, or -1 if no set bit found
 */
BitSet.prototype.previousSetBit = function (fromIndex) {
    assert.ok(fromIndex >= 0, `fromIndex must be greater or equal to 0, instead was ${fromIndex}`);

    const index = min2(fromIndex, this.__length - 1);

    let byteIndex = index >> 3;
    let bitIndex = index % 8;

    const data = this.__data;

    let byte = data[byteIndex];

    //handle first byte separately due to potential partial traversal
    for (; bitIndex >= 0; bitIndex--) {
        if ((byte & MaskSet[bitIndex]) !== 0) {
            return byteIndex * 8 + bitIndex;
        }
    }

    //unwind first byte
    byteIndex--;

    //scan the rest
    for (; byteIndex >= 0; byteIndex--) {

        byte = data[byteIndex];

        for (bitIndex = 7; bitIndex >= 0; bitIndex--) {

            if ((byte & MaskSet[bitIndex]) !== 0) {
                return byteIndex * 8 + bitIndex;
            }

        }
    }

    return -1;
};

/**
 * Returns the index of the first bit that is set to false that occurs on or after the specified starting index.
 * @param {int} fromIndex
 * @returns {number} index of the next set bit, or -1 if no bits are set beyond supplied index
 */
BitSet.prototype.nextSetBit = function (fromIndex) {
    assert.ok(fromIndex >= 0, `fromIndex must be greater or equal to 0, instead was ${fromIndex}`);
    assert.ok(Number.isInteger(fromIndex), `fromIndex must be an integer, instead was ${fromIndex}`);

    /*
    TODO consider bithacks: https://stackoverflow.com/questions/21623614/finding-the-first-set-bit-in-a-binary-number
    http://graphics.stanford.edu/~seander/bithacks.html
     */

    const bitLength = this.__length;
    if (fromIndex >= bitLength) {
        //index is out of bounds, return -1
        return -1;
    }

    let byteIndex = fromIndex >> 3;
    let bitIndex = fromIndex % 8;

    const data = this.__data;

    let byte = data[byteIndex];
    let bitAddress;


    //handle first byte separately due to potential partial traversal
    for (; bitIndex < 8; bitIndex++) {
        if ((byte & MaskSet[bitIndex]) !== 0) {
            bitAddress = byteIndex * 8 + bitIndex;

            return bitAddress;
        }
    }

    //unwind first byte
    byteIndex++;

    //scan the rest
    const byteLength = bitLength / 8;
    for (; byteIndex < byteLength; byteIndex++) {
        byte = data[byteIndex];

        for (bitIndex = 0; bitIndex < 8; bitIndex++) {
            if ((byte & MaskSet[bitIndex]) !== 0) {
                bitAddress = byteIndex * 8 + bitIndex;

                return bitAddress;
            }
        }
    }


    return -1;
};

/**
 * Returns the index of the first bit that is set to false that occurs on or after the specified starting index.
 * @param {int} fromIndex
 * @returns {number}
 */
BitSet.prototype.nextClearBit = function (fromIndex) {
    assert.ok(fromIndex >= 0, `fromIndex must be greater or equal to 0, instead was ${fromIndex}`);
    assert.ok(Number.isInteger(fromIndex), `fromIndex must be an integer, instead was ${fromIndex}`);

    if (fromIndex <= this.__firstClearBitIndex) {
        return this.__firstClearBitIndex;
    }

    let byteIndex = fromIndex >> 3;
    let bitIndex = fromIndex % 8;

    let byte = this.__data[byteIndex];
    let bitAddress;


    //handle first byte separately due to potential partial traversal
    for (; bitIndex < 8; bitIndex++) {
        if ((byte & MaskSet[bitIndex]) === 0) {
            bitAddress = byteIndex * 8 + bitIndex;

            if (this.__firstClearBitIndex === -1) {
                this.__firstClearBitIndex = bitAddress;
            }

            return bitAddress;
        }
    }

    //unwind first byte
    byteIndex++;

    //scan the rest
    for (; byteIndex < this.__length; byteIndex++) {
        byte = this.__data[byteIndex];
        for (bitIndex = 0; bitIndex < 8; bitIndex++) {
            if ((byte & MaskSet[bitIndex]) === 0) {
                bitAddress = byteIndex * 8 + bitIndex;

                if (this.__firstClearBitIndex === -1) {
                    this.__firstClearBitIndex = bitAddress;
                }

                return bitAddress;
            }
        }
    }

    if (this.__firstClearBitIndex === -1) {
        this.__firstClearBitIndex = this.__length;
    }

    return this.__length;
};

/**
 * Slow method for scanning through bitset, used for debugging
 * @param {BitSet} set
 * @returns {number}
 */
function scanToFirstClearBit(set) {
    for (let i = 0; i <= set.size(); i++) {
        if (set.get(i) === false) {
            return i;
        }
    }

    return -1;
}

/**
 *
 * @param {int} bitIndex
 * @param {boolean} value
 */
BitSet.prototype.set = function (bitIndex, value) {
    assert.ok(typeof bitIndex, 'number', `bitIndex must be a number, instead was '${typeof bitIndex}'`);
    assert.ok(typeof value, 'boolean', `value must be a boolean, instead was '${typeof bitIndex}'`);

    const byteOffset = bitIndex >> 3;
    const bitOffset = bitIndex % 8;

    const oldLength = this.__length;

    if (value) {
        const bitIndexInc = bitIndex + 1;

        if (bitIndexInc > this.__length) {
            this.__setLength(bitIndexInc);
        }

        //set
        this.__data[byteOffset] |= MaskSet[bitOffset];


        if (bitIndex === this.__firstClearBitIndex) {
            if (bitIndexInc === this.__length) {
                //this was the end bit, move clear bit forward
                this.__firstClearBitIndex = this.__length;
            } else {
                //reset first clear bit index
                this.__firstClearBitIndex = -1;
            }
        }


    } else if (bitIndex < this.__length) {
        //clear
        this.__data[byteOffset] &= MaskClear[bitOffset];

        if (bitIndex === this.__length - 1) {
            const newLastSetBit = this.previousSetBit(bitIndex);

            this.__setLength(newLastSetBit + 1);
        } else if (bitIndex < this.__firstClearBitIndex) {
            //update first clear bit index
            this.__firstClearBitIndex = bitIndex;
        }
    }

    //DEBUG validate firstClearBit value
    assert.ok(this.__firstClearBitIndex === -1 || this.__firstClearBitIndex === scanToFirstClearBit(this), `Invalid first clear bit index, oldLength=${oldLength}, bitIndex=${bitIndex}`);
};

/**
 * Sets the bit specified by the index to false.
 * @param {int} bitIndex
 */
BitSet.prototype.clear = function (bitIndex) {
    this.set(bitIndex, false);
};

/**
 * Clears bit values in a given (inclusive) range
 * @param {number} startIndex first bit to be cleared
 * @param {number} endIndex last bit to be cleared
 */
BitSet.prototype.clearRange = function (startIndex, endIndex) {
    //TODO this can be done more efficiently
    for (let i = startIndex; i <= endIndex; i++) {
        this.set(i, false);
    }
};


/**
 *
 * @param {BitSet} set
 */
BitSet.prototype.and = function (set) {
    throw new Error("NIY");
};

/**
 * Returns the value of the bit with the specified index.
 * @param {int} bitIndex
 * @returns {boolean}
 */
BitSet.prototype.get = function (bitIndex) {
    if (bitIndex >= this.__length) {
        //bit is outside of the recorded region
        return false;
    }

    const byteOffset = bitIndex >> 3;
    const bitOffset = bitIndex % 8;

    const byte = this.__data[byteOffset];

    const maskedValue = byte & MaskSet[bitOffset];

    return maskedValue !== 0;
};

/**
 * Sets all of the bits in this BitSet to false.
 */
BitSet.prototype.reset = function () {
    this.__data.fill(0);
    this.__firstClearBitIndex = 0;
    this.__length = 0;
};

export { BitSet };
