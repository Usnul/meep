/**
 *
 * @enum {boolean}
 */
import { assert } from "../assert.js";

export const EndianType = {
    BigEndian: false,
    LittleEndian: true
};

/**
 *
 * @constructor
 */
function BinaryBuffer() {
    /**
     *
     * @type {EndianType|boolean}
     */
    this.endianness = EndianType.BigEndian;

    this.position = 0;
    this.length = 0;
    this.capacity = 0;

    /**
     *
     * @type {ArrayBuffer}
     */
    this.data = new ArrayBuffer(0);
    this.dataView = new DataView(this.data);

    this.__growFactor = 1.1;
}

/**
 * @param {ArrayBuffer} arrayBuffer
 */
BinaryBuffer.prototype.fromArrayBuffer = function (arrayBuffer) {
    this.data = arrayBuffer;
    this.dataView = new DataView(arrayBuffer);

    this.capacity = arrayBuffer.byteLength;
    this.position = 0;
};

/**
 *
 * @returns {BinaryBuffer}
 */
BinaryBuffer.prototype.trim = function () {
    this.setCapacity(this.position);

    return this;
};

/**
 *
 * @param {number} capacity
 */
BinaryBuffer.prototype.setCapacity = function (capacity) {
    const oldData = new Uint8Array(this.data);
    const newData = new Uint8Array(capacity);

    //copy old data
    const copyLength = Math.min(newData.length, oldData.length);
    newData.set(oldData.subarray(0, copyLength), 0);

    this.data = newData.buffer;

    this.dataView = new DataView(this.data);

    this.capacity = capacity;
};

BinaryBuffer.prototype.ensureCapacity = function (minCapacity) {
    if (this.capacity < minCapacity) {
        const newCapacity = Math.ceil(Math.max(minCapacity, this.capacity * this.__growFactor));
        this.setCapacity(newCapacity);
    }
};

BinaryBuffer.prototype.readFloat32 = function () {
    const result = this.dataView.getFloat32(this.position, this.endianness);

    this.position += 4;

    return result;
};

BinaryBuffer.prototype.readFloat64 = function () {
    const result = this.dataView.getFloat64(this.position, this.endianness);

    this.position += 8;

    return result;
};

BinaryBuffer.prototype.readInt8 = function () {
    const result = this.dataView.getInt8(this.position);

    this.position += 1;

    return result;
};

BinaryBuffer.prototype.readInt16 = function () {
    const result = this.dataView.getInt16(this.position, this.endianness);

    this.position += 2;

    return result;
};

/**
 *
 * @returns {number}
 */
BinaryBuffer.prototype.readInt32 = function () {
    const result = this.dataView.getInt32(this.position, this.endianness);

    this.position += 4;

    return result;
};

/**
 *
 * @returns {number}
 */
BinaryBuffer.prototype.readUint8 = function () {
    const result = this.dataView.getUint8(this.position);

    this.position += 1;

    return result;
};

/**
 *
 * @returns {number}
 */
BinaryBuffer.prototype.readUint16 = function () {
    const result = this.dataView.getUint16(this.position, this.endianness);

    this.position += 2;

    return result;
};

/**
 *
 * @returns {number}
 */
BinaryBuffer.prototype.readUint16LE = function () {
    const result = this.dataView.getUint16(this.position, EndianType.LittleEndian);

    this.position += 2;

    return result;
};

/**
 *
 * @returns {number}
 */
BinaryBuffer.prototype.readUint16BE = function () {
    const result = this.dataView.getUint16(this.position, EndianType.BigEndian);

    this.position += 2;

    return result;
};

/**
 *
 * @returns {number}
 */
BinaryBuffer.prototype.readUint32 = function () {
    const result = this.dataView.getUint32(this.position, this.endianness);

    this.position += 4;

    return result;
};

/**
 *
 * @returns {number}
 */
BinaryBuffer.prototype.readUint32LE = function () {
    const result = this.dataView.getUint32(this.position, EndianType.LittleEndian);

    this.position += 4;

    return result;
};

