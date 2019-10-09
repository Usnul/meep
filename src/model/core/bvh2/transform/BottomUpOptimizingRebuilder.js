import { isLeaf } from "../LeafNode";
import { BinaryNode, surfaceAreaHeuristic } from "../BinaryNode";
import { boxSurfaceArea2, scoreBoxesSAH } from "../AABB3Math";

function BottomUpOptimizingRebuilder() {
    this.root = null;
    this.nodes = [];
    /**
     * @type {function(left:NodeDescription, right:NodeDescription):number} heuristic Cost function of pairing two nodes, lower value means better pairing
     */
    this.heuristic = scoreBoxesSAH;
}

/**
 *
 * @param {BinaryNode} root
 */
BottomUpOptimizingRebuilder.prototype.init = function (root) {
    this.root = root;
    const nodes = this.nodes = [];
    const binaryNodePool = this.binaryNodePool = [];

    //first extract all leaf nodes
    root.traversePreOrderUsingStack(function (node) {
        if (isLeaf(node)) {
            nodes.push(node);
        } else if (node !== root) {
            //collect intermediate nodes for reuse
            binaryNodePool.push(node);
        }
    });
};
/**
 * Factory to allow reuse of existing node, avoiding garbage collection
 * @returns {BinaryNode}
 */
BottomUpOptimizingRebuilder.prototype.makeBinaryNode = function () {
    if (this.binaryNodePool.length > 0) {
        return this.binaryNodePool.pop();
    } else {
        return new BinaryNode();
    }
};

/**
 *
 * @param {number} maxSteps
 * @returns {boolean} true when complete
 */
BottomUpOptimizingRebuilder.prototype.compute = function (maxSteps) {
    const self = this;
    /**
     *
     * @type {Array.<NodeDescription>}
     */
    const nodes = this.nodes;

    let nodeCount = nodes.length;

    const heuristic = this.heuristic;

    function findBestPair(startIndex, endIndex, callback) {
        let bestI = -1;
        let bestJ = -1;
        let bestCost = Number.POSITIVE_INFINITY;
        for (let i = startIndex; i < endIndex - 1; i++) {
            const first = nodes[i];
            for (let j = i + 1; j < endIndex; j++) {
                const second = nodes[j];

                const cost = heuristic(first, second);

                if (cost < bestCost) {
                    bestCost = cost;

                    bestI = i;
                    bestJ = j;
                }
            }
        }

        callback(bestI, bestJ);
    }

    let stepsRemaining = maxSteps;

    while (nodeCount > 2 && stepsRemaining-- >= maxSteps) {
        findBestPair(0, nodeCount, function (firstIndex, secondIndex) {
            const first = nodes[firstIndex];
            const second = nodes[secondIndex];

            const binaryNode = self.makeBinaryNode();
            binaryNode.setChildren(first, second);

            //transplant new node in place of the second removed node
            nodes[firstIndex] = binaryNode;
            nodes.splice(secondIndex, 1);
        });

        nodeCount--;
    }

    const root = this.root;

    if (nodeCount === 2) {
        root.setChildren(nodes[0], nodes[1]);
        return true;
    } else if (nodeCount === 1) {
        root.left = nodes[0];
        root.left.parentNode = this;
        root.refit();
        return true;
    } else if (nodeCount === 0) {
        //no nodes, we're done
        return true;
    } else {
        //not done yet
        return false;
    }
};

const leafCounts = new Map();

function leaves(node) {
    if (leafCounts.has(node)) {
        return leafCounts.get(node);
    } else {
        const count = countLeaves(node);
        leafCounts.set(node, count);
        return count;
    }
}

function sah(left, right) {
    const leftArea = boxSurfaceArea2(left);
    const rightArea = boxSurfaceArea2(right);

    const leftLeaves = leaves(left);
    const rightLeaves = leaves(right);

    const commonArea = scoreBoxesSAH(left, right);

    return surfaceAreaHeuristic(commonArea, leftArea, rightArea, leftLeaves, rightLeaves);
}


export { BottomUpOptimizingRebuilder };
