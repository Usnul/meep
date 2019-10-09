import Signal from "../events/signal/Signal.js";
import { assert } from "../assert.js";

/**
 *
 * @param {Number} value
 * @constructor
 */
function ObservedInteger(value) {
    assert.equal(typeof value, "number", `Value must be of type "number", instead was "${typeof value}"`);
    assert.ok(Number.isInteger(value) || !Number.isFinite(value), `Value must be an integer, instead was ${value}`);

    /**
     *
     * @type {Number}
     * @private
     */
    this.__value = value;

    this.onChanged = new Signal();
}

ObservedInteger.prototype = Object.create(Number.prototype);

/**
 *
 * @returns {Number}
 */
ObservedInteger.prototype.valueOf = function () {
    return this.getValue();
};

ObservedInteger.prototype.toString = function () {
    return this.getValue().toString();
};

/**
 *
 * @param {Number} value
 * @returns {ObservedReal}
 */
ObservedInteger.prototype.set = function (value) {
    assert.equal(typeof value, "number", `Value must be of type "number", instead was "${typeof value}"`);
    assert.ok(Number.isInteger(value) || !Number.isFinite(value), `Value must be an integer, instead was ${value}`);

    const oldValue = this.__value;
    if (oldValue !== value) {
        this.__value = value;
        this.onChanged.dispatch(value, oldValue);
    }

    return this;
};

/**
 *
 * @param {ObservedInteger} other
 */
ObservedInteger.prototype.add = function (other) {
    return this._add(other.getValue());
};

/**
 *
 * @param {number} value
 * @returns {ObservedReal}
 */
ObservedInteger.prototype._add = function (value) {
    return this.set(this.getValue() + value);
};

/**
 * Increment the stored value by 1, same as adding 1
 */
ObservedInteger.prototype.increment = function () {
    this.set(this.getValue() + 1);
};

/**
 * Decrement the stored value by 1, same as subtracting 1
 */
ObservedInteger.prototype.decrement = function () {
    this.set(this.getValue() - 1);
};

/**
 *
 * @returns {Number}
 */
ObservedInteger.prototype.getValue = function () {
    return this.__value;
};

/**
 *
 * @param {ObservedInteger} other
 */
ObservedInteger.prototype.copy = function (other) {
    this.set(other.__value);
};

/**
 *
 * @param {ObservedInteger} other
 * @returns {boolean}
 */
ObservedInteger.prototype.equals = function (other) {
    return this.__value === other.__value;
};

ObservedInteger.prototype.toJSON = function () {
    return this.__value;
};

ObservedInteger.prototype.fromJSON = function (obj) {
    this.set(obj);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ObservedInteger.prototype.toBinaryBuffer = function (buffer) {
    const v = this.__value;

    if (v === Infinity) {
        buffer.writeInt32(2147483647);
    } else if (v === -Infinity) {
        buffer.writeInt32(-2147483648);
    } else {
        //TODO it's possible to write encoded Infinity values by accident
        buffer.writeInt32(v);
    }
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ObservedInteger.prototype.fromBinaryBuffer = function (buffer) {
    const value = buffer.readInt32();

    if (value === 2147483647) {
        this.set(Infinity);
    } else if (value === -2147483648) {
        this.set(-Infinity);
    } else {
        this.set(value);
    }
};

export default ObservedInteger;
