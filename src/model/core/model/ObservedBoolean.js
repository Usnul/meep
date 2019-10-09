import Signal from '../events/signal/Signal.js';
import { assert } from "../assert.js";

/**
 *
 * @param {boolean} value
 * @constructor
 */
function ObservedBoolean(value) {
    assert.equal(typeof value, "boolean", `Value must be of type "boolean", instead was "${typeof value}"`);

    /**
     *
     * @type {Boolean}
     * @private
     */
    this.__value = value;

    this.onChanged = new Signal();
}

ObservedBoolean.prototype = Object.create(Boolean.prototype);

ObservedBoolean.FALSE = Object.freeze(new ObservedBoolean(false));
ObservedBoolean.TRUE = Object.freeze(new ObservedBoolean(true));


/**
 * @readonly
 * @type {boolean}
 */
ObservedBoolean.prototype.isObservedBoolean = true;

/**
 *
 * @returns {Boolean}
 */
ObservedBoolean.prototype.valueOf = function () {
    return this.__value;
};

/**
 *
 * @returns {string}
 */
ObservedBoolean.prototype.toString = function () {
    return this.__value.toString();
};

/**
 *
 * @param {Boolean} value
 * @returns {ObservedBoolean}
 */
ObservedBoolean.prototype.set = function (value) {
    assert.equal(typeof value, "boolean", `Value must be of type "boolean", instead was "${typeof value}"`);

    const oldValue = this.__value;
    if (oldValue !== value) {
        this.__value = value;
        this.onChanged.dispatch(value, oldValue);
    }

    return this;
};

/**
 *
 * @param {ObservedBoolean} other
 */
ObservedBoolean.prototype.copy = function (other) {
    this.set(other.getValue());
};

/**
 *
 * @param {ObservedBoolean} other
 * @returns {boolean}
 */
ObservedBoolean.prototype.equals = function (other) {
    return this.__value === other.__value;
};

/**
 *
 * @param {function} f
 */
ObservedBoolean.prototype.process = function (f) {
    f(this.__value);
    this.onChanged.add(f);
};

/**
 *
 * @returns {Boolean}
 */
ObservedBoolean.prototype.getValue = function () {
    return this.__value;
};

/**
 * Flip value. If value is true - it becomes false, if it was false it becomes true
 */
ObservedBoolean.prototype.invert = function () {
    this.set(!this.__value);
};

ObservedBoolean.prototype.toJSON = function () {
    return this.__value;
};

ObservedBoolean.prototype.fromJSON = function (obj) {
    this.set(obj);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ObservedBoolean.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeUint8(this.__value ? 1 : 0);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ObservedBoolean.prototype.fromBinaryBuffer = function (buffer) {
    const v = buffer.readUint8() !== 0;
    this.set(v);
};
export default ObservedBoolean;
