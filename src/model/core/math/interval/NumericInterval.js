/**
 *
 * @param {number} min
 * @param {number} max
 * @constructor
 */
import { assert } from "../../assert.js";
import Signal from "../../events/signal/Signal.js";
import { computeHashFloat, inverseLerp } from "../MathUtils.js";

/**
 *
 * @param {number} [min=-Infinity]
 * @param {number} [max=Infinity]
 * @constructor
 */
function NumericInterval(
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY
) {
    assert.ok(typeof min === "number", `min must be a number, instead was "${typeof min}"`);
    assert.ok(typeof max === "number", `min must be a number, instead was "${typeof max}"`);

    assert.ok(max >= min, `max(${max}) must be >= than min(${min})`);

    /**
     *
     * @type {number}
     */
    this.min = min;
    /**
     *
     * @type {number}
     */
    this.max = max;

    this.onChanged = new Signal();
}

/**
 *
 * @param {number} min
 * @param {number} max
 */
NumericInterval.prototype.set = function (min, max) {
    assert.ok(typeof min === "number", `min must be a number, instead was "${typeof min}"`);
    assert.ok(typeof max === "number", `min must be a number, instead was "${typeof max}"`);

    assert.ok(max >= min, `max(${max}) must be >= than min(${min})`);

    const oldMin = this.min;
    const oldMax = this.max;

    if (min !== oldMin || max !== oldMax) {
        this.min = min;
        this.max = max;

        if (this.onChanged.hasHandlers()) {
            this.onChanged.dispatch(min, max, oldMin, oldMax);
        }
    }
};


/**
 *
 * @param {number} value
 */
NumericInterval.prototype.multiplyScalar = function (value) {
    const v0 = this.min * value;
    const v1 = this.max * value;

    if (v0 > v1) {
        //probably negative scale
        this.set(v1, v0);
    } else {

        this.set(v0, v1);
    }
};

/**
 * Performs inverse linear interpolation on a given input
 * @param {number} v
 * @returns {number}
 */
NumericInterval.prototype.normalizeValue = function (v) {
    return inverseLerp(this.min, this.max, v);
};

/**
 * Both min and max are exactly 0
 * @returns {boolean}
 */
NumericInterval.prototype.isZero = function () {
    return this.min === 0 && this.max === 0;
};

/**
 *
 * @param {function} random Random number generator function, must return values between 0 and 1
 * @returns {number}
 */
NumericInterval.prototype.sampleRandom = function (random) {
    assert.equal(typeof random, 'function', `random must be a function, instead was ${typeof random}`);

    return this.min + random() * (this.max - this.min);
};

NumericInterval.prototype.fromJSON = function (json) {
    this.set(json.min, json.max);
};

NumericInterval.prototype.toJSON = function () {
    return {
        min: this.min,
        max: this.max
    };
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
NumericInterval.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeFloat64(this.min);
    buffer.writeFloat64(this.max);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
NumericInterval.prototype.fromBinaryBuffer = function (buffer) {
    this.min = buffer.readFloat64();
    this.max = buffer.readFloat64();
};

/**
 *
 * @param {NumericInterval} other
 * @returns {boolean}
 */
NumericInterval.prototype.equals = function (other) {
    return this.min === other.min && this.max === other.max;
};

/**
 *
 * @returns {number}
 */
NumericInterval.prototype.hash = function () {
    let hash = computeHashFloat(this.min);

    hash = ((hash << 5) - hash) + computeHashFloat(this.max);

    return hash;
};

export { NumericInterval };
