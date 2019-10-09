import { boxSurfaceArea2 as computeArea, scoreBoxesSAH as computeAreaFor2 } from "../AABB3Math";
import { BinaryNode, surfaceAreaHeuristic as sah } from "../BinaryNode";
import { isLeaf } from "../LeafNode";
import { StacklessTraverser } from "../StacklessTraverser";


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

/**
 *  * @param {BinaryNode} node
 * @param {Map.<NodeDescription,int>} leafCounts
 */
function getLeafCount(node, leafCounts) {
    if (isLeaf(node)) {
        return 1;
    }

    const storedValue = leafCounts.get(node);
    if (storedValue !== undefined) {
        return storedValue;
    } else {
        const left = node.left;
        const right = node.right;

        let result = 0;
        if (left !== null) {
            result += getLeafCount(left, leafCounts);
        }

        if (right !== null) {
            result += getLeafCount(right, leafCounts);
        }

        leafCounts.set(node, result);
        return result;
    }
}


/**
 * Based on paper "Fast, Effective BVH Updates for Animated Scenes" Kopta et. al. (url: http://www.cs.utah.edu/~thiago/papers/rotations.pdf)
 * @param {BinaryNode} node
 * @param {Map.<NodeDescription,int>} leafCounts
 * @returns {int} value from 0 to 6, 0 means no rotation has taken place
 */
