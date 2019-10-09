import { BitSet } from "../../../core/binary/BitSet.js";
import { assert } from "../../../core/assert.js";
import { clamp, min2 } from "../../../core/math/MathUtils.js";

/**
 * Naive flood implementation of a distance field computation algorithm
 * @author Alex Goldring Dec 2018
 * @param {Sampler2D} source
 * @param {Sampler2D} destination
 * @param {number} emptyValue
 */
export function computeSignedDistanceField_(source, destination, emptyValue) {
    assert.equal(source.itemSize, 1, `unsupported source.itemSize, expected 1, got '${source.itemSize}'`);
    assert.typeOf(emptyValue, 'number', 'emptyValue');

    let i, j;

    const distanceData = destination.data;

    const visited = new BitSet();

    const openSet = new BitSet();

    //use "flood" algorithm

    //mark all visible tiles as visited
    const samplerData = source.data;
    const totalCellCount = samplerData.length;

    function traverseNeighbours(index, visitor) {
        let i = index - (width + 1);

        const top = index > width;
        const bottom = index < (totalCellCount - width);

        const x = index % width;

        const left = x > 0;
        const right = x < width - 1;

        if (top) {
            if (left) {
                visitor(i);
            }

            visitor(i + 1);

            if (right) {
                visitor(i + 2);
            }
        }

        i += width;

        if (left) {
            visitor(i);
        }

        if (right) {
            visitor(i + 2);
        }

        i += width;

        if (bottom) {
            if (left) {
                visitor(i);
            }

            visitor(i + 1);

            if (right) {
                visitor(i + 2);
            }
        }

    }

    const width = destination.width;

    for (i = 0; i < totalCellCount; i++) {
        const sampleValue = samplerData[i];
        if (sampleValue !== emptyValue) {
            visited.set(i, true);
            //write distance data
            distanceData[i] = 0;
        } else {
            distanceData[i] = 255;
        }
    }

    //populate initial open set
    for (i = visited.nextSetBit(0); i !== -1; i = visited.nextSetBit(i + 1)) {
        j = 0;
        traverseNeighbours(i, function (neighbourIndex) {
            if (!visited.get(neighbourIndex)) {
                //increment number of not visited
                j++;
            }
        });

        if (j === 0) {
            //all neighbours are visited, we can safely ignore this cell
        } else {
            openSet.set(i, true);
        }
    }

    for (i = openSet.nextSetBit(0); i !== -1; i = openSet.nextSetBit(0)) {
        //remove from open set
        openSet.set(i, false);

        const value = distanceData[i];

        traverseNeighbours(i, function (neighbourIndex) {
            const neighbourValue = value + 1;

            if (visited.get(neighbourIndex)) {
                if (distanceData[neighbourIndex] <= neighbourValue) {
                    return;
                }
            } else {
                visited.set(neighbourIndex, true);
            }

            distanceData[neighbourIndex] = neighbourValue;
            //add neighbour to open set
            openSet.set(neighbourIndex, true);
        });
    }
}

/**
 * @param {Sampler2D} source
 * @param {Sampler2D} distanceField
 * @param {number} emptyValue
 */
export function computeUnsignedDistanceField(source, distanceField, emptyValue) {
    computeUnsignedDistanceField_Chamfer(source, distanceField, emptyValue, 1, 1, 255);
}

/**
 * algorithm proposed by Borgefors, Chamfer distance [J. ACM 15 (1968) 600, Comput. Vis. Graph. Image Process. 34 (1986) 344], h
 * @param {Sampler2D} source
 * @param {Sampler2D} distanceField
 * @param {number} emptyValue
 * @param {number} d1 distance between two adjacent pixels in either x or y direction
 * @param {number} d2 distance between two diagonally adjacent pixels
 * @param {number} maxD highest value that distance field can hold
 */