/**
 *
 * @returns {number}
 */
BinaryBuffer.prototype.readUint32BE = function () {
    const result = this.dataView.getUint32(this.position, EndianType.BigEndian);

    this.position += 4;

    return result;
};

/**
 *
 * @param {number} offset starting index in the destination array
 * @param {number} length number of elements to read
 * @param {Uint8Array} destination
 */
BinaryBuffer.prototype.readUint8Array = function (destination, offset, length) {
    for (let i = 0; i < length; i++) {
        destination[i + offset] = this.readUint8();
    }
};

/**
 *
 * @param {number} offset starting index in the destination array
 * @param {number} length number of elements to read
 * @param {Uint16Array} destination
 */
BinaryBuffer.prototype.readUint16Array = function (destination, offset, length) {
    for (let i = 0; i < length; i++) {
        destination[i + offset] = this.readUint16();
    }
};

/**
 *
 * @param {number} offset starting index in the destination array
 * @param {number} length number of elements to read
 * @param {Uint32Array} destination
 */
BinaryBuffer.prototype.readUint32Array = function (destination, offset, length) {
    for (let i = 0; i < length; i++) {
        destination[i + offset] = this.readUint32();
    }
};

/**
 *
 * @param {number} offset starting index in the destination array
 * @param {number} length number of elements to read
 * @param {Int8Array} destination
 */
BinaryBuffer.prototype.readInt8Array = function (destination, offset, length) {
    for (let i = 0; i < length; i++) {
        destination[i + offset] = this.readInt8();
    }
};

/**
 *
 * @param {number} offset starting index in the destination array
 * @param {number} length number of elements to read
 * @param {Int16Array} destination
 */
BinaryBuffer.prototype.readInt16Array = function (destination, offset, length) {
    for (let i = 0; i < length; i++) {
        destination[i + offset] = this.readInt16();
    }
};

/**
 *
 * @param {number} offset starting index in the destination array
 * @param {number} length number of elements to read
 * @param {Int32Array} destination
 */
BinaryBuffer.prototype.readInt32Array = function (destination, offset, length) {
    for (let i = 0; i < length; i++) {
        destination[i + offset] = this.readInt32();
    }
};


/**
 *
 * @param {number} offset starting index in the destination array
 * @param {number} length number of elements to read
 * @param {Float32Array} destination
 */
BinaryBuffer.prototype.readFloat32Array = function (destination, offset, length) {
    for (let i = 0; i < length; i++) {
        destination[i + offset] = this.readFloat32();
    }
};

/**
 *
 * @param {number} offset starting index in the destination array
 * @param {number} length number of elements to read
 * @param {Float64Array} destination
 */
