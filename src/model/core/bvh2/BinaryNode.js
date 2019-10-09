/**
 * Created by Alex on 17/11/2014.
 */


import { Node } from './Node';
import { deserializeLeafNode, isLeaf, LeafNode, serializeLeafNode } from './LeafNode';
import {
    deserializeAABB3,
    deserializeAABB3Quantized16Uint,
    serializeAABB3,
    serializeAABB3Quantized16Uint
} from "./AABB3";
import { boxSurfaceArea, boxSurfaceArea2, scoreBoxesSAH } from "./AABB3Math";
import { BottomUpOptimizingRebuilder } from "./transform/BottomUpOptimizingRebuilder.js";
import { assert } from "../assert.js";
import { computePointDistanceToPlane } from "../geom/Plane.js";
import { max2, min2 } from "../math/MathUtils.js";


/**
 * @callback BinaryNode~Visitor
 * @param {Node} node
 * @returns {boolean} flag, controls traversal of descendants. If false - no traversal is done over descendants
 */


/**
 *
 * @enum {int}
 */
const ModifierType = {
    Protected: 1,
    Marked1: 2,
    Marked2: 4,
    Marked3: 8
};

/**
 * Surface Area Heuristic
 * @param {number} saV Surface Area of the volume being split
 * @param {number} saVL Surface Area of Left Volume
 * @param {number} saVR Surface Area of Right Volume
 * @param {number|int} nL Number of leaf nodes in Left Volume
 * @param {number|int} nR Number of leaf nodes in Right Volume
 * @param {number} kT constant for the estimated cost of a traversal step
 * @param {number} kI constant for the estimated cost of a intersection
 * @returns {number}
 */
function surfaceAreaHeuristicFull(saV, saVL, saVR, nL, nR, kT, kI) {
    return kT + kI * (saVL * nL / saV + saVR * nR / saV);
}

/**
 * Surface Area Heuristic
 * @param {number} saV Surface Area of the volume being split
 * @param {number} saVL Surface Area of Left Volume
 * @param {number} saVR Surface Area of Right Volume
 * @param {number|int} nL Number of leaf nodes in Left Volume
 * @param {number|int} nR Number of leaf nodes in Right Volume
 * @returns {number}
 */
function surfaceAreaHeuristic(saV, saVL, saVR, nL, nR) {
    return surfaceAreaHeuristicFull(saV, saVL, saVR, nL, nR, 1, 1);
}

/**
 * @extends {Node}
 * @constructor
 */
const BinaryNode = function () {
    /**
     *
     * @type {null|BinaryNode|LeafNode}
     */
    this.parentNode = null;

    /**
     *
     * @type {null|BinaryNode|LeafNode}
     */
    this.left = null;
    /**
     *
     * @type {null|BinaryNode|LeafNode}
     */
    this.right = null;

    this.modifiers = 0;
};

BinaryNode.Modifier = ModifierType;

BinaryNode.prototype = Object.create(Node.prototype);

/**
 *
 * @type {boolean}
 */
BinaryNode.prototype.isBinaryNode = true;

/**
 *
 * @param {int} modifier
 * @param {boolean} flag
 */
BinaryNode.prototype.setModifier = function (modifier, flag) {
    if (flag) {
        this.modifiers |= modifier;
    } else {
        this.modifiers &= ~modifier;
    }
};

BinaryNode.prototype.isModifierSet = function (modifier) {
    return (this.modifiers & modifier) !== 0;
};

BinaryNode.prototype.isProtected = function () {
    return this.isModifierSet(ModifierType.Protected);
};


BinaryNode.prototype.reset = function () {
    this.left = null;
    this.right = null;
    this.setNegativelyInfiniteBounds();
};

/**
 *
 * @param {Node} left
 * @param {Node} right
 */
BinaryNode.prototype.setChildren = function (left, right) {
    this.left = left;
    this.right = right;

    this.refitFor2();

    left.parentNode = this;
    right.parentNode = this;
};

/**
 * Optimize the entire tree
 */
BinaryNode.prototype.optimize = function () {
    const rebuilder = new BottomUpOptimizingRebuilder();

    rebuilder.init(this);

    while (!rebuilder.compute(1000)) {
        //
    }
};


