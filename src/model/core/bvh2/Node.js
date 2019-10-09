/**
 * Created by Alex on 17/11/2014.
 */
import { AABB3 } from './AABB3';
import computeMortonCode from './Morton';


/**
 * @extends {AABB3}
 * @constructor
 */
function Node() {
    /**
     *
     * @type {BinaryNode|null}
     */
    this.parentNode = null;
    this._mortonCode = void 0;
}

Node.prototype = Object.create(AABB3.prototype);

/**
 *
 * @returns {number}
 */
Node.prototype.computeDepth = function () {
    let d = 0;
    let node = this.parentNode;
    while (node !== null) {
        node = node.parentNode;
    }
    return d;
};

/**
 *
 * @returns {Node}
 */
Node.prototype.computeRoot = function () {
    let p = this;

    while (p.parentNode !== null) {
        p = p.parentNode;
    }

    return p;
};

Node.prototype.getMortonCode = function () {
    if (this._mortonCode === void 0) {
        const hx = (this.x1 + this.x0) / 2;
        const hy = (this.y1 + this.y0) / 2;
        const hz = (this.z1 + this.z0) / 2;
        const mortonCode = computeMortonCode(hx, hy, hz);
        this._mortonCode = mortonCode;
        return mortonCode;
    } else {
        return this._mortonCode;
    }
};

/**
 * Expands current node and all ancestors until root to accommodate for given box, terminate if node is already
 * large enough
 * @param {AABB3} box
 */
Node.prototype.bubbleExpandToFit = function (box) {
    let node = this;
    while (node.expandToFit(box)) {
        node = node.parentNode;
        if (node === null) {
            break;
        }
    }
};

/**
 * @deprecated
 */
Node.prototype.remove = function () {
    console.error("This method is deprecated, use 'disconnect' instead.");
    this.disconnect();
};

/**
 * Detaches this node from its parent
 */
Node.prototype.disconnect = function () {
    const node = this.parentNode;

    if (node === null) {
        //no parent already
        console.warn(`Node has no parent, nothing to disconnect from`);
        return;
    }

    if (this === node.left) {
        node.left = null;
        this.parentNode = null;
    } else if (this === node.right) {
        node.right = null;
        this.parentNode = null;
    } else {
        throw new Error("impostor child");
    }
};

/**
 * traverses all siblings up to the root
 */
Node.prototype.traverseSiblingsUp = function () {
    throw new Error('Not Implemented');
};

function buildPathForNode(n) {

    const chain = [];

    let node = n;
    while (node !== null) {

        const parentNode = node.parentNode;

        if (parentNode === null) {
            break;
        }

        if (parentNode.left === node) {
            chain.unshift('left');
        } else {
            chain.unshift('right');
        }

        node = parentNode;
    }

    return chain;
}

/**
 *
 * @param {string[]} path
 * @returns {string}
 */
function strinfityPath(path) {
    return '/' + path.join('/');
}


/**
 *
 * @param {Node} n
 * @param {int} len maximum number of path elements
 * @returns {string}
 */
function buildShortStringPath(n, len) {
    const longPath = buildPathForNode(n);

    if (longPath.length > len) {
        return '...' + strinfityPath(longPath.splice(-len));
    } else {
        return strinfityPath(longPath);
    }
}

export { Node, buildShortStringPath };
