import AABB2 from "../../AABB2.js";
import { assert } from "../../../assert.js";
import { max2, min2 } from "../../../math/MathUtils.js";
import { QuadTreeDatum } from "./QuadTreeDatum.js";
import { aabb2_sqrDistanceToPoint } from "../AABB2Math.js";


const THRESHOLD_SPLIT = 16;
const THRESHOLD_MERGE = 8;

/**
 * @template D
 * @extends AABB2
 */
export class QuadTreeNode extends AABB2 {
    constructor(x0 = 0, y0 = 0, x1 = 0, y1 = 0) {
        super(x0, y0, x1, y1);

        /**
         *
         * @type {QuadTreeNode|null}
         */
        this.topLeft = null;
        /**
         *
         * @type {QuadTreeNode|null}
         */
        this.topRight = null;
        /**
         *
         * @type {QuadTreeNode|null}
         */
        this.bottomLeft = null;
        /**
         *
         * @type {QuadTreeNode|null}
         */
        this.bottomRight = null;

        /**
         *
         * @type {QuadTreeNode|null}
         */
        this.parentNode = null;

        this.treeDataCount = 0;


        /**
         *
         * @type {QuadTreeDatum<D>[]}
         */
        this.data = [];
    }

    balance() {
        const dataLength = this.data.length;
        if (dataLength > THRESHOLD_SPLIT && !this.isSplit()) {
            this.split();

            return 1;
        } else if (this.treeDataCount < THRESHOLD_MERGE && this.isSplit()) {
            this.merge();

            return 2;
        }

        return 0;
    }

    balanceBubbleUp() {
        if (this.balance() === 2) {
            let node = this.parentNode;

            while (node !== null) {
                if (node.balance() !== 2) {
                    break;
                }

                node = node.parentNode;
            }
        }
    }

    /**
     *
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     */
    resize(x0, y0, x1, y1) {
        if (this.x0 === x0 && this.y0 === y0 && this.x1 === x1 && this.y1 === y1) {
            //no change, do nothing
            return;
        }

        if (this.isSplit()) {
            this.merge();
        }

        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;

        this.balance();
    }

    /**
     * @template T
     * @param {T} data
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @returns {QuadTreeDatum}
     */
    add(data, x0, y0, x1, y1) {
        const datum = new QuadTreeDatum(x0, y0, x1, y1);

        datum.data = data;

        this.insertDatum(datum);

        return datum;
    }

    /**
     *
     * @param {QuadTreeDatum} datum
     */
    insertDatum(datum) {
        assert.ok(datum.isQuadTreeDatum, 'datum is not a QuadTreeDatum');

        //check bound invariants
        assert.ok(datum.x0 <= datum.x1, `Datum's x0(=${datum.x0}) > x1(=${datum.x1})`);
        assert.ok(datum.y0 <= datum.y1, `Datum's y0(=${datum.y0}) > y1(=${datum.y1})`);

        const x0 = this.x0;
        const y0 = this.y0;

        const x1 = this.x1;
        const y1 = this.y1;


        if (datum.x0 < x0 || datum.x1 > x1 || datum.y0 < y0 || datum.y1 > y1) {
            //search up, bounds of this node have been violated
            if (this.parentNode === null) {
                //resize this node
                this.resize(
                    min2(x0, datum.x0),
                    min2(y0, datum.y0),
                    max2(x1, datum.x1),
                    max2(y1, datum.y1)
                );
                this.addDatum(datum);
            } else {
                //insert into parent
                this.parentNode.insertDatum(datum);
            }
        } else {

            if (!this.isSplit()) {
                if (this.treeDataCount >= THRESHOLD_SPLIT) {
                    //node is too large and should be split
                    this.split();
                } else {
                    this.addDatum(datum);
                    //we're done
                    return;
                }
            }

            const xm = (x0 + x1) / 2;
            const ym = (y0 + y1) / 2;

            if (datum.y1 < ym) {
                //top
                if (datum.x1 < xm) {
                    //left
                    this.topLeft.insertDatum(datum);
                } else if (datum.x0 >= xm) {
                    //right
                    this.topRight.insertDatum(datum);
                } else {
                    this.addDatum(datum);
                }
            } else if (datum.y0 >= ym) {
                //top
                if (datum.x1 < xm) {
                    //left
                    this.bottomLeft.insertDatum(datum);
                } else if (datum.x0 >= xm) {
                    //right
                    this.bottomRight.insertDatum(datum);
                } else {
                    this.addDatum(datum);
                }
            } else {
                this.addDatum(datum);
            }
        }
    }

