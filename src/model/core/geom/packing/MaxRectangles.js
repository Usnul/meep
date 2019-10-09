import AABB2 from "../AABB2";
import BinaryHeap from "../../../navigation/grid/FastBinaryHeap";
import Vector2 from "../Vector2.js";
import { QuadTreeNode } from "../2d/quad-tree/QuadTreeNode.js";
import { QuadTreeDatum } from "../2d/quad-tree/QuadTreeDatum.js";
import { max2, min2 } from "../../math/MathUtils.js";
import { assert } from "../../assert.js";

/**
 * Remove all rectangles that are fully contained within others
 * @param {AABB2[]} boxes
 */
function removeRedundantBoxesArray(boxes) {
    let numBoxes = boxes.length;

    loop_a: for (let i = 0; i < numBoxes; i++) {
        const a = boxes[i];

        const ax0 = a.x0;
        const ay0 = a.y0;
        const ax1 = a.x1;
        const ay1 = a.y1;

        for (let j = i + 1; j < numBoxes; j++) {
            const b = boxes[j];

            const bx0 = b.x0;
            const by0 = b.y0;
            const bx1 = b.x1;
            const by1 = b.y1;

            //question is now whether it is containment
            if (ax0 >= bx0 && ax1 <= bx1 && ay0 >= by0 && ay1 <= by1) {
                //b contains a
                boxes.splice(i, 1);
                i--;
                numBoxes--;
                continue loop_a;
            } else if (bx0 >= ax0 && bx1 <= ax1 && by0 >= ay0 && by1 <= ay1) {
                //a contains b
                boxes.splice(j, 1);
                j--;
                numBoxes--;
            }
        }
    }
}


/**
 * Remove all rectangles that are fully contained within others
 * @param {QuadTreeNode} boxes
 */
function removeRedundantBoxes(boxes) {
    const removals = [];


    let datum;

    /**
     *
     * @param {QuadTreeDatum} intersection
     */
    function visitDatumIntersection(intersection) {
        if (datum === intersection) {
            //skip self
            return;
        }

        const ax0 = intersection.x0;
        const ay0 = intersection.y0;
        const ax1 = intersection.x1;
        const ay1 = intersection.y1;

        const bx0 = datum.x0;
        const by0 = datum.y0;
        const bx1 = datum.x1;
        const by1 = datum.y1;

        //question is now whether it is containment
        if (ax0 >= bx0 && ax1 <= bx1 && ay0 >= by0 && ay1 <= by1) {
            //b contains a
            removals.push(intersection);
        } else if (bx0 >= ax0 && bx1 <= ax1 && by0 >= ay0 && by1 <= ay1) {
            //a contains b
            removals.push(datum);

            //scheduled removal of the datum, prevent further traversal
            return false;
        }
    }

    /**
     *
     * @param {QuadTreeNode} node
     */
    function visitTreeNode(node) {
        const data = node.data;
        const dataCount = data.length;

        for (let i = 0; i < dataCount; i++) {
            /**
             *
             * @type {QuadTreeDatum}
             */
            datum = data[i];

            node.traverseRectangleIntersections(datum.x0, datum.y0, datum.x1, datum.y1, visitDatumIntersection);
        }
    }

    boxes.traversePreOrder(visitTreeNode);

    for (const removal of removals) {
        removal.disconnect();
    }
}


/**
 *
 * @param {number} containerWidth
 * @param {number} containerHeight
 * @param {number} childWidth
 * @param {number} childHeight
 * @returns {number}
 */
function costByRemainingArea(containerWidth, containerHeight, childWidth, childHeight) {
    const dW = containerWidth - childWidth;
    const dH = containerHeight - childHeight;

    return dW * containerHeight + dH * childWidth;
}

/**
 *
 * @param {number} containerWidth
 * @param {number} containerHeight
 * @param {number} childWidth
 * @param {number} childHeight
 * @returns {number}
 */
function costByBestShortSide(containerWidth, containerHeight, childWidth, childHeight) {
    return Math.min(containerWidth - childWidth, containerHeight - childHeight);
}

/**
 *
 * @param {number} width
 * @param {number} height
 * @param {QuadTreeNode} boxes
 * @param {function(containerWidth:number, containerHeight:number, childWidth:number, childHeight:number):number} costFunction
 * @returns {QuadTreeDatum} suitable container box
 */