/**
 *
 * @param {AABB3} box
 * @returns {Node}
 */
BinaryNode.prototype.findParentFor = function (box) {
    const a = this.left;
    const b = this.right;

    if (a === null || b === null) {
        //TODO: make sure this doesn't lead to bad tree
        //unbalanced node, good candidate already
        return this;
    }

    const aIsBinary = a.isBinaryNode;
    const bIsBinary = b.isBinaryNode;

    // handle protected nodes
    if (aIsBinary && a.isProtected()) {
        if (bIsBinary) {
            if (b.isProtected()) {
                return this;
            } else {
                return b.findParentFor(box);
            }
        } else {
            return b;
        }
    } else if (bIsBinary && b.isProtected()) {
        if (aIsBinary) {
            return a.findParentFor(box);
        } else {
            return a;
        }
    }

    let aCost = a.costForInclusion(box);
    let bCost = b.costForInclusion(box);

    if (aCost === bCost) {
        //change costs to be surface areas instead
        aCost = a.computeSurfaceArea();
        bCost = b.computeSurfaceArea();
    }

    if (aCost < bCost) {
        if (aIsBinary) {
            return a.findParentFor(box);
        } else {
            return a;
        }
    } else if (aCost > bCost && bIsBinary) {
        return b.findParentFor(box);
    } else {
        return b;
    }
};

BinaryNode.prototype.traverse = function (visitor) {
    if (this.left !== null) {
        const cA = visitor(this.left);
        if (cA !== false) {
            this.left.traverse(visitor);
        }
    }
    if (this.right !== null) {
        const cB = visitor(this.right);
        if (cB !== false) {
            this.right.traverse(visitor);
        }
    }
};

/**
 * Bottom-up tree traversal, children first
 * @param visitor
 */
BinaryNode.prototype.traversePostOrder = function (visitor) {
    //left
    if (this.left instanceof BinaryNode) {
        this.left.traversePostOrder(visitor);
    } else if (this.left instanceof LeafNode) {
        visitor(this.left);
    }
    //right
    if (this.right instanceof BinaryNode) {
        this.right.traversePostOrder(visitor);
    } else if (this.right instanceof LeafNode) {
        visitor(this.right);
    }
    visitor(this);
};
BinaryNode.prototype.traversePreOrder = function (visitor) {
    const carryOn = visitor(this);
    if (carryOn !== false) {
        //left
        if (this.left instanceof BinaryNode) {
            this.left.traversePreOrder(visitor);
        } else if (this.left instanceof LeafNode) {
            visitor(this.left);
        }
        //right
        if (this.right instanceof BinaryNode) {
            this.right.traversePreOrder(visitor);
        } else if (this.right instanceof LeafNode) {
            visitor(this.right);
        }
    }
};

/**
 * Same as traversePreOrder but without recursion. This runs faster thanks to avoidance of function call overhead. Especially useful for deeper trees.
 * @param {BinaryNode~Visitor} visitor
 * @param thisArg
 */
BinaryNode.prototype.traversePreOrderUsingStack = (function (visitor, thisArg) {


    let stackPointer = 0;
    const stack = [];

    function cleanup(position) {
        stack.length = position;
        stackPointer = position;
    }

    /**
     * @param {BinaryNode~Visitor} visitor
     * @param {*} [thisArg]
     * @returns {number}
     */
    function traversePreOrderUsingStack(visitor, thisArg) {
        let visitCount = 0;

        const stackOffset = stackPointer;

        stack[stackPointer++] = this;
        let n;
        while (stackPointer-- > stackOffset) {

            visitCount++;

            n = stack[stackPointer];

            const traverseDeeper = visitor.call(thisArg, n);

            if (traverseDeeper !== false && n.isBinaryNode) {
                if (n.right !== null) {
                    stack[stackPointer++] = n.right;
                }
                if (n.left !== null) {
                    stack[stackPointer++] = n.left;
                }
            }
        }

        cleanup(stackOffset);

        return visitCount;
    }

    return traversePreOrderUsingStack;
})();

/**
 * Traverse leaf nodes in a fast manner
 * @param {function(node:LeafNode)} visitor
 * @param {*} [thisArg]
 */
