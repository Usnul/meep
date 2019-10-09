import AABB2 from "../../AABB2.js";

export class Node2 extends AABB2 {
    constructor(x0, y0, x1, y1) {
        super(x0, y0, x1, y1);

        /**
         *
         * @type {BinaryNode2|null}
         */
        this.parentNode = null;
    }

    /**
     * Expands current node and all ancestors until root to accommodate for given box, terminate if node is already
     * large enough
     * @param {AABB2} box
     */
    bubbleExpandToFit(box) {
        let node = this;
        while (node.expandToFit(box)) {
            node = node.parentNode;
            if (node === null) {
                break;
            }
        }
    };

    /**
     * Detaches this node from its parent
     */
    disconnect() {
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
}