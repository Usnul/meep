import { isLeaf } from "./LeafNode";

const StateFromParent = 0;
const StateFromSibling = 1;
const StateFromChild = 2;

function getLeft(node) {
    return node.left;
}

function parent(node) {
    return node.parentNode;
}

function sibling(node) {
    const parentNode = node.parentNode;
    return parentNode.right;
}


/**
 * Implementation based on code listing from paper:
 * "Efficient Stack-less BVH Traversal for Ray Tracing" 2011 Michal Hapala et.al
 * http://www.sci.utah.edu/~wald/Publications/2011/StackFree/sccg2011.pdf
 *
 * NOTE: Based on a few quick benchmarks this algorithm is slower than using stack
 * NOTE: this algorithm could be useful for incremental traversal as it retains state
 */
function StacklessTraverser() {
    this.state = 0;
    /**
     *
     * @type {BinaryNode|null}
     */
    this.current = null;
}

/**
 *
 * @param {BinaryNode} node
 */
StacklessTraverser.prototype.init = function (node) {
    this.root = node;
    this.state = StateFromParent;
    this.current = node;
};

/**
 *
 * Advanced traverser. Visitor will be invoked only on those advancements that produce a unique visit
 * @param {function(node:NodeDescription):boolean} visitor terminate branch and do no traverse descendants when visitor returns false
 * @returns {boolean}
 */
StacklessTraverser.prototype.advance = function (visitor) {
    let n;

    let state = this.state, current = this.current;

    switch (state) {
        case StateFromChild:
            //traversal up
            if (current === this.root) {
                //finished
                return false;
            }
            n = sibling(current);
            if (current === n || n == null) {
                //ascend
                current = parent(current);
                state = StateFromChild;
            } else {
                //move right
                current = n;
                state = StateFromSibling;
            }
            break;
        case StateFromSibling:
            if (visitor(current) === false || isLeaf(current)) {
                current = parent(current);
                state = StateFromChild;
            } else {
                n = getLeft(current);
                if (n === null) {
                    //ascent
                    current = parent(current);
                    state = StateFromChild;
                } else {
                    //descend
                    current = n;
                    state = StateFromParent;
                }
            }
            break;
        case StateFromParent:
            if (visitor(current) === false || isLeaf(current)) {
                n = sibling(current);
                if (n == null) {
                    //ascend
                    current = parent(current);
                    state = StateFromChild;
                } else {
                    //more right
                    current = n;
                    state = StateFromSibling;
                }
            } else {
                n = getLeft(current);
                if (n === null) {
                    if (current.parentNode === null) {
                        //already at root
                        n = current.right;
                        if (n === null) {
                            //put traverser into terminal state
                            current = this.root;
                            state = StateFromChild;
                        } else {
                            current = n;
                            state = StateFromSibling;
                        }
                    } else {

                        n = sibling(current);
                        if (n === null) {
                            //ascent
                            current = parent(current);
                            state = StateFromChild;

                        } else {
                            current = n;
                            state = StateFromSibling;
                        }
                    }
                } else {
                    //descend
                    current = n;
                    state = StateFromParent;
                }
            }
            break;
    }

    this.current = current;
    this.state = state;

    return true;
};

export {
    StacklessTraverser,
    StateFromParent,
    StateFromSibling,
    StateFromChild
};
