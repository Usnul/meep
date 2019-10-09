import { Behavior } from "../Behavior.js";

export class CompositeBehavior extends Behavior {
    constructor() {
        super();

        /**
         *
         * @type {Behavior[]}
         * @protected
         */
        this.__children = [];
    }

    /**
     *
     * @param {Behavior} child
     */
    addChild(child) {
        this.__children.push(child);
    }

    /**
     *
     * @param {Behavior} child
     */
    removeChild(child) {
        const i = this.__children.indexOf(child);

        if (i === -1) {
            //child is not found
        } else {
            this.__children.splice(i, 1);
        }
    }

    clearChildren() {
        this.__children = [];
    }
}