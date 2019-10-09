/**
 * @template T
 * @param {T} target
 * @constructor
 */
import { assert } from "./core/assert.js";

function Reference(target) {
    /**
     *
     * @type {T}
     */
    this.target = target;
    /**
     *
     * @type {number}
     */
    this.count = 0;
}

/**
 * @template Key, Value
 * @param {function(Key):Value} creator
 * @param {function(Key,Value)} destroyer
 * @constructor
 */
function ReferenceManager(creator, destroyer) {
    /**
     *
     * @type {Map<Key, Reference.<Value>>}
     */
    this.mapping = new Map();

    this.creator = creator;
    this.destoroyer = destroyer;
}

/**
 *
 * @param {Key} key
 * @returns {number}
 */
ReferenceManager.prototype.getCount = function (key) {
    const ref = this.mapping.get(key);
    if (ref !== undefined) {
        return ref.count;
    } else {
        return 0;
    }
};

/**
 *
 * @param {Key} key
 * @returns {Value}
 */
ReferenceManager.prototype.acquire = function (key) {
    let ref;

    if (this.mapping.has(key)) {
        ref = this.mapping.get(key);
    } else {
        const value = this.creator(key);
        ref = new Reference(value);
        this.mapping.set(key, ref);
    }

    ref.count++;
    return ref.target;
};

/**
 *
 * @param {Key} key
 */
ReferenceManager.prototype.release = function (key) {
    const ref = this.mapping.get(key);

    if (ref === undefined) {
        //reference doesn't exist
        console.warn(`Attempted to release reference '${key}'. Reference not managed.`);
        return;
    }

    assert.greaterThan(ref.count, 0, `Attempted to release a reference when ref.count is 0 or less`);

    ref.count--;

    if (ref.count <= 0) {

        //last reference released
        this.mapping.delete(key);

        this.destoroyer(key, ref.target);

    }
};

ReferenceManager.prototype.reset = function () {
    this.mapping.clear();
};

export {
    ReferenceManager
};
