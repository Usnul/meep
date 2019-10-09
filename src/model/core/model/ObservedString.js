/**
 * @author Alex Goldring 2018
 * @copyright Alex Goldring 2018
 */

import Signal from "../events/signal/Signal.js";
import { assert } from "../assert.js";
import { computeStringHash } from "../strings/StringUtils.js";

class ObservedString extends String{
    /**
     *
     * @param {String} value
     * @constructor
     */
    constructor(value) {
        super();

        assert.equal(typeof value, "string", `Value must be of type "string", instead was "${typeof value}"`);

        /**
         *
         * @type {String}
         * @private
         */
        this.__value = value;

        this.onChanged = new Signal();
        /**
         * Used for optimized "instanceof" check
         * @type {boolean}
         */
        this.isObservedString = true;
    }

    /**
     *
     * @returns {String}
     */
    valueOf() {
        return this.__value;
    }

    /**
     *
     * @returns {String}
     */
    toString() {
        return this.__value;
    }

    /**
     *
     * @param {String} value
     * @returns {ObservedString}
     */
    set(value) {
        assert.equal(typeof value, "string", `Value must be of type "string", instead was "${typeof value}" (=${value})`);

        const oldValue = this.__value;
        if (oldValue !== value) {
            this.__value = value;
            this.onChanged.dispatch(value, oldValue);
        }

        return this;
    }

    /**
     *
     * @param {ObservedString} other
     */
    copy(other) {
        this.set(other.getValue());
    }

    /**
     *
     * @param {ObservedString} other
     * @returns {boolean}
     */
    equals(other) {
        return this.__value === other.__value;
    }

    /**
     *
     * @returns {String}
     */
    getValue() {
        return this.__value;
    }

    /**
     *
     * @param {function} f
     */
    process(f) {
        f(this.getValue());

        this.onChanged.add(f);
    }

    toJSON() {
        return this.__value;
    }

    fromJSON(obj) {
        this.set(obj);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        buffer.writeUTF8String(this.__value);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        const value = buffer.readUTF8String();

        this.set(value);
    }

    hash() {
        return computeStringHash(this.__value);
    }
}

export default ObservedString;
