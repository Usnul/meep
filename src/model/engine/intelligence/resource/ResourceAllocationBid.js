import { assert } from "../../../core/assert.js";
import { ActionSequence } from "./ActionSequence.js";

/**
 * @template A
 * A bid represents some kind of a tactical action. As such, it is atomic, either all required resources are allocated, or none.
 */
export class ResourceAllocationBid {
    /**
     * @template A
     * @param {ResourceAllocation} allocation
     * @param {number} value
     */
    constructor(allocation, value) {
        assert.notEqual(allocation, undefined, 'allocation is undefined');
        assert.notEqual(allocation, null, 'allocation is null');

        assert.typeOf(value, 'number', 'value');

        /**
         *
         * @type {ResourceAllocation}
         */
        this.allocation = allocation;
        /**
         * Perceived value of a bid from perspective of the bidder. Must be normalized to value between 0 and 1
         * @type {number}
         */
        this.value = value;

        /**
         * Represents action
         * @readonly
         * @type {ActionSequence<A>}
         */
        this.actions = new ActionSequence();

        /**
         * Weight assigned to the bid, this is dictated externally
         * @type {number}
         */
        this.weight = 1;
    }
}