    /**
     * @private
     * @param {QuadTreeDatum} datum
     */
    addDatum(datum) {
        this.treeDataCount++;
        this.data.push(datum);

        datum.parentNode = this;

        let node = this.parentNode;

        while (node !== null) {
            node.treeDataCount++;

            node = node.parentNode;
        }
    }

    /**
     *
     * @return {boolean}
     */
    isSplit() {
        return this.topLeft !== null;
    }

    split() {
        assert.notOk(this.isSplit(), 'Node is already split');
        const x0 = this.x0;
        const y0 = this.y0;

        const x1 = this.x1;
        const y1 = this.y1;

        const xm = (x0 + x1) / 2;
        const ym = (y0 + y1) / 2;

        this.topLeft = new QuadTreeNode(x0, y0, xm, ym);
        this.topLeft.parentNode = this;

        this.topRight = new QuadTreeNode(xm, y0, x1, ym);
        this.topRight.parentNode = this;

        this.bottomLeft = new QuadTreeNode(x0, ym, xm, y1);
        this.bottomLeft.parentNode = this;

        this.bottomRight = new QuadTreeNode(xm, ym, x1, y1);
        this.bottomRight.parentNode = this;

        this.pushDataDown();

        this.topLeft.balance();
        this.topRight.balance();
        this.bottomLeft.balance();
        this.bottomRight.balance();
    }

    /**
     * Pull all data from descendants to this node
     */
    pullDataUp() {
        const root = this;
        const data = root.data;

        function visitNode(node) {
            const nodeData = node.data;
            const nodeDataSize = nodeData.length;

            for (let i = 0; i < nodeDataSize; i++) {
                const nodeDatum = nodeData[i];

                nodeDatum.parentNode = root;

                data.push(nodeDatum);
            }

            node.treeDataCount = 0;
            node.data = [];
        }

        this.topLeft.traversePreOrder(visitNode);
        this.topRight.traversePreOrder(visitNode);
        this.bottomLeft.traversePreOrder(visitNode);
        this.bottomRight.traversePreOrder(visitNode);
    }

    /**
     * Push data down to descendants as far as possible
     */
    pushDataDown() {
        assert.ok(this.isSplit(), 'Node is not split');

        const data = this.data;
        let dataLength = data.length;

        let i = 0;

        const x0 = this.x0;
        const y0 = this.y0;

        const x1 = this.x1;
        const y1 = this.y1;

        const xm = (x0 + x1) / 2;
        const ym = (y0 + y1) / 2;

        for (; i < dataLength; i++) {
            const datum = data[i];

            let child;
            if (datum.y1 < ym) {
                //top
                if (datum.x1 < xm) {
                    //left
                    child = this.topLeft;

                } else if (datum.x0 >= xm) {
                    //right
                    child = this.topRight;
                } else {
                    continue;
                }
            } else if (datum.y0 >= ym) {
                //top
                if (datum.x1 < xm) {
                    //left
                    child = this.bottomLeft;
                } else if (datum.x0 >= xm) {
                    //right
                    child = this.bottomRight;
                } else {
                    continue;
                }
            } else {
                continue;
            }

            child.data.push(datum);
            child.treeDataCount++;

            data.splice(i, 1);

            datum.parentNode = child;

            i--;
            dataLength--;
        }
    }

    merge() {
        assert.ok(this.isSplit(), 'Node is not split');

        this.pullDataUp();

        this.topLeft = null;
        this.topRight = null;
        this.bottomLeft = null;
        this.bottomRight = null;
    }

