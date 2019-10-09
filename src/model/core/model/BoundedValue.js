/**
 * Created by Alex on 21/03/2016.
 */


import Signal from "../events/signal/Signal.js";
import { inverseLerp } from "../math/MathUtils.js";

/**
 *
 * @param {Number} currentValue
 * @param {Number} upperLimit
 * @param {Number} [lowerLimit=0]
 * @constructor
 */
const BoundedValue = function (currentValue, upperLimit, lowerLimit) {
    /**
     * @property {Number}
     * @private
     */
    this.__value = currentValue !== undefined ? currentValue : 0;
    /**
     * @property {Number}
     * @private
     */
    this.__limitUpper = upperLimit !== undefined ? upperLimit : 0;

    /**
     * @type {Number}
     * @private
     */
    this.__limitLower = lowerLimit !== undefined ? lowerLimit : 0;

    this.onChanged = new Signal();
    this.onOverflow = new Signal();
    this.onFilled = new Signal();

    this.on = {
        changed: this.onChanged,
        overflow: this.onOverflow
    };
};

/**
 *
 * @param {Number} v
 */
BoundedValue.prototype.setUpperLimit = function (v) {
    const oldValue = this.__limitUpper;
    if (v === oldValue) {
        //no change
        return;
    }
    this.__limitUpper = v;
    this.onChanged.dispatch(this.__value, this.__limitUpper, this.__value, oldValue);
};


/**
 *
 * @returns {Number}
 */
BoundedValue.prototype.getUpperLimit = function () {
    return this.__limitUpper;
};

/**
 *
 * @returns {Number}
 */
BoundedValue.prototype.getLowerLimit = function () {
    return this.__limitLower;
};
/**
 *
 * @param {Number} v
 */
BoundedValue.prototype.setLowerLimit = function (v) {
    const old = this.__limitLower;

    if (v === old) {
        //no change
        return;
    }

    this.__limitLower = v;

    //TODO change signal signature to include lower limit
    this.onChanged.dispatch();
};

/**
 *
 * @param {Number} v
 */
BoundedValue.prototype.setValue = function (v) {
    const oldValue = this.__value;
    if (oldValue === v) {
        //no change
        return;
    }

    const spill = v - this.__limitUpper;
    this.__value = v;
    //dispatch change
    this.onChanged.dispatch(this.__value, this.__limitUpper, oldValue, this.__limitUpper);
    if (spill > 0) {
        this.onOverflow.dispatch(spill);
    }
    if (spill >= 0) {
        this.onFilled.dispatch();
    }
};

/**
 *
 * @returns {Number}
 */
BoundedValue.prototype.getValue = function () {
    return this.__value;
};


/**
 *
 * @returns {number}
 */
BoundedValue.prototype.getFraction = function () {
    return inverseLerp(this.__limitLower, this.__limitUpper, this.__value);
};

/**
 *
 */
BoundedValue.prototype.setValueToLimit = function () {
    this.setValue(this.__limitUpper);
};

/**
 *
 * @return {boolean}
 */
BoundedValue.prototype.isValueAtLimit = function () {
    return this.__value === this.__limitUpper;
};

/**
 *
 * @param {Number} val
 */
BoundedValue.prototype.addValue = function (val) {
    this.setValue(this.__value + val);
};

/**
 *
 * @param {BoundedValue} other
 * @returns {BoundedValue}
 */
BoundedValue.prototype.copy = function (other) {
    this.setUpperLimit(other.getUpperLimit());
    this.setValue(other.getValue());
    return this;
};

/**
 *
 * @param {BoundedValue} other
 * @returns {boolean}
 */
BoundedValue.prototype.equals = function (other) {
    return this.__value === other.__value && this.__limitLower === other.__limitLower && this.__limitUpper === other.__limitUpper;
};

BoundedValue.prototype.toJSON = function () {
    return {
        value: this.__value,
        limit: this.__limitUpper
    };
};

BoundedValue.prototype.fromJSON = function (json) {
    this.setUpperLimit(json.limit);
    this.setValue(json.value);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
BoundedValue.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeFloat64(this.__value);
    buffer.writeFloat64(this.__limitUpper);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
BoundedValue.prototype.fromBinaryBuffer = function (buffer) {
    const value = buffer.readFloat64();
    const upperLimit = buffer.readFloat64();

    this.setUpperLimit(upperLimit);
    this.setValue(value);
};

export default BoundedValue;
