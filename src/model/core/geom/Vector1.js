/**
 * @author Alex Goldring
 * @copyright Alex Goldring 2018
 */

import Signal from "../events/signal/Signal.js";
import { clamp, computeHashFloat } from "../math/MathUtils";
import { assert } from "../assert.js";


/**
 *
 * @param {number} [x=0]
 * @constructor
 * @class
 * @property {number} x
 */
function Vector1(x = 0) {
    assert.equal(typeof x, "number", `X must be of type "number", instead was "${typeof x}"`);

    assert.ok(!Number.isNaN(x), `X must be a valid number, instead was NaN`);

    this.x = x;
    this.onChanged = new Signal();
}

Vector1.typeName = "Vector1";

Vector1.prototype = Object.create(Number.prototype);

/**
 * Inherited from Number class
 * @returns {number}
 */
Vector1.prototype.valueOf = function () {
    return this.x;
};

/**
 *
 * @returns {string}
 */
Vector1.prototype.toString = function () {
    return String(this.x);
};

/**
 *
 * @returns {number}
 */
Vector1.prototype.getValue = function () {
    return this.x;
};

/**
 *
 * @param {number} x
 * @returns {Vector1}
 */
Vector1.prototype.set = function (x) {
    assert.equal(typeof x, "number", `X must be of type "number", instead was "${typeof x}"`);

    assert.ok(!Number.isNaN(x), `X must be a valid number, instead was NaN`);

    const oldValue = this.x;
    if (oldValue !== x) {
        this.x = x;

        if (this.onChanged.hasHandlers()) {
            this.onChanged.dispatch(x, oldValue);
        }
    }

    return this;
};

Vector1.prototype.increment = function () {
    this._add(1);
};

Vector1.prototype.decrement = function () {
    this._add(-1);
};

/**
 *
 * @param {Number} v
 * @return {Vector1}
 */
Vector1.prototype._add = function (v) {
    return this.set(this.x + v);
};

/**
 *
 * @param {Vector1|Vector2|Vector3|Vector4} other
 */
Vector1.prototype.add = function (other) {
    return this._add(other.x);
};

/**
 *
 * @param {Number} v
 * @return {Vector1}
 */
Vector1.prototype._sub = function (v) {
    return this._add(-v);
};

/**
 *
 * @param {Vector1} other
 * @returns {Vector1}
 */
Vector1.prototype.sub = function (other) {
    return this._sub(other.x);
};

/**
 *
 * @param {Vector1} other
 * @returns {Vector1}
 */
Vector1.prototype.multiply = function (other) {
    return this.set(this.x * other.x);
};

/**
 *
 * @param {number} v
 */
Vector1.prototype.multiplyScalar = function (v) {
    this.set(this.x * v);
};

/**
 *
 * @param {number} low
 * @param {number} high
 * @returns {Vector1}
 */
Vector1.prototype.clamp = function (low, high) {
    return this.set(clamp(this.x, low, high));
};

/**
 *
 * @param {Vector1|Vector2|Vector3|Vector4} other
 */
Vector1.prototype.copy = function (other) {
    this.set(other.x);
};

/**
 *
 * @returns {Vector1}
 */
Vector1.prototype.clone = function () {
    return new Vector1(this.x);
};

/**
 *
 * @param {Vector1} other
 * @returns {boolean}
 */
Vector1.prototype.equals = function (other) {
    return this.x === other.x;
};

/**
 * @returns {number}
 */
Vector1.prototype.hash = function () {
    return computeHashFloat(this.x);
};

/**
 *
 * @param {function(newValue:number, oldValue:number)} handler
 */
Vector1.prototype.process = function (handler) {
    handler(this.x, this.x);
    this.onChanged.add(handler);
};

Vector1.prototype.toJSON = function () {
    return this.x;
};

Vector1.prototype.fromJSON = function (val) {
    this.set(val);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Vector1.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeFloat64(this.x);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Vector1.prototype.fromBinaryBuffer = function (buffer) {
    const x = buffer.readFloat64();

    this.set(x);
};

export default Vector1;
