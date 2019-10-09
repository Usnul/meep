import { BitSet } from "../../../core/binary/BitSet.js";
import { assert } from "../../../core/assert.js";

export class HarmonicDiffusionGrid {
    /**
     *
     * @param {number[]|Float32Array|Float64Array} data
     * @param {number} width
     * @param {number} height
     */
    constructor(data, width, height) {
        assert.typeOf(width, 'number', 'width');
        assert.typeOf(height, 'number', 'height');

        assert.equal(data.length, width * height, `data.length(=${data.length}) is not equal to product of width(=${width})*height(=${height})`);

        /**
         *
         * @type {number[]|Float32Array|Float64Array}
         */
        this.data = data;
        /**
         *
         * @type {number}
         */
        this.width = width;
        /**
         *
         * @type {number}
         */
        this.height = height;

        /**
         * Maps which indices are assigned with values
         * @type {BitSet}
         */
        this.assignment = new BitSet();
    }

    /**
     * Clear all assignments
     */
    reset() {
        //clear assigned values
        this.assignment.reset();
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} value
     */
    assign(x, y, value) {

        assert.typeOf(x, 'number', 'value');
        assert.typeOf(y, 'number', 'value');
        assert.typeOf(value, 'number', 'value');

        assert.ok(x >= 0, `x(=${x}) is less than 0`);
        assert.ok(x < this.width, `x(=${x}) >= width(=${this.width})`);

        assert.ok(y >= 0, `y(=${y}) is less than 0`);
        assert.ok(y < this.height, `y(=${y}) >= height(=${this.height})`);

        assert.ok(Number.isFinite(value), `values must be finite, instead was '${value}'`);
        assert.notOk(Number.isNaN(value), `value is NaN`);

        //compute index
        const index = y * this.width + x;

        //set assignment flag
        this.assignment.set(index, true);

        //write value
        this.data[index] = value;
    }

    /**
     * Diffuses assigned values across the grid, to achieve good diffusion large number of steps might be necessary
     */
    step() {
        //iterate over all unassigned elements
        const width = this.width;
        const indexLimit = this.height * width;

        const assignment = this.assignment;

        const data = this.data;

        let i;

        let sum;
        let neighbourCount;

        const lastRowIndex = width - 1;


        for (i = 0; i < indexLimit; i++) {

            if (assignment.get(i)) {
                //cell is assigned, skip
                continue;
            }

            neighbourCount = 0;
            sum = 0;

            const indexTop = i - width;

            if (indexTop >= 0) {
                //top is within bounds
                sum += data[indexTop];
                neighbourCount++;
            }

            if (i % width > 0) {
                //left is within bounds
                sum += data[i - 1];
                neighbourCount++;
            }

            if (i % width !== lastRowIndex) {
                //right is within bounds
                sum += data[i + 1];
                neighbourCount++;
            }

            const indexBottom = i + width;

            if (indexBottom < indexLimit) {
                sum += data[indexBottom];
                neighbourCount++;
            }

            //compute diffuse value
            const value = sum / neighbourCount;

            //write value
            data[i] = value;
        }


    }
}