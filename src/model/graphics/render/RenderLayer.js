/**
 * Created by Alex on 11/10/2016.
 */


import { BinaryNode } from '../../core/bvh2/BinaryNode';
import { RenderPassType } from "./RenderPassType.js";

function passThrough(object) {
    return object;
}

function RenderLayer() {
    /**
     *
     * @type {BinaryNode}
     */
    this.bvh = new BinaryNode();
    this.bvh.setNegativelyInfiniteBounds();

    /**
     *
     * @type {boolean}
     */
    this.visible = true;

    /**
     *
     * @type {String|null}
     */
    this.name = null;

    /**
     * Layer is managed externally, visibility will not be updated in the rendering engine
     * @deprecated
     * @type {boolean}
     */
    this.managed = false;

    /**
     *
     * @type {function(LeafNode): Object3D}
     */
    this.extractRenderable = passThrough;

    /**
     *
     * @type {Object3D[]}
     */
    this.visibleSet = [];

    /**
     *
     * @type {RenderPassType|number}
     */
    this.renderPass = RenderPassType.Opaque;
}

/**
 * Compute near and far clipping planes for a camera given a frustum.
 * Note: near plane is frustum.planes[4], far plane is frustum.planes[5]
 * @param {Frustum} frustum
 * @param {number} near
 * @param {number} far
 * @param {function(near:number, far:number)} callback
 */
RenderLayer.prototype.computeNearFarClippingPlanes = function (frustum, near, far, callback) {
    this.bvh.computeFrustumClippingPlanes(frustum, near, far, callback);
};

/**
 *
 * @param {Frustum[]} frustums
 * @param {function} callback
 */
RenderLayer.prototype.computeVisibleSet = function (frustums, callback) {
    const guessedLeaves = this.visibleSet;

    const reader = this.extractRenderable;

    function visitVisibleNode(leaf) {
        const object = leaf.object;
        if (object !== null) {
            const renderable = reader(object);
            callback(renderable, leaf);
        }
    }

    const addedNodes = [];
    const removedNodeIndices = [];
    this.traverseVisibleLeafSetIncremental(frustums, guessedLeaves, function (addedNode) {
        visitVisibleNode(addedNode);
        addedNodes.push(addedNode);
    }, function (removedNode, index) {
        removedNodeIndices.push(index);
    });

    let i, l;
    for (i = 0; i < removedNodeIndices.length; i++) {
        const removedNodeIndex = removedNodeIndices[i];
        guessedLeaves.splice(removedNodeIndex, 1);
    }

    //notify about existing nodes
    for (i = 0, l = guessedLeaves.length; i < l; i++) {
        visitVisibleNode(guessedLeaves[i]);
    }

    Array.prototype.push.apply(guessedLeaves, addedNodes);
};

RenderLayer.prototype.traverseVisibleLeafSet = function (frustums, callback) {
    this.bvh.threeTraverseFrustumsIntersections(frustums, function (leaf) {
        const object = leaf.object;
        if (object !== null) {
            callback(leaf);
        }
    });
};

RenderLayer.prototype.traverseVisibleLeafSetIncremental = function (frustums, guessedLeaves, callbackAdded, callbackRemoved) {
    function testNode(node) {
        for (let i = 0; i < frustums.length; i++) {
            if (node.intersectFrustum(frustums[i])) {
                return true;
            }
        }
        return false;
    }

    const markedNodes = [];

    function incrementalVisitor(node) {
        const result = testNode(node);
        if (result && !(node instanceof BinaryNode) && guessedLeaves.indexOf(node) === -1) {
            callbackAdded(node);
        }
        return result;
    }

    function incrementalCheckNode(node) {
        if (node !== null) {
            if (node instanceof BinaryNode) {
                node.traversePreOrderUsingStack(incrementalVisitor);
            } else {
                incrementalVisitor(node);
            }
        }
    }

    /**
     *
     * @param {NodeDescription} node
     */
    function traverseSiblingsUp(node) {
        const parentNode = node.parentNode;
        if (parentNode !== null) {
            if (!parentNode.isModifierSet(BinaryNode.Modifier.Marked1)) {

                //mark parent
                parentNode.setModifier(BinaryNode.Modifier.Marked1, true);
                markedNodes.push(parentNode);
                if (parentNode.left === node) {
                    incrementalCheckNode(parentNode.right);
                } else {
                    incrementalCheckNode(parentNode.right);
                }

                traverseSiblingsUp(parentNode);
            }
        }
    }

    if (guessedLeaves.length === 0) {
        //nothing in the guess set, do complete traversal
        this.traverseVisibleLeafSet(frustums, callbackAdded);
    } else {
        let i, l;
        for (i = guessedLeaves.length - 1; i >= 0; i--) {
            const guessedLeaf = guessedLeaves[i];
            if (!testNode(guessedLeaf)) {
                callbackRemoved(guessedLeaf, i);
            } else {
                //node is still visible, lets check it's parent
                traverseSiblingsUp(guessedLeaf);
            }
        }
        //clear marks
        for (i = 0, l = markedNodes.length; i < l; i++) {
            markedNodes[i].setModifier(BinaryNode.Modifier.Marked1, false);
        }
    }
};


/**
 *
 * @param {Frustum[]} frustums
 * @param {function[]} filters
 * @param {function(Object3D, NodeDescription)} callback
 */
RenderLayer.prototype.buildVisibleSet = function (frustums, filters, callback) {
    const reader = this.extractRenderable;

    let numFilters = filters.length;

    let visibleCount = 0;

    /**
     *
     * @param {LeafNode} leaf
     */
    function visitVisibleNode(leaf) {
        for (let i = 0; i < numFilters; i++) {
            const filterFunction = filters[i];

            const visibilityFlag = filterFunction(leaf);

            if (!visibilityFlag) {
                //not visible, skip
                return;
            }
        }

        const object = leaf.object;
        if (object !== null) {
            visibleCount++;
            const renderable = reader(object);
            callback(renderable, leaf);
        }
    }

    if (typeof reader === "function") {

        const visitCount = this.bvh.threeTraverseFrustumsIntersections(frustums, visitVisibleNode);

        this.visitCount = visitCount;
        this.visibleCount = visibleCount;

    }

};


/**
 *
 * @param {Frustum[]} frustums
 * @param {function(Object3D, NodeDescription)} callback
 */
RenderLayer.prototype.traverseVisible = function (frustums, callback) {
    let reader = this.extractRenderable;

    let visibleCount = 0;
    if (typeof reader === "function") {
        const visitCount = this.bvh.threeTraverseFrustumsIntersections(frustums, function (leaf) {
            const object = leaf.object;
            if (object !== null) {
                visibleCount++;
                const renderable = reader(object);
                callback(renderable, leaf);
            }
        });
        this.visitCount = visitCount;
        this.visibleCount = visibleCount;
    }

};

export default RenderLayer;
