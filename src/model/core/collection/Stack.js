import Signal from "../events/signal/Signal.js";

/**
 * @template T
 * @class
 */
export class Stack {
    /**
     * @template T
     */
    constructor() {

        /**
         * @private
         * @type {T[]}
         */
        this.data = [];

        this.on = {
            removed: new Signal(),
            added: new Signal()
        };

    }

    /**
     * @returns {T[]}
     */
    asArray() {
        return this.data.slice();
    }

    /**
     *
     * @returns {boolean}
     */
    isEmpty() {
        return this.data.length <= 0;
    }


    /**
     * Insert element at the top
     * @param {T} value
     */
    push(value) {
        this.data.push(value);

        this.on.added.send1(value);
    }

    /**
     * Remove top element and return it
     * @returns {T|undefined}
     */
    pop() {
        if (this.isEmpty()) {
            return undefined;
        }

        const v = this.data.pop();

        this.on.removed.send1(v);

        return v;

    }


    /**
     * Return top element without removing it
     * @returns {T|undefined}
     */
    peek() {
        return this.data[this.data.length - 1];
    }

    /**
     * Remove all elements from the stack
     */
    clear() {
        if (this.on.removed.hasHandlers()) {

            while (!this.isEmpty()) {
                this.pop();
            }

        } else {
            //no handlers, can do this faster
            this.data.splice(0, this.data.length);
        }
    }
}