BinaryNode.prototype.traverseLeavesPreOrderUsingStack = (function (visitor, thisArg) {


    let stackPointer = 0;
    const stack = [];

    function cleanup(position) {
        stack.length = position;
        stackPointer = position;
    }

    /**
     * @param {function(node:LeafNode)} visitor
     * @param {*} [thisArg]
     * @returns {number}
     */
    function traverseLeavesPreOrderUsingStack(visitor, thisArg) {
        let visitCount = 0;

        const stackOffset = stackPointer;

        stack[stackPointer++] = this;

        let n;

        while (stackPointer-- > stackOffset) {

            visitCount++;

            n = stack[stackPointer];

            if (n.isLeafNode) {
                visitor.call(thisArg, n);
            } else {
                //a binary node
                if (n.right !== null) {
                    stack[stackPointer++] = n.right;
                }
                if (n.left !== null) {
                    stack[stackPointer++] = n.left;
                }
            }
        }

        cleanup(stackOffset);

        return visitCount;
    }

    return traverseLeavesPreOrderUsingStack;
})();

BinaryNode.prototype.refitFor2 = function () {
    const a = this.left;
    const b = this.right;

    this.x0 = min2(a.x0, b.x0);
    this.y0 = min2(a.y0, b.y0);
    this.z0 = min2(a.z0, b.z0);
    this.x1 = max2(a.x1, b.x1);
    this.y1 = max2(a.y1, b.y1);
    this.z1 = max2(a.z1, b.z1);
};

BinaryNode.prototype.bubbleRefit = function () {
    let n = this;
    while (n !== null) {
        n.refit();
        n = n.parentNode;
    }
};
BinaryNode.prototype.refit = function () {
    if (this.left !== null && this.right !== null) {
        this.refitFor2();
    } else if (this.left !== null) {
        this.copy(this.left);
    } else if (this.right !== null) {
        this.copy(this.right);
    }
};

function sortMortonCodes(n0, n1) {
    return n0._mortonCode - n1._mortonCode;
}

BinaryNode.prototype.tryOptimizeNode = function () {
    const self = this;
    const left = this.left;

    const right = this.right;

    if (right !== null && left !== null) {
        const rightLeft = right.left;
        if (rightLeft !== null && rightLeft !== undefined) {
            //consider left rotation
            //compute total surface area right now
            const rightSAH = boxSurfaceArea(right.x0, right.y0, right.z0, right.x1, right.y1, right.z1);
            const rotationLeftSAH = scoreBoxesSAH(left, rightLeft);
            if (rotationLeftSAH < rightSAH) {
                //good rotation
                this.rotateLeft();
                //
                return true;
            }
        }
    }
};

/**
 *
 * @param {number} n
 * @returns {number} number of changes performed on the tree
 */
BinaryNode.prototype.tryRandomOptimizeMany = function (n) {
    let result = 0;
    for (let i = 0; i < n; i++) {
        const count = this.tryOptimize();
        if (count > 0) {
            result += count;
        } else if (count === 0) {
            //no optimizations made, stop here
            break;
        }
    }
    return result;
};

BinaryNode.prototype.sumSurfaceArea = function () {
    let result = 0;
    this.traversePreOrderUsingStack(function (node) {
        const nodeArea = node.computeSurfaceArea();
        result += nodeArea;
    });

    return result;
};

BinaryNode.prototype.countDescendants = function () {
    let result = 0;
    this.traversePreOrderUsingStack(function (node) {
        result++;
    });
    return result;
};


/**
 *
 * @param node
 */
function countLeaves(node) {
    if (isLeaf(node)) {
        return 1;
    }

    let result = 0;

    node.traversePreOrderUsingStack(function (node) {
        if (isLeaf(node)) {
            result++;
        }
    });

    return result;
}


BinaryNode.prototype.countLeaves = function () {
    let result = 0;
    this.traversePreOrderUsingStack(function (node) {
        if (isLeaf(node)) {
            result++;
        }
    });

    return result;
};

