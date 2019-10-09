import { Node2 } from "./Node2.js";
import { max2, min2 } from "../../../math/MathUtils.js";

function transplantNewCommonParent(node, child) {
    const bNode = new BinaryNode2();
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

export class BinaryNode2 extends Node2 {
    constructor(x0, y0, x1, y1) {
        super(x0, y0, x1, y1);


        /**
         *
         * @type {Node2|null}
         */
        this.left = null;
        /**
         *
         * @type {Node2|null}
         */
        this.right = null;
    }

    refit() {
        if (this.left !== null && this.right !== null) {
            this.refitFor2();
        } else if (this.left !== null) {
            this.copy(this.left);
        } else if (this.right !== null) {
            this.copy(this.right);
        }
    }

    bubbleRefit() {
        let n = this;
        while (n !== null) {
            n.refit();
            n = n.parentNode;
        }
    };

    refitFor2() {

        const a = this.left;
        const b = this.right;

        this.x0 = min2(a.x0, b.x0);
        this.y0 = min2(a.y0, b.y0);
        this.x1 = max2(a.x1, b.x1);
        this.y1 = max2(a.y1, b.y1);
    }

    /**
     *
     * @param {Node2} left
     * @param {Node2} right
     */
    setChildren(left, right) {
        this.left = left;
        this.right = right;

        this.refitFor2();

        left.parentNode = this;
        right.parentNode = this;
    }

    /**
     *
     * @param {AABB2} box
     */
    findParentFor(box) {
        const a = this.left;
        const b = this.right;

        if (a === null || b === null) {
            //unbalanced node, good candidate already
            return this;
        }

        let aCost = a.costForInclusion(box);
        let bCost = b.costForInclusion(box);

        if (aCost === bCost) {
            //change costs to be surface areas instead
            aCost = a.computeArea();
            bCost = b.computeArea();
        }

        if (aCost < bCost) {
            if (a.isBinaryNode) {
                return a.findParentFor(box);
            } else {
                return a;
            }
        } else if (b.isBinaryNode) {
            return b.findParentFor(box);
        } else {
            return b;
        }
    }

    /**
     *
     * @param {Node2} child
     */
    insertNode(child) {
        const node = this.findParentFor(child);

        let bNode;

        if (node.isBinaryNode) {
            if (node.left === null) {
                node.left = child;
                child.parentNode = node;
                node.bubbleExpandToFit(child);
            } else if (node.right === null) {
                node.right = child;
                child.parentNode = node;
                node.bubbleExpandToFit(child);
            } else {
                //take right child and insert another binary node there
                bNode = new BinaryNode2();
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
    }
}

BinaryNode2.prototype.isBinaryNode = true;