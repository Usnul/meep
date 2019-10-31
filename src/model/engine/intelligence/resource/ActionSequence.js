/**
 * @template A
 */
export class ActionSequence {

    /**
     * @template A
     */
    constructor() {
        /**
         *
         * @type {A[]}
         */
        this.actions = [];

        /**
         *
         * @type {number}
         */
        this.priority = 0;
    }

    /**
     *
     * @param {number} v
     */
    setPriority(v) {
        this.priority = v;
    }

    /**
     *
     * @returns {number}
     */
    getPriority() {
        return this.priority;
    }

    /**
     *
     * @param {A} action
     */
    add(action) {
        this.actions.push(action);
    }
}