BinaryNode.prototype.computeSAH = function () {
    let leftLeaves, rightLeaves, leftArea, rightArea;
    if (this.left === null) {
        leftArea = 0;
        leftLeaves = 0;
    } else {
        leftArea = boxSurfaceArea2(this.left);
        leftLeaves = countLeaves(this.left);
    }

    if (this.right === null) {
        rightArea = 0;
        rightLeaves = 0;
    } else {
        rightArea = boxSurfaceArea2(this.right);
        rightLeaves = countLeaves(this.right);
    }

    const thisArea = boxSurfaceArea2(this);

    return surfaceAreaHeuristic(thisArea, leftArea, rightArea, leftLeaves, rightLeaves);
};


/**
 * As a result of rotation, this node 'becomes' the right node, and left node get's replaced by the right node with necessary adjustments
 */
BinaryNode.prototype.rotateLeft = function () {
    const r = this.right;

    const l = this.left;

    const rL = r.left;
    const rR = r.right;

    this.left = r;
    this.right = rR;

    if (rR !== null) {
        rR.parentNode = this;
    }

    r.left = l;
    if (l !== null) {
        l.parentNode = r;
    }

    r.right = rL;


    r.bubbleRefit();
};

BinaryNode.prototype.rotateRight = function () {
    const r = this.right;

    const l = this.left;

    const lL = l.left;
    const lR = l.right;

    if (lL !== null) {
        lL.parentNode = this;
    }

    l.right = r;
    if (r !== null) {
        r.parentNode = l;
    }

    l.left = lR;

    l.bubbleRefit();
};

/**
 *
 * @param {function(index:int):LeafNode} leafFactory
 * @param {int} numNodes
 */
BinaryNode.prototype.insertManyBoxes2 = function (leafFactory, numNodes) {
    let i, n;
    //create leaf nodes
    const nodes = new Array(numNodes);
    for (i = 0; i < numNodes; i++) {
        //leaf needs to be set up inside the callback
        n = leafFactory(i);
        n._mortonCode = n.computeMortonCode();
        nodes[i] = n;
    }
    nodes.sort(sortMortonCodes);
    while (numNodes > 2) {
        //sort leafs

        //pair
        for (i = 0; i < numNodes - 1; i += 2) {
            const a = nodes[i];
            const b = nodes[i + 1];
            n = new BinaryNode();
            n.setChildren(a, b);
            nodes[i >> 1] = n;
        }
        const numNodesMod2 = numNodes % 2;

        if (numNodesMod2 !== 0) {
            //shift remaining node up so it will be considered later
            nodes[i >> 1] = nodes[i];
        }
        numNodes = (numNodes >> 1) + numNodesMod2;
        //nodes.length = numNodes;
    }
    //finally insert these boxes from this node
    nodes.length = numNodes;
    for (i = 0; i < numNodes; i++) {
        n = nodes[i];
        this.insertNode(n);
    }
};

BinaryNode.prototype.traverseSegmentLeafIntersections = function (startX, startY, startZ, endX, endY, endZ, visitor) {
    this.traversePreOrder(function (node) {
        let b = node.intersectSegment(startX, startY, startZ, endX, endY, endZ);
        if (!b) {
            return false;
        }
        if (node instanceof LeafNode) {
            visitor(node);
            return false;
        } else {
            return true;
        }
    });
};

/**
 * @private
 * Used in intersection traversal methods. Should be invoked via Function.apply and Function.call only and not be called directly
 * @param {LeafNode} node
 */
function fastVisitLeafNodeIntersection(node) {
    this(node, true);
}

/**
 *
 * @param {Frustum[]} frustums Collection of THREE.js Frustums
 * @param {function(node:LeafNode, boolean)} visitor
 * @returns {number}
 */
BinaryNode.prototype.threeTraverseFrustumsIntersections = function (frustums, visitor) {
    const numFrustums = frustums.length;

    /**
     *
     * @param {LeafNode|BinaryNode} node
     * @returns {boolean}
     */
    function visitNode(node) {
        let b = false;
        let i = 0;

        for (; i < numFrustums; i++) {

            const degree = node.intersectFrustumDegree(frustums[i]);

            if (degree === 2) {
                //completely inside frustum

                if (node.isLeafNode) {
                    visitor(node, true);
                } else {
                    node.traverseLeavesPreOrderUsingStack(fastVisitLeafNodeIntersection, visitor);
                }

                //prevent further traversal
                return false;

            } else if (degree === 1) {

                //partially inside frustum
                b = true;

            }
        }

        if (!b) {
            return false;
        }

        if (node.isLeafNode) {
            visitor(node, false);
        }

        return true;
    }

    return this.traversePreOrderUsingStack(visitNode);
};

