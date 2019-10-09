/**
 * Created by Alex on 29/01/14.
 */


import { assert } from "../assert.js";

/**
 *
 * @enum {number}
 */
const EdgeDirectionType = {
    Undirected: 3,
    Forward: 1,
    Backward: 2
};

/**
 * @template N
 * @param {N} a
 * @param {N} b
 * @constructor
 */
function Edge(a, b) {
    assert.notEqual(a, undefined, 'a is undefined');
    assert.notEqual(b, undefined, 'b is undefined');

    /**
     *
     * @type {N}
     */
    this.first = a;
    /**
     *
     * @type {N}
     */
    this.second = b;

    /**
     * @type {EdgeDirectionType}
     */
    this.direction = EdgeDirectionType.Undirected;
}

Edge.prototype.contains = function (node) {
    return this.first === node || this.second === node;
};

Edge.prototype.validateTransition = function (source, target) {
    const a = this.first;
    const b = this.second;
    return (a === source && b === target && this.traversableForward()) || (b === source && a === target && this.traversableBackward());
};

/**
 * Provided one of the associated nodes - returns the other one, if supplied node is not connecting the edge - returns first node (unintended behaviour)
 * @param {N} node
 * @returns {second|first}
 */
Edge.prototype.other = function (node) {
    return (node === this.first) ? this.second : this.first;
};

/**
 *
 * @returns {boolean}
 */
Edge.prototype.traversableForward = function () {
    return (this.direction & EdgeDirectionType.Forward) !== 0;
};


/**
 *
 * @returns {boolean}
 */
Edge.prototype.traversableBackward = function () {
    return (this.direction & EdgeDirectionType.Backward) !== 0;
};

/**
 * @deprecated
 */
Edge.prototype.__defineGetter__("nodes", function () {
    return [this.first, this.second];
});

Edge.prototype.__defineGetter__("length", function () {
    return this.first.distanceTo(this.second);
});

/**
 * @deprecated
 * @returns {number}
 */
Edge.prototype.angle = function () {
    const delta = this.second.clone().sub(this.first);
    return Math.atan2(delta.y, delta.x);
};

export { Edge, EdgeDirectionType };