    clear() {
        this.data = [];
        this.treeDataCount = 0;

        this.topLeft = null;
        this.topRight = null;
        this.bottomLeft = null;
        this.bottomRight = null;
    }

    /**
     *
     * @param {function(QuadTreeNode):boolean} visitor
     * @param {*} [thisArg]
     */
    traversePreOrder(visitor, thisArg) {
        const continueFlag = visitor.call(thisArg, this);

        if (continueFlag === false) {
            return;
        }

        if (this.isSplit()) {
            this.topLeft.traversePreOrder(visitor, thisArg);
            this.topRight.traversePreOrder(visitor, thisArg);
            this.bottomLeft.traversePreOrder(visitor, thisArg);
            this.bottomRight.traversePreOrder(visitor, thisArg);
        }

    }

    /**
     * NOTE: touching is not counted as intersection
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {function(QuadTreeDatum<D>)} visitor
     * @param {*} [thisArg]
     */
    traverseRectangleIntersections(x0, y0, x1, y1, visitor, thisArg) {
        const data = this.data;
        const dataCount = data.length;

        for (let i = 0; i < dataCount; i++) {
            const datum = data[i];

            if (datum.x0 < x1 && datum.x1 > x0 && datum.y0 < y1 && datum.y1 > y0) {
                const continueTraversal = visitor.call(thisArg, datum);

                if (continueTraversal === false) {
                    return;
                }
            }
        }

        if (this.isSplit()) {

            const hx = (this.x0 + this.x1) / 2;
            const hy = (this.y0 + this.y1) / 2;

            if (hx >= x0) {
                if (hy >= y0) {
                    this.topLeft.traverseRectangleIntersections(x0, y0, x1, y1, visitor, thisArg);
                }
                if (hy <= y1) {
                    this.bottomLeft.traverseRectangleIntersections(x0, y0, x1, y1, visitor, thisArg);
                }
            }

            if (hx <= x1) {
                if (hy >= y0) {
                    this.topRight.traverseRectangleIntersections(x0, y0, x1, y1, visitor, thisArg);
                }
                if (hy <= y1) {
                    this.bottomRight.traverseRectangleIntersections(x0, y0, x1, y1, visitor, thisArg);
                }
            }

        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {function(QuadTreeDatum)} visitor
     * @param {*} [thisArg]
     */
    traverseCircleIntersections(x, y, radius, visitor, thisArg) {
        const radius2 = radius * radius;

        const data = this.data;
        const dataCount = data.length;

        for (let i = 0; i < dataCount; i++) {
            const datum = data[i];

            const d2 = aabb2_sqrDistanceToPoint(datum.x0, datum.y0, datum.x1, datum.y1, x, y);

            if (d2 < radius2) {
                const continueTraversal = visitor.call(thisArg, datum);

                if (continueTraversal === false) {
                    return;
                }
            }
        }

        if (this.isSplit()) {

            const x0 = this.x0;
            const x1 = this.x1;

            const y0 = this.y0;
            const y1 = this.y1;

            const hx = (x0 + x1) / 2;
            const hy = (y0 + y1) / 2;

            if (aabb2_sqrDistanceToPoint(x0, y0, hx, hy, x, y) < radius2) {
                this.topLeft.traverseCircleIntersections(x, y, radius, visitor, thisArg);
            }

            if (aabb2_sqrDistanceToPoint(x0, hy, hx, y1, x, y) < radius2) {
                this.bottomLeft.traverseCircleIntersections(x, y, radius, visitor, thisArg);
            }

            if (aabb2_sqrDistanceToPoint(hx, y0, x1, hy, x, y) < radius2) {
                this.topRight.traverseCircleIntersections(x, y, radius, visitor, thisArg);
            }

            if (aabb2_sqrDistanceToPoint(hx, hy, x1, y1, x, y) < radius2) {
                this.bottomRight.traverseCircleIntersections(x, y, radius, visitor, thisArg);
            }

        }
    }
}