/**
 * As recursion goes on, we remove frustums and planes from checks reducing total number of checks necessary
 * @param {Array.<THREE.Frustum>} frustums
 * @param {function} visitor
 * @returns {number}
 */
BinaryNode.prototype.threeTraverseFrustumsIntersections2 = function (frustums, visitor) {
    const numFrustums = frustums.length;

    function visitLeaves(node) {
        if (node instanceof LeafNode) {
            visitor(node);
            return false;
        } else {
            return true;
        }
    }

    function fastTraverseLeaves(node) {
        if (node instanceof LeafNode) {
            visitor(node);
        } else {
            node.traversePreOrderUsingStack(visitLeaves);
        }
    }


    function isFlagSet(mask, index) {
        return mask & (1 << index) !== 0;
    }

    function clearFlag(mask, index) {
        return mask & ~(1 << index);
    }

    function removeElementFromClone(original, clone, mask, originalIndex) {
        if (clone === original) {
            //clone planes
            clone = clone.slice();
        }
        //remove the plane from new set
        clone.splice(originalIndex, 1);
        return clone;
    }

    function processVolumesIntersections(node, planeSets, planeSetCount) {
        let newPlaneSets = planeSets;
        for (let iPS = planeSetCount - 1; iPS >= 0; iPS--) {

            const planes = planeSets[iPS];
            let newPlanes = planes;
            const numPlanes = planes.length;

            //check plane set
            for (let i = numPlanes - 1; i >= 0; i--) {
                const plane = planes[i];
                const planeSide = node.computePlaneSide(plane);
                if (planeSide < 0) {
                    //completely inside
                    newPlanes = removeElementFromClone(planes, newPlanes, i);
                } else if (planeSide > 0) {
                    //on the wrong side of the plane
                    //drop plane set
                    newPlaneSets = removeElementFromClone(planeSets, newPlaneSets, iPS);

                    break;
                }
            }

            //update plane sets as needed
            if (newPlanes !== planes && newPlaneSets.indexOf(planes) !== -1) {
                //replace
                if (newPlaneSets === planeSets) {
                    //clone if needed
                    newPlaneSets = newPlaneSets.slice();
                }
                newPlaneSets[iPS] = newPlanes;
            }
        }

        return newPlaneSets;
    }

    function traverseVolumeIntersections(node, planeSets, numPlaneSets) {
        function internalVisitor(node) {
            let newPlaneSet = processVolumesIntersections(node, planeSets, numPlaneSets);
            if (newPlaneSet !== planeSets) {
                let newPlaneSetCount = newPlaneSet.length;
                if (newPlaneSetCount !== 0) {
                    //some intersections

                    //check if all plane sets are trivial (contain no test planes)
                    let trivialPlaneSets = 0;
                    for (let i = 0; i < newPlaneSetCount; i++) {
                        if (newPlaneSet[i].length === 0) {
                            trivialPlaneSets++;
                        }
                    }

                    if (isLeaf(node)) {
                        visitor(node);
                    } else {
                        if (trivialPlaneSets === newPlaneSetCount) {
                            fastTraverseLeaves(node);
                        } else {
                            traverseVolumeIntersections(node, newPlaneSet, newPlaneSetCount);
                        }
                    }
                }
            } else {
                if (isLeaf(node)) {
                    visitor(node);
                } else {
                    return true;
                }
            }

            return false;
        }

        node.traversePreOrderUsingStack(internalVisitor);
    }

    function startTraversal(node) {
        let planeSets = [];
        for (let i = 0; i < numFrustums; i++) {
            const frustum = frustums[i];
            const planes = frustum.planes;
            planeSets.push(planes);
        }
        traverseVolumeIntersections(node, planeSets, numFrustums);
    }

    startTraversal(this);
};

