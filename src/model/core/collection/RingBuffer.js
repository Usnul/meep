import { assert } from "../assert.js";

export class RingBuffer {
    /**
     * @template V
     * @param {number} size
     * @constructor
     */
    constructor(size) {
        assert.equal(typeof size, "number", `Type of 'size' must be 'number', was '${typeof size}' instead`);
        assert.greaterThan(size, 0, `size`);

        this.size = size;

        this.head = 0;
        this.tail = 0;

        this.count = 0;

        /**
         *
         * @type {V[]}
         */
        this.data = new Array(size);
    }

    /**
     *
     * @param {V} element
     */
    push(element) {
        const head = this.head;

        this.data[head] = element;

        const newHead = (head + 1) % this.size;

        this.head = newHead;

        if (this.count === this.size) {
            //update tail
            this.tail = (this.tail + 1) % this.size;
        } else {
            this.count++;
        }

        if (newHead < head) {
            //wrap around just happened
        }
    }

    /**
     * Remove element from the tail
     * @returns {V|undefined}
     */
    shift() {
        if (this.count === 0) {
            //nothing to remove
            return undefined;
        }

        const element = this.data[this.tail];

        this.count--;
        this.tail = (this.tail + 1) % this.size;

        return element;
    }

    /**
     *
     * @param {function(V)} visitor
     * @param {*} [thisArg]
     */
    forEach(visitor, thisArg) {
        for (let i = 0; i < this.count; i++) {
            const index = (this.tail + i) % this.size;

            const el = this.data[index];

            visitor.call(thisArg, el);
        }
    }

    /**
     *
     * @param {V} value
     * @returns {boolean}
     */
    contains(value) {
        return this.data.indexOf(value) !== -1;
    }
}
