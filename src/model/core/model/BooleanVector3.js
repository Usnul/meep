import { assert } from "../assert.js";
import Signal from "../events/signal/Signal.js";

/**
 *
 * @param {boolean} x
 * @param {boolean} y
 * @param {boolean} z
 * @constructor
 */
function BooleanVector3(x = false, y = false, z = false) {
    /**
     *
     * @type {boolean}
     */
    this.x = x;
    /**
     *
     * @type {boolean}
     */
    this.y = y;
    /**
     *
     * @type {boolean}
     */
    this.z = z;

    this.onChanged = new Signal();
}

/**
 *
 * @param {boolean} x
 * @param {boolean} y
 * @param {boolean} z
 */
BooleanVector3.prototype.set = function (x, y, z) {
    assert.equal(typeof x, 'boolean', `expected x to be a boolean, instead was '${typeof x}'`);
    assert.equal(typeof y, 'boolean', `expected y to be a boolean, instead was '${typeof y}'`);
    assert.equal(typeof z, 'boolean', `expected z to be a boolean, instead was '${typeof z}'`);

    const _x = this.x;
    const _y = this.y;
    const _z = this.z;

    if (x !== _x || y !== _y || z !== _z) {
        this.x = x;
        this.y = y;
        this.z = z;

        if (this.onChanged.hasHandlers()) {
            this.onChanged.dispatch(x, y, z, _x, _y, _z);
        }
    }
};

/**
 *
 * @param {boolean} v
 */
BooleanVector3.prototype.setX = function (v) {
    this.set(v, this.y, this.z);
};

/**
 *
 * @param {boolean} v
 */
BooleanVector3.prototype.setY = function (v) {
    this.set(this.x, v, this.z);
};

/**
 *
 * @param {boolean} v
 */
BooleanVector3.prototype.setZ = function (v) {
    this.set(this.x, this.y, v);
};

BooleanVector3.prototype.toJSON = function () {
    return {
        x: this.x,
        y: this.y,
        z: this.z
    };
};

BooleanVector3.prototype.fromJSON = function (json) {
    this.set(json.x, json.y, json.z);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
BooleanVector3.prototype.toBinaryBuffer = function (buffer) {
    const v = (this.x ? 1 : 0) | (this.y ? 2 : 0) | (this.z ? 4 : 0);

    buffer.writeUint8(v);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
BooleanVector3.prototype.fromBinaryBuffer = function (buffer) {
    const value = buffer.readUint8();

    const x = (value & 1) !== 0;
    const y = (value & 2) !== 0;
    const z = (value & 4) !== 0;

    this.set(x, y, z);
};

export { BooleanVector3 };