BinaryNode.prototype.threeTraverseFrustumsIntersections__Old = function (frustums, visitor) {
    const numFrustums = frustums.length;
    return this.traversePreOrderUsingStack(function (node) {

        let b = false;
        for (let i = 0; i < numFrustums; i++) {
            b = node.intersectFrustum(frustums[i]);
            if (b) {
                break;
            }
        }

        if (!b) {
            return false;
        }
        if (node instanceof LeafNode) {
            visitor(node);
            return false;
        } else {
            return true;
        }
    });
};


/**
 *
 * @param {number} startX
 * @param {number} startY
 * @param {number} startZ
 * @param {number} directionX
 * @param {number} directionY
 * @param {number} directionZ
 * @param {function(node:LeafNode)} visitor
 */
BinaryNode.prototype.traverseRayLeafIntersections = function (startX, startY, startZ, directionX, directionY, directionZ, visitor) {
    this.traversePreOrderUsingStack(function (node) {
        let b = node.intersectRay(startX, startY, startZ, directionX, directionY, directionZ);

        if (!b) {
            //no intersection, terminate this branch
            return false;
        }

        if (isLeaf(node)) {
            //leaf node, supply to visitor
            visitor(node);
            return false;
        } else {
            //intermediate node, continue traversal
            return true;
        }
    });
};

/**
 *
 * @param {{planes:Plane[]}} frustum
 * @param {number} near
 * @param {number} far
 * @param {function(nearDistance:number,farDistance:number)} callback
 */
BinaryNode.prototype.computeFrustumClippingPlanes = function (frustum, near, far, callback) {
    const planes = frustum.planes;

    const clipPlanes = [
        planes[0],
        planes[1],
        planes[2],
        planes[3],
        planes[4]
    ];

    const nearPlane = planes[4];
    const planeNormal = nearPlane.normal;
    const planeConstant = nearPlane.constant;

    function distanceToNearPlane(x, y, z) {
        return computePointDistanceToPlane(x, y, z, planeNormal.x, planeNormal.y, planeNormal.z, planeConstant);
    }

    function traverseCorner(x, y, z) {
        const d = distanceToNearPlane(x, y, z);
        if (d < near) {
            near = d;
        }
        if (d > far) {
            far = d;
        }
    }

    const numPlanes = clipPlanes.length;

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {boolean}
     */
    function isInteresting(x, y, z) {
        const d = distanceToNearPlane(x, y, z);

        //check if a corner is outside of near/far clipping planes
        return (d < near) || (d > far);
    }


    /**
     *
     * @param {BinaryNode} node
     * @returns {boolean}
     */
    function checkBinaryNode(node) {

        const _x0 = node.x0;
        const _y0 = node.y0;
        const _z0 = node.z0;
        const _x1 = node.x1;
        const _y1 = node.y1;
        const _z1 = node.z1;

        //if all corners lie between already set clipping planes - we don't need to check children
        return isInteresting(_x0, _y0, _z0)
            || isInteresting(_x0, _y0, _z1)
            || isInteresting(_x0, _y1, _z0)
            || isInteresting(_x0, _y1, _z1)
            || isInteresting(_x1, _y0, _z0)
            || isInteresting(_x1, _y0, _z1)
            || isInteresting(_x1, _y1, _z0)
            || isInteresting(_x1, _y1, _z1);
    }

    /**
     *
     * @param {Node|LeafNode|BinaryNode} node
     */
    function visitor(node) {
        //check planes first
        for (let i = 0; i < numPlanes; i++) {
            const clipPlane = clipPlanes[i];
            if (node.isBelowPlane(clipPlane)) {
                return false;
            }
        }

        if (node.isLeafNode) {
            node.traverseCorners(traverseCorner);
            return false;
        } else {
            //attempt to reject nodes earlier than when we read a leaf node
            return checkBinaryNode(node);
        }
    }

    this.traversePreOrderUsingStack(visitor);

    callback(near, far);
};

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @param {*} value
 * @returns {LeafNode}
 */
BinaryNode.prototype.insert = function (x0, y0, z0, x1, y1, z1, value) {
    const leaf = new LeafNode(value);
    leaf.setBounds(x0, y0, z0, x1, y1, z1);
    this.insertNode(leaf);
    return leaf;
};

