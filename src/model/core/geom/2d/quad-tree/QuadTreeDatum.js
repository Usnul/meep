import AABB2 from "../../AABB2.js";
import { assert } from "../../../assert.js";

/**
 * @template D
 * @extends {AABB2}
 */
export class QuadTreeDatum extends AABB2 {
    /**
     *
     * @param {Number} [x0=0]
     * @param {Number} [y0=0]
     * @param {Number} [x1=0]
     * @param {Number} [y1=0]
     */
    constructor(x0, y0, x1, y1) {
        super(x0, y0, x1, y1);

        /**
         *
         * @type {D|null}
         */
        this.data = null;

        /**
         *
         * @type {QuadTreeNode|null}
         */
        this.parentNode = null;
    }

    disconnect() {
        const parentNode = this.parentNode;

        if (parentNode === null) {
            //not connected
            return;
        }

        const parentData = parentNode.data;

        const i = parentData.indexOf(this);

        assert.notEqual(i, -1, 'Datum is not present in parentNode.data');

        parentData.splice(i, 1);

        let node = parentNode;

        while (node !== null) {
            node.treeDataCount--;

            node = node.parentNode;
        }

        this.parentNode.balanceBubbleUp();

        this.parentNode = null;
    }

    /**
     *
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     */
    resize(x0, y0, x1, y1) {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;

        const parentNode = this.parentNode;

        if (parentNode === null) {
            //orphaned datum
            return;
        }


        let node = parentNode;

        if (
            this.x0 < node.x0
            || this.x1 >= node.x1
            || this.y0 < node.y0
            || this.y1 >= node.y1
        ) {
            //new size violates bounds of the containing node

            this.disconnect();

            node.insertDatum(this);
        }
    }

    /**
     *
     * @param {number} dX
     * @param {number} dY
     */
    move(dX, dY) {
        const x0 = this.x0 + dX;
        const y0 = this.y0 + dY;

        const x1 = this.x1 + dX;
        const y1 = this.y1 + dY;

        this.resize(x0, y0, x1, y1);
    }
}

QuadTreeDatum.prototype.isQuadTreeDatum = true;
