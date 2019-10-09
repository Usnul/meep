import { assert } from "./assert.js";

/**
 * @template T
 * @param {function():T} creator
 * @param {function(T)} destroyer
 * @param {function(T)} resetter
 * @constructor
 */
function ObjectPoolFactory(creator, destroyer, resetter) {
    /**
     *
     * @type {function(): T}
     */
    this.creator = creator;
    /**
     *
     * @type {function(T)}
     */
    this.destroyer = destroyer;
    /**
     *
     * @type {function(T)}
     */
    this.resetter = resetter;

    /**
     *
     * @type {Array<T>}
     */
    this.pool = [];

    this.maxSize = 1000;
}

/**
 *
 * @returns {T}
 */
ObjectPoolFactory.prototype.create = function () {
    if (this.pool.length > 0) {
        const oldInstance = this.pool.pop();

        assert.notEqual(oldInstance, null, 'oldInstance is null');
        assert.notEqual(oldInstance, undefined, 'oldInstance is undefined');

        return oldInstance;
    } else {
        const newInstance = this.creator();


        assert.notEqual(newInstance, null, 'newInstance is null');
        assert.notEqual(newInstance, undefined, 'newInstance is undefined');

        return newInstance;
    }
};

/**
 *
 * @param {T} object
 * @returns {boolean}
 */
ObjectPoolFactory.prototype.release = function (object) {
    assert.notEqual(object, null, 'object is null');
    assert.notEqual(object, undefined, 'object is undefined');

    assert.equal(this.pool.indexOf(object), -1, `Pool already contains object that is being attempted to be release`);

    if (this.pool.length >= this.maxSize) {
        //pool is too large, destroy the object
        this.destroyer(object);

        return false;
    }


    //reset the object
    this.resetter(object);
    //add it to the pool
    this.pool.push(object);
};

export { ObjectPoolFactory };