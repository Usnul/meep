/**
 * Created by Alex on 27/03/2016.
 */
import Signal from '../events/signal/Signal.js';

/**
 *
 * @param {number} [x = 0]
 * @param {number} [a = 0]
 * @param {number} [b = 1]
 * @constructor
 */
const LinearValue = function (x, a, b) {
    /**
     *
     * @type {number}
     */
    this.x = x !== undefined ? x : 0;
    /**
     *
     * @type {number}
     */
    this.a = a !== undefined ? a : 0;
    /**
     *
     * @type {number}
     */
    this.b = b !== undefined ? b : 1;

    this.onChanged = new Signal();
};

/**
 *
 * @param {LinearValue} other
 * @returns {LinearValue}
 */
LinearValue.prototype.copy = function (other) {
    return this.set(other.x, other.a, other.b);
};

/**
 *
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @returns {LinearValue}
 */
LinearValue.prototype.set = function (x, a, b) {
    this.x = x;
    this.a = a;
    this.b = b;

    this.onChanged.dispatch(x, a, b);
    return this;
};

/**
 *
 * @param v
 * @returns {LinearValue}
 */
LinearValue.prototype.addMultiplier = function (v) {
    this.b += v;

    this.onChanged.dispatch(this.x, this.a, this.b);
    return this;
};

/**
 *
 * @param v
 * @returns {LinearValue}
 */
LinearValue.prototype.subMultiplier = function (v) {
    return this.addMultiplier(-v);
};

/**
 *
 * @param v
 * @returns {LinearValue}
 */
LinearValue.prototype.addConstant = function (v) {
    this.a += v;

    this.onChanged.dispatch(this.x, this.a, this.b);
    return this;
};

/**
 *
 * @param v
 * @returns {LinearValue}
 */
LinearValue.prototype.subConstant = function (v) {
    return this.addConstant(-v);
};

/**
 *
 * @returns {number}
 */
LinearValue.prototype.getValue = function () {
    // y = b*x + a
    return this.x * this.b + this.a;
};

/**
 *
 * @param {LinearValue} other
 * @returns {boolean}
 */
LinearValue.prototype.equals = function (other) {
    return this.x === other.x && this.a === other.a && this.b === other.b;
};

LinearValue.prototype.toJSON = function () {
    return {
        x: this.x,
        a: this.a,
        b: this.b
    };
};

LinearValue.prototype.fromJSON = function (json) {
    this.set(json.x, json.a, json.b);
};

export default LinearValue;
