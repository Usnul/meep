import { assert } from "../../core/assert.js";

/**
 * Min-Heap implementation with a score function. The data structure is a binary heap where elements are removed in order defined by scoring function
 * @template T
 */
class BinaryHeap {
    /**
     * @template T
     * @param {function(T):number} scoreFunction
     * @constructor
     */
    constructor(scoreFunction) {

        this.scoreFunction = scoreFunction;

        /**
         *
         * @type {T[]}
         */
        this.data = [];

        /**
         * @private
         * @type {number}
         */
        this.length = 0;
    }

    /**
     * @private
     * @param {number} pos
     */
    bubbleUp(pos) {
        assert.typeOf(pos, 'number', 'pos');

        const data = this.data;

        let parentIndex;

        let index = pos;

        let value = data[index];
        let score = this.scoreFunction(value);

        while (index > 0) {

            parentIndex = (index - 1) >> 1;

            const parentValue = data[parentIndex];
            const parentScore = this.scoreFunction(parentValue);

            if (score < parentScore) {
                //swap

                data[parentIndex] = value;
                data[index] = parentValue;

                index = parentIndex;
            } else {
                break;
            }
        }
    }

    /**
     * @private
     * @param {number} pos
     */
    bubbleDown(pos) {
        assert.typeOf(pos, 'number', 'pos');

        const data = this.data;
        const length = this.length;

        let index = pos;

        let minIndex = index;

        while (true) {
            const left = (index << 1) + 1;

            if (left >= length) {
                //index is a leaf node
                break;
            }

            const right = left + 1;

            let dataMin = data[minIndex];
            const scoreMin = this.scoreFunction(dataMin);

            const dataLeft = data[left];
            const scoreLeft = this.scoreFunction(dataLeft);

            if (right >= length) {
                //right node doesn't exist


                if (scoreLeft >= scoreMin) {
                    break;
                } else {
                    minIndex = left;
                    dataMin = dataLeft;
                }
            } else {
                //both left and right nodes exist
                const dataRight = data[right];
                const scoreRight = this.scoreFunction(dataRight);

                //
                if (scoreLeft <= scoreRight) {
                    if (scoreLeft >= scoreMin) {
                        break;
                    } else {
                        minIndex = left;
                        dataMin = dataLeft;
                    }
                } else {
                    if (scoreRight >= scoreMin) {
                        break;
                    } else {
                        minIndex = right;
                        dataMin = dataRight;
                    }
                }
            }

            //swap positions
            data[minIndex] = data[index];
            data[index] = dataMin;

            index = minIndex;

        }
    }

    pop() {

        const last = this.data.pop();

        this.length--;

        if (this.length === 0) {

            return last;

        } else {

            const ret = this.data[0];

            this.data[0] = last;

            this.bubbleDown(0);

            return ret;

        }
    }

    /**
     * Remove all the data from the heap
     */
    clear() {
        this.data = [];
        this.length = 0;
    }

    /**
     *
     * @param {T} node
     * @returns {boolean}
     */
    contains(node) {
        return this.data.indexOf(node) !== -1;
    }

    /**
     *
     * @returns {boolean}
     */
    isEmpty() {
        return this.length === 0;
    }

    /**
     *
     * @returns {number}
     */
    size() {
        return this.length;
    }

    /**
     *
     * @param {T} node
     */
    rescoreElement(node) {
        this.bubbleDown(this.data.indexOf(node));
    }

    /**
     *
     * @param {T} el
     */
    push(el) {
        this.data.push(el);

        const position = this.length;

        this.length++;

        this.bubbleUp(position);
    }
}

export default BinaryHeap;