function tryRotateSingleNode(node, leafCounts) {


    function setParent(node, parent) {
        node.parentNode = parent;
    }

    const left = node.left;
    const right = node.right;

    if (left === null || right === null) {
        return false;
    }

    let bestRotation = 0;


    const nodeArea = computeArea(node);
    const leftArea = computeArea(left);
    const rightArea = computeArea(right);

    const leftLeaves = getLeafCount(left, leafCounts);
    const rightLeaves = getLeafCount(right, leafCounts);


    let bestCost = sah(
        nodeArea,
        leftArea,
        rightArea,
        leftLeaves,
        rightLeaves
    );

    let candidateCost;

    let leftLeftArea,
        leftRightArea,
        rightLeftArea,
        rightRightArea;

    let leftLeft,
        leftRight,
        rightLeft,
        rightRight;

    let leftLeftLeaves,
        leftRightLeaves,
        rightLeftLeaves,
        rightRightLeaves;

    let considerLeft = !isLeaf(left);

    if (considerLeft) {
        leftLeft = left.left;
        leftRight = left.right;

        considerLeft = (leftLeft !== null && leftRight !== null);
        if (considerLeft) {

            leftLeftArea = computeArea(leftLeft);
            leftRightArea = computeArea(leftRight);

            leftLeftLeaves = getLeafCount(leftLeft, leafCounts);
            leftRightLeaves = getLeafCount(leftRight, leafCounts);

            // (1)    N                     N      //
            //       / \                   / \     //
            //      L   R     ----->      L   LL   //
            //     / \                   / \       //
            //   LL   LR                R   LR     //
            candidateCost = sah(nodeArea, computeAreaFor2(right, leftRight), leftLeftArea, rightLeaves + leftRightLeaves, leftLeftLeaves);

            if (candidateCost < bestCost) {
                bestRotation = 1;
                bestCost = candidateCost;
            }

            // (2)    N                     N      //
            //       / \                   / \     //
            //      L   R     ----->      L   LR   //
            //     / \                   / \       //
            //   LL   LR               LL   R      //
            candidateCost = sah(nodeArea, computeAreaFor2(leftLeft, right), leftRightArea, leftLeftLeaves + rightLeaves, leftRightLeaves);


            if (candidateCost < bestCost) {
                bestRotation = 2;
                bestCost = candidateCost;
            }
        }
    }
    if (!isLeaf(right)) {
        rightLeft = right.left;
        rightRight = right.right;
        if (rightLeft !== null && rightRight !== null) {

            rightLeftArea = computeArea(rightLeft);
            rightRightArea = computeArea(rightRight);

            rightLeftLeaves = countLeaves(rightLeft, leafCounts);
            rightRightLeaves = countLeaves(rightRight, leafCounts);

            // (3)    N                     N        //
            //       / \                   / \       //
            //      L   R     ----->     RL   R      //
            //         / \                   / \     //
            //       RL   RR                L   RR   //
            candidateCost = sah(nodeArea, rightLeftArea, computeAreaFor2(left, rightRight), rightLeftLeaves, leftLeaves + rightRightLeaves);

            if (candidateCost < bestCost) {
                bestRotation = 3;
                bestCost = candidateCost;
            }

            // (4)    N                     N       //
            //       / \                   / \      //
            //      L   R     ----->     RR   R     //
            //         / \                   / \    //
            //       RL   RR               RL   L   //
            candidateCost = sah(nodeArea, rightRightArea, computeAreaFor2(rightLeft, left), rightRightLeaves, rightLeftLeaves + leftLeaves);


            if (candidateCost < bestCost) {
                bestRotation = 4;
                bestCost = candidateCost;
            }

            if (considerLeft) {
                //both child nodes are not leaf

                // (5)       N                      N        //
                //         /   \                  /   \      //
                //        L     R     ----->     L     R     //
                //       / \   / \              / \   / \    //
                //      LL LR RL RR            LL RL LR RR   //
                candidateCost = sah(
                    nodeArea,
                    computeAreaFor2(leftLeft, rightLeft),
                    computeAreaFor2(leftRight, rightRight),
                    leftLeftLeaves + rightLeftLeaves,
                    leftRightLeaves + rightRightLeaves
                );


                if (candidateCost < bestCost) {
                    bestRotation = 5;
                    bestCost = candidateCost;
                }

                // (6)       N                      N        //
                //         /   \                  /   \      //
                //        L     R     ----->     L     R     //
                //       / \   / \              / \   / \    //
                //      LL LR RL RR            LL RR RL LR   //
                candidateCost = sah(
                    nodeArea,
                    computeAreaFor2(leftLeft, rightRight),
                    computeAreaFor2(rightLeft, leftRight),
                    leftLeftLeaves + rightRightLeaves,
                    rightLeftLeaves + leftRightLeaves
                );

                if (candidateCost < bestCost) {
                    bestRotation = 6;
                }
            }
        }
    }

    switch (bestRotation) {
        case 0:
            //no rotation
            break;
        case 1:
            node.right = leftLeft;
            setParent(leftLeft, node);
            left.left = right;
            setParent(right, left);

            left.refit();
            //update leaf count
            leafCounts.set(node.left, rightLeaves + leftRightLeaves);
            break;
        case 2:
            node.right = leftRight;
            setParent(leftRight, node);
            left.right = right;
            setParent(right, left);

            left.refit();
            //update leaf count
            leafCounts.set(node.left, leftLeftLeaves + rightLeaves);
            break;
        case 3:
            node.left = rightLeft;
            setParent(rightLeft, node);
            right.left = left;
            setParent(left, right);

            right.refit();
            //update leaf count
            leafCounts.set(node.right, leftLeaves + rightRightLeaves);
            break;
        case 4:
            node.left = rightRight;
            setParent(rightRight, node);
            right.right = left;
            setParent(left, right);

            right.refit();
            //update leaf count
            leafCounts.set(node.left, rightLeftLeaves + leftLeaves);
            break;
        case 5:
            left.right = rightLeft;
            setParent(rightLeft, left);
            right.left = leftRight;
            setParent(leftRight, right);

            left.refit();
            right.refit();

            //update leaf count
            leafCounts.set(node.left, leftLeftLeaves + rightLeftLeaves);
            leafCounts.set(node.right, leftRightLeaves + rightRightLeaves);
            break;
        case 6:
            left.right = rightRight;
            setParent(rightRight, left);
            right.right = leftRight;
            setParent(leftRight, right);

            left.refit();
            right.refit();
            //update leaf count
            leafCounts.set(node.left, leftLeftLeaves + rightRightLeaves);
            leafCounts.set(node.right, rightLeftLeaves + leftRightLeaves);
            break;
    }

    return bestRotation;
}

/**
 *
 * @param {BinaryNode} root
 * @param {int} maxIterations
 */
function optimize(root, maxIterations = 1000) {
    const traverser = new StacklessTraverser();

    traverser.init(root);

    let changeCounter = 0;

    const leafCounts = new Map();

    function visit(node) {

        if (isLeaf(node)) {
            //skip leaves
            return true;
        }

        const rotationType = tryRotateSingleNode(node, leafCounts);
        if (rotationType !== 0) {
            changeCounter++;
        }
    }

    let oldChangeCounter = changeCounter;

    let i;
    for (i = 0; i < maxIterations; i++) {
        const canAdvance = traverser.advance(visit);
        if (!canAdvance) {
            //check if we have made any rotations in this traversal pass
            if (oldChangeCounter === changeCounter) {
                //done, no changes
                break;
            } else {
                oldChangeCounter = changeCounter;
            }

            //re-initialize the traverser
            traverser.init(root);
        }

    }

    return changeCounter;
}

export {
    optimize,
    tryRotateSingleNode
};