BinaryBuffer.prototype.readFloat64Array = function (destination, offset, length) {
    for (let i = 0; i < length; i++) {
        destination[i + offset] = this.readFloat64();
    }
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeFloat32 = function (value) {
    const end = this.position + 4;
    this.ensureCapacity(end);

    this.dataView.setFloat32(this.position, value, this.endianness);

    this.position = end;
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeFloat64 = function (value) {
    const end = this.position + 8;
    this.ensureCapacity(end);

    this.dataView.setFloat64(this.position, value, this.endianness);

    this.position = end;
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeInt8 = function (value) {
    const end = this.position + 1;
    this.ensureCapacity(end);

    this.dataView.setInt8(this.position, value);

    this.position = end;
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeInt16 = function (value) {
    const end = this.position + 2;
    this.ensureCapacity(end);

    this.dataView.setInt16(this.position, value, this.endianness);

    this.position = end;
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeInt32 = function (value) {
    const end = this.position + 4;
    this.ensureCapacity(end);

    this.dataView.setInt32(this.position, value, this.endianness);

    this.position = end;
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeUint8 = function (value) {
    const end = this.position + 1;
    this.ensureCapacity(end);

    this.dataView.setUint8(this.position, value);

    this.position = end;
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeUint16 = function (value) {
    const end = this.position + 2;
    this.ensureCapacity(end);

    this.dataView.setUint16(this.position, value, this.endianness);

    this.position = end;
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeUint16BE = function (value) {
    const end = this.position + 2;
    this.ensureCapacity(end);

    this.dataView.setUint16(this.position, value, EndianType.BigEndian);

    this.position = end;
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeUint16LE = function (value) {
    const end = this.position + 2;
    this.ensureCapacity(end);

    this.dataView.setUint16(this.position, value, EndianType.LittleEndian);

    this.position = end;
};

/**
 * 2^31-1, values above this will be cropped incorrectly when bit-shifting
 * @type {number}
 */
const MAX_SAFE_UINT_VAR = 2147483647;

/**
 * Write Uint of variable length
 * NOTE: uses 7-bit encoding with 1 bit used for carry-over flag
 * @param {number} value
 */
BinaryBuffer.prototype.writeUintVar = function (value) {
    assert.ok(value <= MAX_SAFE_UINT_VAR, `value(=${value}) exceeds maximum safe limit(=${MAX_SAFE_UINT_VAR})`);

    let first = true;

    while (first || value !== 0) {
        first = false;

        let lower7bits = (value & 0x7f);

        value >>= 7;

        if (value > 0) {
            //write carry-over flag
            lower7bits |= 128;
        }

        this.writeUint8(lower7bits);
    }
};

/**
 * Read Uint of variable length, a compliment to {@link #writeUintVar}
 * @returns {number}
 */
BinaryBuffer.prototype.readUintVar = function () {
    let more = true;
    let value = 0;
    let shift = 0;

    while (more) {
        let lower7bits = this.readUint8();

        //read carry-over flag
        more = (lower7bits & 128) !== 0;

        //read value part of the byte
        value |= (lower7bits & 0x7f) << shift;

        //increment shift
        shift += 7;
    }

    return value;
};


/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeUint32 = function (value) {
    const end = this.position + 4;
    this.ensureCapacity(end);

    this.dataView.setUint32(this.position, value, this.endianness);

    this.position = end;
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeUint32BE = function (value) {
    const end = this.position + 4;
    this.ensureCapacity(end);

    this.dataView.setUint32(this.position, value, EndianType.BigEndian);

    this.position = end;
};

/**
 *
 * @param {number} value
 */
BinaryBuffer.prototype.writeUint32LE = function (value) {
    const end = this.position + 4;
    this.ensureCapacity(end);

    this.dataView.setUint32(this.position, value, EndianType.LittleEndian);

    this.position = end;
};

/**
 *
 * @param {Uint8Array|number[]} array
 */
BinaryBuffer.prototype.writeBytes = function (array) {
    const length = array.length;
    const end = this.position + length;

    this.ensureCapacity(end);

    const target = new Uint8Array(this.data);
    target.set(array, this.position);

    this.position = end;
};

/**
 *
 * @param {Uint8Array} target
 * @param {number} targetOffset
 * @param {number} length
 */
BinaryBuffer.prototype.readBytes = function (target, targetOffset, length) {
    const end = this.position + length;
    const uint8Array = new Uint8Array(this.data);
    target.set(uint8Array.subarray(this.position, end), targetOffset);

    this.position = end;
};


/**
 * Adapted from https://github.com/samthor/fast-text-encoding/blob/master/text.js
 * @licence Original license is Apache 2.0
 * @param {String} string
 */
BinaryBuffer.prototype.writeUTF8String = function (string) {
    if (string === null) {
        //mark NULL
        this.writeUint32(4294967295);
        //bail, no string data to write
        return;
    } else if (string === undefined) {
        //mark undefined
        this.writeUint32(4294967294);

        return;
    }


    let pos = 0;
    const len = string.length;

    if (len >= 4294967294) {
        throw new Error('String is too long');
    }

    //mark non-NULL
    this.writeUint32(len);

    const startPosition = this.position;

    let at = startPosition;  // output position

    let tlen = Math.max(32, len + (len >> 1) + 7);  // 1.5x size

    this.ensureCapacity(tlen + at);

    let target = new Uint8Array(this.data);  // ... but at 8 byte offset


    while (pos < len) {
        let value = string.charCodeAt(pos++);
        if (value >= 0xd800 && value <= 0xdbff) {
            // high surrogate
            if (pos < len) {
                const extra = string.charCodeAt(pos);
                if ((extra & 0xfc00) === 0xdc00) {
                    ++pos;
                    value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                }
            }
            if (value >= 0xd800 && value <= 0xdbff) {
                continue;  // drop lone surrogate
            }
        }

        // expand the buffer if we couldn't write 4 bytes
        if (at + 4 > this.capacity) {
            tlen += 8;  // minimum extra
            tlen *= (1.0 + (pos / len) * 2);  // take 2x the remaining
            tlen = (tlen >> 3) << 3;  // 8 byte offset

            this.ensureCapacity(tlen + startPosition);

            target = new Uint8Array(this.data);
        }

        if ((value & 0xffffff80) === 0) {  // 1-byte
            target[at++] = value;  // ASCII
            continue;
        } else if ((value & 0xfffff800) === 0) {  // 2-byte
            target[at++] = ((value >> 6) & 0x1f) | 0xc0;
        } else if ((value & 0xffff0000) === 0) {  // 3-byte
            target[at++] = ((value >> 12) & 0x0f) | 0xe0;
            target[at++] = ((value >> 6) & 0x3f) | 0x80;
        } else if ((value & 0xffe00000) === 0) {  // 4-byte
            target[at++] = ((value >> 18) & 0x07) | 0xf0;
            target[at++] = ((value >> 12) & 0x3f) | 0x80;
            target[at++] = ((value >> 6) & 0x3f) | 0x80;
        } else {
            // FIXME: do we care
            continue;
        }

        target[at++] = (value & 0x3f) | 0x80;
    }

    this.position = at;
};

/**
 * Adapted from https://github.com/samthor/fast-text-encoding/blob/master/text.js
 * @licence Original license is Apache 2.0
 * @returns {String}
 */
BinaryBuffer.prototype.readUTF8String = function () {
    //check for null
    const stringLength = this.readUint32();

    if (stringLength === 4294967295) {
        //null string
        return null;
    } else if (stringLength === 4294967294) {
        //undefined string
        return undefined;
    }

    const bytes = new Uint8Array(this.data);


    let result = "";

    let i = this.position;

    let charCount = 0;

    while (i < this.capacity && charCount < stringLength) {
        const byte1 = bytes[i++];
        let codePoint;

        if (byte1 === 0) {
            break;  // NULL
        }

        if ((byte1 & 0x80) === 0) {  // 1-byte
            codePoint = byte1;
        } else if ((byte1 & 0xe0) === 0xc0) {  // 2-byte
            const byte2 = bytes[i++] & 0x3f;
            codePoint = (((byte1 & 0x1f) << 6) | byte2);
        } else if ((byte1 & 0xf0) === 0xe0) {
            const byte2 = bytes[i++] & 0x3f;
            const byte3 = bytes[i++] & 0x3f;
            codePoint = (((byte1 & 0x1f) << 12) | (byte2 << 6) | byte3);
        } else if ((byte1 & 0xf8) === 0xf0) {
            const byte2 = bytes[i++] & 0x3f;
            const byte3 = bytes[i++] & 0x3f;
            const byte4 = bytes[i++] & 0x3f;

            // this can be > 0xffff, so possibly generate surrogates
            codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4;
            if (codePoint > 0xffff) {
                // codepoint &= ~0x10000;
                codePoint -= 0x10000;

                result += String.fromCharCode((codePoint >>> 10) & 0x3ff | 0xd800);
                charCount++;

                codePoint = 0xdc00 | codePoint & 0x3ff;
            }
        } else {
            // FIXME: we're ignoring this
        }

        charCount++;
        result += String.fromCharCode(codePoint);

    }

    this.position = i;

    return result;
};

export { BinaryBuffer };