function transplantNewCommonParent(node, child) {
    const bNode = new BinaryNode();
    //
    const parent = node.parentNode;
    if (node === parent.left) {
        parent.left = bNode;
    } else if (node === parent.right) {
        parent.right = bNode;
    } else {
        throw new Error("Not a child of specified parent node(impostor)");
    }
    bNode.setChildren(node, child);
    bNode.parentNode = parent;
    parent.bubbleExpandToFit(bNode);
    return bNode;
}

/**
 *
 * @param {Node} child
 */
BinaryNode.prototype.insertNode = function (child) {
    assert.notEqual(child, null, 'child node is null');
    assert.notEqual(child, undefined, 'child node is undefined');
    assert.ok(child instanceof Node, undefined, 'child node is not an instance of Node');
    assert.equal(child.parentNode, null, 'parentNode must be null, otherwise Node still belongs to another tree');

    const node = this.findParentFor(child);

    let bNode;

    if (node instanceof BinaryNode) {
        if ((node.isProtected() && node !== this)) {
            transplantNewCommonParent(node, child);
        } else if (node.left === null) {
            node.left = child;
            child.parentNode = node;
            node.bubbleExpandToFit(child);
        } else if (node.right === null) {
            node.right = child;
            child.parentNode = node;
            node.bubbleExpandToFit(child);
        } else {
            //take right child and insert another binary node there
            bNode = new BinaryNode();
            bNode.setChildren(node.right, child);
            //
            node.right = bNode;
            bNode.parentNode = node;
            node.bubbleExpandToFit(bNode);
        }
    } else {
        //need to do transplanting and introduce a new common parent
        transplantNewCommonParent(node, child);
    }
};

/**
 *
 * @returns {BinaryNode}
 */
BinaryNode.prototype.clone = function (deep) {
    const clone = new BinaryNode();

    clone.x0 = this.x0;
    clone.y0 = this.y0;
    clone.z0 = this.z0;
    clone.x1 = this.x1;
    clone.y1 = this.y1;
    clone.z1 = this.z1;

    clone.parentNode = this.parentNode;

    if (deep === true) {
        if (this.left !== null) {
            clone.left = this.left.clone(true);
            clone.left.parentNode = clone;
        }
        if (this.right !== null) {
            clone.right = this.right.clone(true);
            clone.right.parentNode = clone;
        }
    } else {
        clone.left = this.left;
        clone.right = this.right;
    }

    clone.modifiers = this.modifiers;

    return clone;
};

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {function(buffer:BinaryBuffer):*} leafValueDeserializer
 */
BinaryNode.prototype.fromBinaryBuffer = function (buffer, leafValueDeserializer) {
    //read bounds
    deserializeAABB3(buffer, this);

    /**
     *
     * @param {BinaryNode} parent
     * @returns {BinaryNode}
     */
    function readBinaryNode(parent) {

        const node = new BinaryNode();

        node.parentNode = parent;

        //read bounds
        deserializeAABB3Quantized16Uint(buffer, node, parent.x0, parent.y0, parent.z0, parent.x1, parent.y1, parent.z1);

        //read marker
        const marker = buffer.readUint8();

        if ((marker & 3) === 3) {
            node.left = readBinaryNode(node);
        } else if ((marker & 2) === 2) {
            node.left = readLeafNode(node);
        } else {
            node.left = null;
        }

        if ((marker & 12) === 12) {
            node.right = readBinaryNode(node);
        } else if ((marker & 8) === 8) {
            node.right = readLeafNode(node);
        } else {
            node.right = null;
        }


        return node;
    }

    /**
     *
     * @param {BinaryNode} parent
     * @returns {LeafNode}
     */
    function readLeafNode(parent) {
        const node = new LeafNode();

        node.parentNode = parent;

        //read bounds
        deserializeAABB3Quantized16Uint(buffer, node, parent.x0, parent.y0, parent.z0, parent.x1, parent.y1, parent.z1);

        node.object = leafValueDeserializer(buffer);

        return node;
    }

    //read marker
    const marker = buffer.readUint8();

    if ((marker & 3) === 3) {
        this.left = readBinaryNode(this);
    } else if ((marker & 2) === 2) {
        this.left = readLeafNode(this);
    } else {
        this.left = null;
    }

    if ((marker & 12) === 12) {
        this.right = readBinaryNode(this);
    } else if ((marker & 8) === 8) {
        this.right = readLeafNode(this);
    } else {
        this.right = null;
    }
};

