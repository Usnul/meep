import Signal from "../events/signal/Signal.js";
import { assert } from "../assert.js";

/**
 *
 * @param {Number} value
 * @constructor
 */
function ObservedReal(value) {
    assert.equal(typeof value, "number", `Value must be of type "number", instead was "${typeof value}"`);

    /**
     *
     * @type {Number}
     * @private
     */
    this.__value = value;

    this.onChanged = new Signal();
}

/**
 *
 * @param {Number} value
 * @returns {ObservedReal}
 */
ObservedReal.prototype.set = function (value) {
    assert.equal(typeof value, "number", `Value must be of type "number", instead was "${typeof value}"`);

    const oldValue = this.__value;
    if (oldValue !== value) {
        this.__value = value;
        this.onChanged.dispatch(value, oldValue);
    }

    return this;
};

/**
 *
 * @returns {Number}
 */
ObservedReal.prototype.getValue = function () {
    return this.__value;
};

ObservedReal.prototype.toJSON = function () {
    return this.__value;
};

ObservedReal.prototype.fromJSON = function (obj) {
    this.set(obj);
};

export default ObservedReal;