export function computeUnsignedDistanceField_Chamfer(source, distanceField, emptyValue, d1, d2, maxD) {
    const sourceData = source.data;
    const distanceFieldData = distanceField.data;

    const width = source.width;
    const height = source.height;

    const maxX = width - 1;
    const maxY = height - 1;

    function getD(x, y) {
        x = clamp(x, 0, maxX);
        y = clamp(y, 0, maxY);

        const index = x + y * width;

        return distanceFieldData[index];
    }

    let x, y, i, v;

    //initialize distance field
    const dataSize = height * width;
    for (i = 0; i < dataSize; i++) {
        if (sourceData[i] !== emptyValue) {
            distanceFieldData[i] = 0;
        } else {
            distanceFieldData[i] = maxD;
        }
    }

    //first pass (forward)
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            i = y * width + x;

            v = distanceFieldData[i];

            const v0 = getD(x - 1, y - 1) + d2;

            if (v0 < v) {
                distanceFieldData[i] = v0;
                v = v0;
            }

            const v1 = getD(x, y - 1) + d1;

            if (v1 < v) {
                distanceFieldData[i] = v1;
                v = v1;
            }

            const v2 = getD(x + 1, y - 1) + d2;

            if (v2 < v) {
                distanceFieldData[i] = v2;
                v = v2;
            }

            const v3 = getD(x - 1, y) + d1;

            if (v3 < v) {
                distanceFieldData[i] = v3;
            }
        }
    }

    //second pass (backward)
    for (y = maxY; y >= 0; y--) {
        for (x = maxX; x >= 0; x--) {
            i = y * width + x;

            v = distanceFieldData[i];

            const v0 = getD(x + 1, y) + d1;

            if (v0 < v) {
                distanceFieldData[i] = v0;
                v = v0;
            }

            const v1 = getD(x - 1, y + 1) + d2;

            if (v1 < v) {
                distanceFieldData[i] = v1;
                v = v1;
            }

            const v2 = getD(x, y + 1) + d1;

            if (v2 < v) {
                distanceFieldData[i] = v2;
                v = v2;
            }

            const v3 = getD(x + 1, y + 1) + d2;

            if (v3 < v) {
                distanceFieldData[i] = v3;
            }
        }
    }
}

/**
 * algorithm proposed by Borgefors, Chamfer distance [J. ACM 15 (1968) 600, Comput. Vis. Graph. Image Process. 34 (1986) 344], h
 * @param {Sampler2D} source
 * @param {Sampler2D} distanceField
 * @param {number} emptyValue
 * @param {number} d1 distance between two adjacent pixels in either x or y direction
 * @param {number} d2 distance between two diagonally adjacent pixels
 * @param maxD
 */
export function computeSignedDistanceField_Chamfer(source, distanceField, emptyValue, d1, d2, maxD) {
    const sourceData = source.data;
    const distanceFieldData = distanceField.data;

    const width = source.width;
    const height = source.height;

    const maxX = width - 1;
    const maxY = height - 1;

    function getS(x, y) {
        x = clamp(x, 0, maxX);
        y = clamp(y, 0, maxY);

        const index = x + y * width;

        return sourceData[index];
    }

    function getD(x, y) {
        x = clamp(x, 0, maxX);
        y = clamp(y, 0, maxY);

        const index = x + y * width;

        return distanceFieldData[index];
    }

    function setD(x, y, v) {
        x = clamp(x, 0, maxX);
        y = clamp(y, 0, maxY);

        const index = x + y * width;

        distanceFieldData[index] = min2(v, maxD);
    }

    let x, y;

    //initialize distance field
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            if (
                getS(x - 1, y) !== getS(x, y)
                || getS(x + 1, y) !== getS(x, y)
                || getS(x, y - 1) !== getS(x, y)
                || getS(x, y + 1) !== getS(x, y)
            ) {
                setD(x, y, 0);
            } else {
                setD(x, y, 255);
            }
        }
    }

    //first pass (forward)
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {

            const v = getD(x, y);

            const v0 = getD(x - 1, y - 1) + d2;

            if (v0 < v) {
                setD(x, y, v0);
            }

            const v1 = getD(x, y - 1) + d1;

            if (v1 < v) {
                setD(x, y, v1);
            }

            const v2 = getD(x + 1, y - 1) + d2;

            if (v2 < v) {
                setD(x, y, v2);
            }

            const v3 = getD(x - 1, y) + d1;

            if (v3 < v) {
                setD(x, y, v3);
            }
        }
    }

    //second pass (backward)
    for (y = maxY; y >= 0; y--) {
        for (x = maxX; x >= 0; x--) {
            const v = getD(x, y);

            const v0 = getD(x + 1, y) + d1;

            if (v0 < v) {
                setD(x, y, v0);
            }

            const v1 = getD(x - 1, y + 1) + d2;

            if (v1 < v) {
                setD(x, y, v1);
            }

            const v2 = getD(x, y + 1) + d1;

            if (v2 < v) {
                setD(x, y, v2);
            }

            const v3 = getD(x + 1, y + 1) + d2;

            if (v3 < v) {
                setD(x, y, v3);
            }
        }
    }

    //indicate inside & outside
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            if (getS(x, y) !== emptyValue) {
                //inside
                setD(x, y, -getD(x, y));
            }
        }
    }
}