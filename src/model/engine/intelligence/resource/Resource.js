import { assert } from "../../../core/assert.js";

/**
 * @template T
 */
export class Resource {

    /**
     * @template T
     * @param {number} amount
     * @param {T} type
     */
    constructor(amount, type) {
        assert.typeOf(amount, 'number', 'amount');

        assert.notEqual(type, undefined, 'type is undefined');
        assert.notEqual(type, null, 'type is null');

        /**
         *
         * @type {T}
         */
        this.type = type;

        /**
         *
         * @type {number}
         */
        this.amount = amount;
    }

    /**
     *
     * @param {Resource} other
     * @returns {boolean}
     */
    equals(other) {
        return this.type === other.type && this.amount === other.amount;
    }

    /**
     *
     * @param {Resource}other
     */
    copy(other) {
        this.amount = other.amount;
        this.type = other.type;
    }

    /**
     *
     * @returns {Resource}
     */
    clone() {
        return new Resource(this.amount, this.type);
    }
}
