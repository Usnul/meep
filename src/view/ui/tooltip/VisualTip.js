import { assert } from "../../../model/core/assert.js";

export class VisualTip {
    /**
     *
     * @param {Rectangle} target
     * @param {function} tipFactory
     * @param {Rectangle[]} obstacles
     */
    constructor(target, tipFactory, obstacles = []) {
        assert.notEqual(target, null, 'target was null');
        assert.notEqual(target, undefined, 'target was undefined');

        assert.equal(typeof tipFactory, 'function', `tipFactory expected to be a function, instead was '${typeof tipFactory}'`)

        assert.notEqual(obstacles, undefined, 'obstacles was undefined');
        assert.ok(Array.isArray(obstacles), `obstacles must be an array but was something else`);


        /**
         *
         * @type {Rectangle}
         */
        this.target = target;
        /**
         *
         * @type {Function}
         */
        this.factory = tipFactory;

        /**
         *
         * @type {Rectangle[]}
         */
        this.obstracles = obstacles;

        /**
         *
         * @type {View|null}
         */
        this.view = null;
    }
}