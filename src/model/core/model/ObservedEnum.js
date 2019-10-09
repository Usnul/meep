import Signal from "../events/signal/Signal.js";
import { assert } from "../assert.js";

/**
 * @template T
 * @param {T} value
 * @param {Object.<string,T>} validSet
 * @constructor
 */
function ObservedEnum(value, validSet) {
    assert.equal(typeof validSet, "object", `ValidSet must be of type "object", instead was ${typeof validSet}`);
    assert.notEqual(Object.values(validSet).indexOf(value), -1, `Value must be one of [${Object.values(validSet).join(", ")}], instead was "${value}"`);

    /**
     *
     * @type {T}
     * @private
     */
    this.__value = value;
    this.__validSet = validSet;

    this.onChanged = new Signal();
}

/**
 *
 * @param {T} value
 * @returns {ObservedEnum}
 */
ObservedEnum.prototype.set = function (value) {
    assert.notEqual(Object.values(this.__validSet).indexOf(value), -1, `Value must be one of [${Object.values(this.__validSet).join(", ")}], instead was "${value}"`);

    const oldValue = this.__value;
    if (oldValue !== value) {
        this.__value = value;
        this.onChanged.dispatch(value, oldValue);
    }

    return this;
};

/**
 *
 * @param {ObservedEnum} other
 */
ObservedEnum.prototype.copy = function (other) {
    this.set(other.getValue());
};

/**
 *
 * @returns {T}
 */
ObservedEnum.prototype.getValue = function () {
    return this.__value;
};

ObservedEnum.prototype.invert = function () {
    this.set(!this.__value);
};

/**
 *
 * @param {function(T,T)} processor
 */
ObservedEnum.prototype.process = function (processor) {
    this.onChanged.add(processor);

    processor(this.__value, this.__value);
};

ObservedEnum.prototype.toJSON = function () {
    return this.__value;
};

ObservedEnum.prototype.fromJSON = function (obj) {
    this.set(obj);
};

export default ObservedEnum;