function findBestContainer(width, height, boxes, costFunction) {
    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;

    boxes.traversePreOrder(node => {

        if (node.getWidth() < width) {
            //too small, don't traverse deeper
            return false;
        }

        if (node.getHeight() < height) {
            //too small, don't traverse deeper
            return false;
        }

        const data = node.data;
        const numBoxes = data.length;

        for (let i = 0; i < numBoxes; i++) {
            const box = data[i];

            const bW = box.getWidth();

            if (bW < width) {
                //too small
                continue;
            }

            const bH = box.getHeight();

            if (bH < height) {
                //too small
                continue;
            }

            const cost = costFunction(bW, bH, width, height);
            if (cost < bestScore) {
                bestScore = cost;
                best = box;
            }
        }
    });

    return best;
}

/**
 * Cut out a region from given set of boxes
 * @param {AABB2} scissor area to be cut out
 * @param {QuadTreeNode} boxes
 */
function cutArea(scissor, boxes) {

    /**
     *
     * @type {QuadTreeDatum[]}
     */
    const additions = [];

    /**
     *
     * @type {QuadTreeDatum[]}
     */
    const removals = [];

    /**
     *
     * @param {QuadTreeDatum} box
     */
    function visitOverlap(box) {
        removals.push(box);


        //compute overlap region
        const x0 = max2(scissor.x0, box.x0);
        const x1 = min2(scissor.x1, box.x1);

        const y0 = max2(scissor.y0, box.y0);
        const y1 = min2(scissor.y1, box.y1);


        //create 4 boxes around overlap
        if (x0 > box.x0) {
            //add left box
            additions.push(new QuadTreeDatum(box.x0, box.y0, x0, box.y1));
        }
        if (x1 < box.x1) {
            //add right box
            additions.push(new QuadTreeDatum(x1, box.y0, box.x1, box.y1));
        }
        if (y0 > box.y0) {
            //add top box
            additions.push(new QuadTreeDatum(box.x0, box.y0, box.x1, y0));
        }
        if (y1 < box.y1) {
            //add bottom box
            additions.push(new QuadTreeDatum(box.x0, y1, box.x1, box.y1));
        }

    }

    boxes.traverseRectangleIntersections(scissor.x0, scissor.y0, scissor.x1, scissor.y1, visitOverlap);

    let i, l;
    //perform removals
    for (i = 0, l = removals.length; i < l; i++) {
        const removal = removals[i];
        removal.disconnect();
    }

    //drop potential overlaps between additions
    removeRedundantBoxesArray(additions);

    //perform additions
    for (i = 0, l = additions.length; i < l; i++) {
        const addition = additions[i];

        boxes.insertDatum(addition);
    }
}

/**
 *
 * @param {AABB2} box
 * @param {QuadTreeNode} free
 * @returns {boolean}
 */
function packOneBox(box, free) {
    const w = box.getWidth();
    const h = box.getHeight();

    const container = findBestContainer(w, h, free, costByRemainingArea);

    if (container === null) {
        //couldn't find a place for box
        return false;
    }

    //remove container from free set
    container.disconnect();

    //place box at bottom left of the container
    const y0 = container.y1 - h;
    const x0 = container.x0;

    box.set(x0, y0, x0 + w, y0 + h);

    //update remaining set by removing this box area from free set
    cutArea(box, free);

    //split remaining space
    if (container.y0 !== y0) {
        const splitA = new QuadTreeDatum(container.x0, container.y0, container.x1, y0);

        free.insertDatum(splitA);
    }

    if (box.x1 !== container.x1) {
        const splitB = new QuadTreeDatum(box.x1, container.y0, container.x1, container.y1);
        free.insertDatum(splitB);
    }

    removeRedundantBoxes(free);

    return true;
}

export class MaxRectanglesPacker {
    /**
     *
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        this.size = new Vector2(width, height);

        /**
         *
         * @type {QuadTreeNode}
         */
        this.free = new QuadTreeNode(0, 0, width, height);
        this.free.add(null, 0, 0, width, height);

