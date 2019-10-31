/**
 * Created by Alex on 13/10/2014.
 */


import Vector2 from '../../../core/geom/Vector2';
import { computeHashIntegerArray } from "../../../core/math/MathUtils.js";
import { assert } from "../../../core/assert.js";
import { BinaryClassSerializationAdapter } from "../../ecs/storage/binary/BinaryClassSerializationAdapter.js";

class GridObstacle {
    constructor() {
        this.data = [1];
        this.size = new Vector2(1, 1);
    }

    /**
     *
     * @param {number} w
     * @param {number} h
     */
    resize(w, h) {
        assert.ok(Number.isInteger(w) && w >= 0, `expected non-negative integer, got ${w}`);
        assert.ok(Number.isInteger(h) && h >= 0, `expected non-negative integer, got ${h}`);

        const x1 = this.size.x;
        const y1 = this.size.y;

        const oldData = this.data;

        const newData = new Uint8Array(w * h);

        let i, j;

        const iL = Math.min(x1, w);
        const jL = Math.min(y1, h);

        //copy
        for (j = 0; j < jL; j++) {

            const oJ = j * x1;
            const nJ = j * w;

            for (i = 0; i < iL; i++) {
                newData[nJ + i] = oldData[oJ + i];
            }

        }

        //set new property values
        this.data = newData;
        this.size.set(w, h);
    }

    /**
     *
     * @param {number} offsetX
     * @param {number} offsetY
     * @param {function(x:number, y:number, value:number, index:number)} visitor
     * @param {*} [thisArg]
     */
    traverseMask(offsetX, offsetY, visitor, thisArg) {
        assert.typeOf(offsetX, 'number', 'offsetX');
        assert.typeOf(offsetY, 'number', 'offsetY');
        assert.typeOf(visitor, 'function', 'visitor');

        const size = this.size;
        const sX = size.x;
        const sY = size.y;

        const data = this.data;

        let index = 0;

        let i, j;

        for (i = 0; i < sY; i++) {

            for (j = 0; j < sX; j++) {

                const value = data[index];

                index++;

                if (visitor.call(thisArg, j + offsetX, i + offsetY, value, index) === false) {
                    //stop traversal
                    return;
                }

            }

        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    readPoint(x, y) {
        assert.typeOf(x, 'number', 'x');
        assert.typeOf(y, 'number', 'y');

        assert.ok(Number.isInteger(x), `expected x to be an integer, got ${x} instead`);
        assert.ok(Number.isInteger(y), `expected y to be an integer, got ${y} instead`);

        return this.data[y * this.size.x + x];
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isPointWithin(x, y) {
        assert.typeOf(x, 'number', 'x');
        assert.typeOf(y, 'number', 'y');

        const size = this.size;

        const sX = size.x;
        const sY = size.y;

        return x >= 0 && x < sX && y >= 0 && y < sY;
    }

    /**
     *
     * @param {number} x Obstacle-Local X position
     * @param {number} y Obstacle-Local Y position
     * @param {number[]} adjacencyMask Mask that defines adjacency, contains pairs of number for each X,Y coordinate offset from obstacle point
     * @returns {boolean}
     */
    isPointAdjacent(x, y, adjacencyMask) {
        assert.typeOf(x, 'number', 'x');
        assert.typeOf(y, 'number', 'y');

        assert.notEqual(adjacencyMask, undefined, 'mask is undefined');
        assert.notEqual(adjacencyMask, null, 'mask is null');

        const size = this.size;

        const sX = size.x;
        const sY = size.y;

        const data = this.data;

        const maskLength = adjacencyMask.length;

        assert.typeOf(maskLength, 'number', 'maskLength');


        for (let k = 0; k < maskLength; k += 2) {
            const offsetX = adjacencyMask[k];
            const offsetY = adjacencyMask[k + 1];

            //reconstruct origin point within the grid
            const aY = y - offsetY;
            const aX = x - offsetX;

            if (aX < 0 || aX >= sX || aY < 0 || aY >= sY) {
                //origin point is outside of bounds
                continue;
            }

            const index = aY * sX + aX;

            const value = data[index];

            if (value === 0) {
                //non-obstructing
                continue;
            }

            //found a matching adjacent point
            return true;
        }

        //no matches
        return false;
    }

    toJSON() {
        return {
            size: this.size.toJSON(),
            data: this.data
        };
    }

    fromJSON(v) {
        const size = v.size;
        this.size.fromJSON(size);

        const sX = this.size.x;
        const sY = this.size.y;

        this.data = new Uint8Array(sX * sY);

        this.data.set(v.data, 0);
    }

    /**
     *
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            this.size.hashCode(),
            computeHashIntegerArray.apply(null, this.data)
        );
    }

    /**
     *
     * @param {GridObstacle} other
     * @returns {boolean}
     */
    equals(other) {
        if (!this.size.equals(other.size)) {
            return false;
        }

        const dataSize = this.size.x * this.size.y;

        for (let i = 0; i < dataSize; i++) {
            if (this.data[i] !== other.data[i]) {
                return false;
            }
        }

        return true;
    }
}

GridObstacle.typeName = "GridObstacle";

export default GridObstacle;

export class GridObstacleSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = GridObstacle;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GridObstacle} value
     */
    serialize(buffer, value) {

        buffer.writeUint16(value.size.x);
        buffer.writeUint16(value.size.y);

        buffer.writeBytes(value.data);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GridObstacle} value
     */
    deserialize(buffer, value) {

        const x = buffer.readUint16();
        const y = buffer.readUint16();

        value.size.set(x, y);

        value.data = new Uint8Array(x * y);

        buffer.readBytes(value.data, 0, x * y);
    }
}