/**
 * Writing is lossy, all descendants have their bounds quantized to uin16
 * @param {BinaryBuffer} buffer
 * @param {function(buffer:BinaryBuffer, value:*):void} leafValueSerializer
 */
BinaryNode.prototype.toBinaryBuffer = function (buffer, leafValueSerializer) {
    const root = this;

    //write initial size
    serializeAABB3(buffer, root);

    /**
     *
     * @param {BinaryNode} node
     */
    function buildNodeMarker(node) {

        let result = 0;

        if (node.right !== null) {
            if (node.right.isLeafNode) {
                result |= 8;
            } else {
                result |= 12;
            }
        }

        if (node.left !== null) {
            if (node.left.isLeafNode) {
                result |= 2;
            } else {
                result |= 3;
            }
        }

        return result;
    }

    /**
     *
     * @param {BinaryNode} node
     * @param {BinaryNode} parent
     */
    function writeBinaryNode(node, parent) {
        serializeAABB3Quantized16Uint(buffer, node, parent.x0, parent.y0, parent.z0, parent.x1, parent.y1, parent.z1);

        const marker = buildNodeMarker(node);

        buffer.writeUint8(marker);

        if ((marker & 3) === 3) {
            writeBinaryNode(node.left, node);
        } else if ((marker & 2) === 2) {
            writeLeafNode(node.left, node);
        }

        if ((marker & 12) === 12) {
            writeBinaryNode(node.right, node);
        } else if ((marker & 8) === 8) {
            writeLeafNode(node.right, node);
        }
    }

    /**
     *
     * @param {LeafNode} node
     * @param {BinaryNode} parent
     */
    function writeLeafNode(node, parent) {
        serializeAABB3Quantized16Uint(buffer, node, parent.x0, parent.y0, parent.z0, parent.x1, parent.y1, parent.z1);
        leafValueSerializer(buffer, node.object);
    }

    const marker = buildNodeMarker(root);

    buffer.writeUint8(marker);

    if ((marker & 3) === 3) {
        writeBinaryNode(root.left, root);
    } else if ((marker & 2) === 2) {
        writeLeafNode(root.left, root);
    }

    if ((marker & 12) === 12) {
        writeBinaryNode(root.right, root);
    } else if ((marker & 8) === 8) {
        writeLeafNode(root.right, root);
    }
};

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {BinaryNode} node
 * @param {function(buffer:BinaryBuffer, value:*):void} leafValueSerializer
 */
function serializeBinaryNode(buffer, node, leafValueSerializer) {
    serializeAABB3(buffer, node);

    function serializeChild(child) {
        if (child === null) {
            buffer.writeUint8(0);
        } else {
            if (isLeaf(child)) {
                buffer.writeUint8(1);
                serializeLeafNode(buffer, child, leafValueSerializer);
            } else {
                buffer.writeUint8(2);
                serializeBinaryNode(buffer, child, leafValueSerializer);
            }
        }
    }

    serializeChild(node.left);
    serializeChild(node.right);
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {BinaryNode} node
 * @param {function(buffer:BinaryBuffer):void} leafValueDeserializer
 */
function deserializeBinaryNode(buffer, node, leafValueDeserializer) {
    deserializeAABB3(buffer, node);

    function deserializeChild() {
        const nodeType = buffer.readUint8();
        if (nodeType === 0) {
            return null;
        } else if (nodeType === 1) {
            const leafNode = new LeafNode();
            deserializeLeafNode(buffer, leafNode, leafValueDeserializer);
            leafNode.parentNode = node;
            return leafNode;
        } else if (nodeType === 2) {
            const binaryNode = new BinaryNode();
            deserializeBinaryNode(buffer, binaryNode, leafValueDeserializer);
            binaryNode.parentNode = node;
            return binaryNode;
        }
    }

    const leftNode = deserializeChild();
    const rightNode = deserializeChild();

    node.left = leftNode;
    node.right = rightNode;
}


export {
    BinaryNode,
    serializeBinaryNode,
    deserializeBinaryNode,
    surfaceAreaHeuristic
};