        this.boxes = [];
    }

    /**
     *
     * @param {AABB2} box
     * @returns {boolean}
     */
    remove(box) {
        const i = this.boxes.indexOf(box);

        if (i === -1) {
            //not found
            return false;
        }

        this.boxes.splice(i, 1);

        //introduce a free node in the unoccupied space
        this.free.insertDatum(new QuadTreeDatum(box.x0, box.y0, box.x1, box.y1));


        assert.ok(this.validate());


        return true;
    }

    /**
     *
     * @param {AABB2[]} boxes
     * @returns {number} how many failed to be removed
     */
    removeMany(boxes) {
        let failures = 0;

        const l = boxes.length;
        for (let i = 0; i < l; i++) {
            const box = boxes[i];

            if (!this.remove(box)) {
                failures++;
            }

        }

        return failures;
    }

    /**
     *
     * @param {AABB2} box
     * @returns {boolean}
     */
    add(box) {
        const success = packOneBox(box, this.free);

        if (success) {
            this.boxes.push(box);
        }

        assert.ok(this.validate());

        return success;
    }

    /**
     * Method is transactional, if one box fails to be packed, all fail and packer is reverted to original state
     * @param {AABB2[]} boxes
     * @returns {boolean}
     */
    addMany(boxes) {
        assert.ok(this.validate());

        const numBoxes = boxes.length;

        const packed = [];

        /**
         *
         * @param {number} boxIndex
         * @returns {number}
         */
        function scoreBoxByMinSide(boxIndex) {
            const box = boxes[boxIndex];
            return -Math.min(box.getWidth(), box.getHeight());
        }

        const heap = new BinaryHeap(scoreBoxByMinSide);

        for (let i = 0; i < numBoxes; i++) {
            heap.push(i);
        }

        for (let i = 0; i < numBoxes; i++) {
            const boxIndex = heap.pop();
            const box = boxes[boxIndex];

            if (!this.add(box)) {
                //remove whatever has been packed
                const removeFailCount = this.removeMany(packed);

                assert.equal(removeFailCount, 0, `Failed to remove ${removeFailCount} boxes`);

                return false;
            } else {
                //box packed successfully
                packed.push(box);
            }
        }

        return true;
    }

    /**
     * Re-packs all rectangles
     * @returns {boolean} true if successful, false if there was not enough space found during packing
     */
    repack() {
        // remember existing boxes
        const boxes = this.boxes;

        // reset packer
        this.clear();

        // pack again
        return this.addMany(boxes);
    }

    /**
     * Clear out all the data from the packer
     */
    clear() {
        this.free.clear();
        this.free.insertDatum(new QuadTreeDatum(0, 0, this.size.x, this.size.y));

        this.boxes = [];
    }

    /**
     * Resize the packer canvas
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {

        assert.ok(this.validate());

        const oldWidth = this.size.x;
        const oldHeight = this.size.y;

        this.size.set(width, height);

        if (oldWidth > width || oldHeight > height) {
            //canvas was made smaller in at least one dimension, re-pack is required
            this.repack();
        } else {
            //canvas was enlarged, we can simply add new free areas
            if (width > oldWidth) {
                this.free.insertDatum(new QuadTreeDatum(oldWidth, 0, width, height));
            }
            if (height > oldHeight) {
                this.free.insertDatum(new QuadTreeDatum(0, oldHeight, width, height))
            }
        }

        assert.ok(this.validate());
    }

    validate() {

        const boxes = this.boxes;
        const numPatches = boxes.length;
        let i, j;

        for (i = 0; i < numPatches; i++) {
            const p0 = boxes[i];


            for (j = i + 1; j < numPatches; j++) {
                const p1 = boxes[j];

                if (p0.computeOverlap(p1, new AABB2())) {
                    console.warn("Overlap", p0, p1);
                    return false;
                }

            }
        }

        return true;
    }
}


/**
 * Packs {@link AABB2} boxes into defined bounds
 *
 * Based on paper "A Thousand Ways to Pack the Bin - A Practical Approach to Two-Dimensional Rectangle Bin Packing" 2010 Jukka Jylänki
 * Method presented called Maximal Rectangles
 *
 * @param {number} width
 * @param {number} height
 * @param {AABB2[]} boxes
 * @returns {boolean} true if packing was successful, false otherwise
 */
function packMaxRectangles(width, height, boxes) {

    const packer = new MaxRectanglesPacker(width, height);

    return packer.addMany(boxes);
}

export {
    packMaxRectangles
};
