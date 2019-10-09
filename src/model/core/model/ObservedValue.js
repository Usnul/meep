/**
 * Created by Alex on 21/03/2016.
 */

import Signal from '../events/signal/Signal.js';

/**
 *
 * @template T
 * @param {T} v
 * @constructor
 */
function ObservedValue(v) {
    this.onChanged = new Signal();
    this.__value = v;
}

/**
 *
 * @param {T} value
 */
ObservedValue.prototype.set = function (value) {
    if (this.__value !== value) {
        const oldValue = this.__value;
        this.__value = value;
        this.onChanged.dispatch(value, oldValue);
    }
};

/**
 * Set value without triggering {@link #onChanged} signal
 * @param {T} value
 * @see #set
 */
ObservedValue.prototype.setSilent = function (value) {
    this.__value = value;
};

/**
 *
 * @returns {T}
 */
ObservedValue.prototype.get = function () {
    return this.__value;
};

/**
 *
 * @type {(function(): T)}
 */
ObservedValue.prototype.getValue = ObservedValue.prototype.get;

/**
 *
 * @param {ObservedValue} other
 */
ObservedValue.prototype.copy = function (other) {
    this.set(other.__value);
};

/**
 *
 * @param {ObservedValue} other
 * @returns {boolean}
 */
ObservedValue.prototype.equals = function (other) {
    return (typeof other === 'object') && this.__value === other.__value;
};

/**
 *
 * @returns {ObservedValue.<T>}
 */
ObservedValue.prototype.clone = function () {
    return new ObservedValue(this.__value);
};

/**
 * Convenience method, invoked given function with current value and registers onChanged callback
 * @param {function} processor
 * @returns {ObservedValue.<T>}
 */
ObservedValue.prototype.process = function (processor) {
    processor(this.__value);
    this.onChanged.add(processor);
    return this;
};

ObservedValue.prototype.toString = function () {
    return JSON.stringify({
        value: this.__value
    });
};

ObservedValue.prototype.toJSON = function () {
    return this.get();
};

ObservedValue.prototype.fromJSON = function (value) {
    this.set(value);
};

export default ObservedValue;
