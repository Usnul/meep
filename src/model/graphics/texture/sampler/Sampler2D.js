/**
 * Created by Alex on 11/11/2014.
 */


import Vector2 from '../../../core/geom/Vector2';
import Vector3 from '../../../core/geom/Vector3';
import Vector4 from '../../../core/geom/Vector4';
import { clamp, min2 } from "../../../core/math/MathUtils";
import { mix } from "../../../core/math/MathUtils.js";
import { BlendingType } from "./BlendingType.js";
import { assert } from "../../../core/assert";

function makeVector1() {
    return 0;
}

function makeVector2() {
    return new Vector2();
}

function makeVector3() {
    return new Vector3();
}

function makeVector4() {
    return new Vector4();
}

function v2CrossMag(ax, ay, bx, by) {
    return ax * by - ay * bx;
}


function sampleTriangleM2(f2_x, f2_y, f3_x, f3_y, f1_x, f1_y, p1, p2, p3) {
    const a = 0.5; // main triangle cross product
    const a1 = v2CrossMag(f2_x, f2_y, f3_x, f3_y) / a;
    const a2 = v2CrossMag(f3_x, f3_y, f1_x, f1_y) / a;
    const a3 = v2CrossMag(f1_x, f1_y, f2_x, f2_y) / a;
    return p1 * a1 + p2 * a2 + p3 * a3;
}

function interpolateVectors1(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
    return filterFunction(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd);
}

//
function interpolateVectors2(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
    result.x = filterFunction(v_0_0.x, v_1_0.x, v_0_1.x, v_1_1.x, xd, yd);
    result.y = filterFunction(v_0_0.y, v_1_0.y, v_0_1.y, v_1_1.y, xd, yd);
    return result;
}

function interpolateVectors3(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
    result.x = filterFunction(v_0_0.x, v_1_0.x, v_0_1.x, v_1_1.x, xd, yd);
    result.y = filterFunction(v_0_0.y, v_1_0.y, v_0_1.y, v_1_1.y, xd, yd);
    result.z = filterFunction(v_0_0.z, v_1_0.z, v_0_1.z, v_1_1.z, xd, yd);
    return result;
}

function interpolateVectors4(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
    result.x = filterFunction(v_0_0.x, v_1_0.x, v_0_1.x, v_1_1.x, xd, yd);
    result.y = filterFunction(v_0_0.y, v_1_0.y, v_0_1.y, v_1_1.y, xd, yd);
    result.z = filterFunction(v_0_0.z, v_1_0.z, v_0_1.z, v_1_1.z, xd, yd);
    result.w = filterFunction(v_0_0.w, v_1_0.w, v_0_1.w, v_1_1.w, xd, yd);
    return result;
}


/**
 * Quad interpolation
 * @param {number} q0
 * @param {number} q1
 * @param {number} p0
 * @param {number} p1
 * @param {number} xd
 * @param {number} yd
 * @returns {number}
 */
function filterFunction_(q0, q1, p0, p1, xd, yd) {
    //
    const s0 = mix(q0, q1, xd);
    const s1 = mix(p0, p1, xd);
    const t0 = mix(q0, p0, yd);
    const t1 = mix(q1, p1, yd);
    //
    const u = mix(s0, s1, yd);
    const v = mix(t0, t1, xd);
    //
    const total = u + v;
    return total / 2;
}

/**
 * Bi-Linear interpolation
 * @param q0
 * @param q1
 * @param p0
 * @param p1
 * @param xd
 * @param yd
 * @returns {*}
 */
function filterFunction(q0, q1, p0, p1, xd, yd) {

    const s0 = mix(q0, q1, xd);
    const s1 = mix(p0, p1, xd);

    return mix(s0, s1, yd);
}

function filterFunctionSQRT(q0, q1, p0, p1, xd, yd) {
    function sd(v, x, y) {
        return v * Math.sqrt(x * x + y * y);
    }

    return sd(q0, 1 - xd, 1 - yd) + sd(q1, xd, 1 - yd) + sd(p0, 1 - xd, yd) + sd(p1, xd, yd);
}

function sampleTriangleTopLeft(p1, p2, p3, dx, dy) {

    // calculate vectors from point f to vertices p1, p2 and p3:
    const f1_x = -dx;
    const f1_y = -dy;

    const f2_x = 1 - dx;
    const f2_y = -dy;

    const f3_x = -dx;
    const f3_y = 1 - dy;
    // calculate the areas (parameters order is essential in this case):
    return sampleTriangleM2(f2_x, f2_y, f3_x, f3_y, f1_x, f1_y, p1, p2, p3);
}

function sampleTriangleBottomRight(p1, p2, p3, dx, dy) {

    // calculate vectors from point f to vertices p1, p2 and p3:
    const f1_x = 1 - dx;
    const f1_y = -dy;

    const f2_x = 1 - dx;
    const f2_y = 1 - dy;

    const f3_x = -dx;
    const f3_y = 1 - dy;
    // calculate the areas (parameters order is essential in this case):
    return sampleTriangleM2(f2_x, f2_y, f3_x, f3_y, f1_x, f1_y, p1, p2, p3);
}

/**
 *
 * @param {Array.<Number>|Uint8Array|Uint16Array|Int8Array|Float32Array} data
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @constructor
 */
export function Sampler2D(data, itemSize, width, height) {
    if (!Number.isInteger(itemSize)) {
        throw new Error(`itemSize must be integer, instead was ${itemSize}`);
    }
    if (!Number.isInteger(width)) {
        throw new Error(`width must be integer, instead was ${width}`);
    }
    if (!Number.isInteger(height)) {
        throw new Error(`height must be integer, instead was ${height}`);
    }

    if (data === undefined) {
        throw new Error('data was undefined');
    }

    /**
     *
     * @type {Number}
     */
    this.width = width;
    /**
     *
     * @type {Number}
     */
    this.height = height;
    /**
     *
     * @type {Number}
     */
    this.itemSize = itemSize;
    /**
     *
     * @type {Array<number>|Uint8Array|Uint16Array|Int8Array|Float32Array|Float64Array}
     */
    this.data = data;

    //
    this.initialize();
}

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.uint8 = function (itemSize, width, height) {
    const data = new Uint8Array(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.uint16 = function (itemSize, width, height) {
    const data = new Uint16Array(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.int8 = function (itemSize, width, height) {
    const data = new Int8Array(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {int} itemSize
 * @param {int} width
 * @param {int} height
 * @return {Sampler2D}
 */
Sampler2D.float32 = function (itemSize, width, height) {
    const data = new Float32Array(width * height * itemSize);
    const sampler = new Sampler2D(data, itemSize, width, height);
    return sampler;
};

/**
 *
 * @param {Sampler2D} input0
 * @param {Sampler2D} input1
 * @param {Sampler2D} result
 * @param {function( value0 : number[], value1 : number[], result : number[], index : number) : void} operation
 */
Sampler2D.combine = function (input0, input1, result, operation) {
    assert.notEqual(input0, undefined, 'input0 is undefined');
    assert.notEqual(input1, undefined, 'input1 is undefined');
    assert.notEqual(result, undefined, 'result is undefined');

    assert.typeOf(operation, 'function', 'operation');

    assert.equal(input0.width, input1.width, `input0.width(=${input0.width}) is not equal to input1.width(=${input1.width})`);
    assert.equal(input0.height, input1.height, `input0.height(=${input0.height}) is not equal to input1.height(=${input1.height})`);

    assert.equal(input0.width, result.width, `input width(=${input0.width}) is not equal to result.width(=${result.width})`);
    assert.equal(input0.height, result.height, `input height(=${input0.height}) is not equal to result.height(=${result.height})`);

    const width = input0.width;
    const height = input0.height;

    const length = width * height;

    const arg0 = [];
    const arg1 = [];
    const res = [];

    const itemSize0 = input0.itemSize;
    const itemSize1 = input1.itemSize;
    const itemSizeR = result.itemSize;

    const data0 = input0.data;
    const data1 = input1.data;
    const dataR = result.data;


    let i, j;

    for (i = 0; i < length; i++) {

        // read input 0
        for (j = 0; j < itemSize0; j++) {
            arg0[j] = data0[j + i * itemSize0];
        }

        // read input 1
        for (j = 0; j < itemSize0; j++) {
            arg1[j] = data1[j + i * itemSize1];
        }

        //perform operation
        operation(arg0, arg1, res, i);

        //write result
        for (j = 0; j < itemSizeR; j++) {
            dataR[j + i * itemSizeR] = res[j];
        }

    }
};


/**
 * @param {number} [channel=0]
 * @returns {{x: number, index: number, y: number, value: number}}
 */
Sampler2D.prototype.computeMax = function (channel = 0) {
    const itemSize = this.itemSize;

    assert.typeOf(channel, 'number', 'channel');
    assert.ok(channel >= 0, `channel must be >= 0, was ${channel}`);
    assert.ok(channel < itemSize, `channel must be less than itemSize(=${itemSize}), was ${channel}`);

    const data = this.data;

    const l = data.length;

    if (l === 0) {
        //no data
        return undefined;
    }

    let bestValue = data[channel];
    let bestIndex = channel;

    for (let i = channel + itemSize; i < l; i += itemSize) {
        const value = data[i];

        if (bestValue < value) {
            bestValue = value;
            bestIndex = i;
        }

    }

    const width = this.width;

    const itemIndex = (bestIndex / this.itemSize) | 0;

    const x = itemIndex % width;
    const y = (itemIndex / width) | 0;

    return {
        index: bestIndex,
        value: bestValue,
        x,
        y
    };
};

/**
 * @param {number[]} result
 * @param {number} [channel=0]
 */
Sampler2D.prototype.computeMinIndices = function (result, channel = 0) {
    const itemSize = this.itemSize;

    assert.typeOf(channel, 'number', 'channel');
    assert.ok(channel >= 0, `channel must be >= 0, was ${channel}`);
    assert.ok(channel < itemSize, `channel must be less than itemSize(=${itemSize}), was ${channel}`);

    assert.ok(Array.isArray(result), 'result is not an array');

    const data = this.data;

    const l = data.length;

    if (l === 0) {
        //no data
        return undefined;
    }

    let bestValue = data[channel];
    let bestIndex = channel;

    let resultCount = 0;

    for (let i = channel + itemSize; i < l; i += itemSize) {
        const value = data[i];

        if (bestValue > value) {
            bestValue = value;
            //drop result
            resultCount = 1;

            result[0] = i;
        } else if (value === bestValue) {
            result[resultCount++] = i;
        }

    }

    //crop results
    if (resultCount < result.length) {
        result.splice(resultCount, result.length - resultCount);
    }

    return;
};

/**
 * @param {number} [channel=0]
 * @returns {{x: number, index: number, y: number, value: number}}
 */
Sampler2D.prototype.computeMin = function (channel = 0) {
    const itemSize = this.itemSize;

    assert.typeOf(channel, 'number', 'channel');
    assert.ok(channel >= 0, `channel must be >= 0, was ${channel}`);
    assert.ok(channel < itemSize, `channel must be less than itemSize(=${itemSize}), was ${channel}`);

    const data = this.data;

    const l = data.length;

    if (l === 0) {
        //no data
        return undefined;
    }

    let bestValue = data[channel];
    let bestIndex = channel;

    for (let i = channel + itemSize; i < l; i += itemSize) {
        const value = data[i];

        if (bestValue > value) {
            bestValue = value;
            bestIndex = i;
        }

    }

    const width = this.width;

    const itemIndex = (bestIndex / this.itemSize) | 0;

    const x = itemIndex % width;
    const y = (itemIndex / width) | 0;

    return {
        index: bestIndex,
        value: bestValue,
        x,
        y
    };
};

Sampler2D.prototype.initialize = function () {
    const width = this.width;
    const height = this.height;
    const itemSize = this.itemSize;
    const data = this.data;

    const rowSize = width * itemSize;

    let makeVector;
    let readVector;
    let interpolateVectors;


    function readVector1(address) {
        return data[address];
    }

    function readVector2(address, result) {
        result.x = data[address];
        result.y = data[address + 1];
        return result;
    }

    function readVector3(address, result) {
        result.x = data[address];
        result.y = data[address + 1];
        result.z = data[address + 2];
        return result;
    }

    function readVector4(address, result) {
        result.x = data[address];
        result.y = data[address + 1];
        result.z = data[address + 2];
        result.w = data[address + 3];
        return result;
    }

    switch (itemSize) {
        case 1:
            makeVector = makeVector1;
            readVector = readVector1;
            interpolateVectors = interpolateVectors1;
            break;
        case 2:
            makeVector = makeVector2;
            readVector = readVector2;
            interpolateVectors = interpolateVectors2;
            break;
        case 3:
            makeVector = makeVector3;
            readVector = readVector3;
            interpolateVectors = interpolateVectors3;
            break;
        case 4:
            makeVector = makeVector4;
            readVector = readVector4;
            interpolateVectors = interpolateVectors4;
            break;
        default:
            throw  new Error("invalid item size (" + itemSize + ")");
    }
    const _v0 = makeVector(),
        _v1 = makeVector(),
        _v2 = makeVector(),
        _v3 = makeVector();


    function get(x, y, result) {
        //sample 4 points
        const x0 = x | 0;
        const y0 = y | 0;
        //
        const row0 = y0 * rowSize;
        const i0 = row0 + x0 * itemSize;
        if (x === x0 && y === y0) {
            //return early when coordinates are exact
            return readVector(i0, result);
        }
        const q0 = readVector(i0, _v0);
        //
        const x1 = x === x0 ? x0 : x0 + 1;
        const y1 = y === y0 ? y0 : y0 + 1;
        //
        const xd = x - x0;
        const yd = y - y0;

        const i1 = row0 + x1 * itemSize;
        const row1 = y1 * rowSize;
        const j0 = row1 + x0 * itemSize;
        const j1 = row1 + x1 * itemSize;
        const q1 = readVector(i1, _v1);
        const p0 = readVector(j0, _v2);
        const p1 = readVector(j1, _v3);

        return interpolateVectors(q0, q1, p0, p1, xd, yd, result);
    }

    function getNearest(x, y, result) {
        const x0 = x | 0;
        const y0 = y | 0;
        //
        const row0 = y0 * rowSize;
        const i0 = row0 + x0 * itemSize;
        return readVector(i0, result);
    }

    this.getNearest = getNearest;
    this.get = get;

    /**
     *
     * @param {number} u
     * @param {number} v
     * @param {Vector4|Vector3|Vector2} [result]
     */
    this.sample = function (u, v, result) {
        return get(u * (width - 1), v * (height - 1), result);
    }
};

/**
 *
 * @param {number} index
 * @param {number[]} result
 */
Sampler2D.prototype.computeNeighbors = function (index, result) {
    const width = this.width;
    const height = this.height;

    const x = index % width;
    const y = (index / width) | 0;
    if (x > 0) {
        result.push(index - 1);
    }
    if (x < width - 1) {
        result.push(index + 1);
    }
    if (y > 0) {
        result.push(index - width);
    }
    if (y < height - 1) {
        result.push(index + width);
    }
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
Sampler2D.prototype.point2index = function (x, y) {
    return x + y * this.width;
};

/**
 *
 * @param {number} index
 * @param {Vector2} result
 */
Sampler2D.prototype.index2point = function (index, result) {
    const width = this.width;

    const x = index % width;
    const y = (index / width) | 0;

    result.set(x, y);
};

/**
 *
 * @param {number} scale
 * @param {number} offset
 * @return {function(index:int, array:ArrayLike, x:int, y:int)}
 */
Sampler2D.prototype.makeArrayFiller = function (scale, offset) {
    scale = scale || 255;
    offset = offset || 0;

    const sampler = this;
    const v4 = new Vector4(1 / scale, 1 / scale, 1 / scale, 1 / scale);

    //
    function fillDD1(index, array, x, y) {
        const val = (sampler.get(x, y) + offset) * scale | 0;
        array[index] = val;
        array[index + 1] = val;
        array[index + 2] = val;
        array[index + 3] = 255;
    }

    function fillDD2(index, array, x, y) {
        sampler.get(x, y, v4);
        const val = (v4.x + offset) * scale | 0;
        array.fill(val, index, index + 3);
        array[index + 3] = (v4.y + offset) * scale | 0;
    }

    function fillDD3(index, array, x, y) {
        sampler.get(x, y, v4);
        array[index] = (v4.x + offset) * scale | 0;
        array[index + 1] = (v4.y + offset) * scale | 0;
        array[index + 2] = (v4.z + offset) * scale | 0;
        array[index + 3] = 255;
    }

    function fillDD4(index, array, x, y) {
        sampler.get(x, y, v4);
        array[index] = (v4.x + offset) * scale | 0;
        array[index + 1] = (v4.y + offset) * scale | 0;
        array[index + 2] = (v4.z + offset) * scale | 0;
        array[index + 3] = (v4.w + offset) * scale | 0;
    }

    let fillDD;
    switch (sampler.itemSize) {
        case 1:
            fillDD = fillDD1;
            break;
        case 2:
            fillDD = fillDD2;
            break;
        case 3:
            fillDD = fillDD3;
            break;
        case 4:
            fillDD = fillDD4;
            break;
        default :
            throw new Error("unsupported item size");
            break;
    }
    return fillDD;
};

/**
 * Copy a patch from another sampler with a margin.
 * This is useful for texture rendering where filtering can cause bleeding along the edges of the patch.
 * @param {Sampler2D} source where to copy from
 * @param {Number} sourceX where to start reading from, X coordinate
 * @param {Number} sourceY where to start reading from, X coordinate
 * @param {Number} destinationX where to start writing to, X coordinate
 * @param {Number} destinationY where to start writing to, X coordinate
 * @param {Number} width size of the patch that is to be copied
 * @param {Number} height size of the patch that is to be copied
 * @param {Number} marginLeft
 * @param {Number} marginRight
 * @param {Number} marginTop
 * @param {Number} marginBottom
 */
Sampler2D.prototype.copyWithMargin = function (source, sourceX, sourceY, destinationX, destinationY, width, height, marginLeft, marginRight, marginTop, marginBottom) {
    const dItemSize = this.itemSize;
    const sItemSize = source.itemSize;
    const _itemSize = Math.min(dItemSize, sItemSize);


    const dRowSize = dItemSize * this.width;
    const sRowSize = sItemSize * source.width;

    const sData = source.data;
    const dData = this.data;

    let x, y, i, j;

    let xMax, yMax;

    let dA, sA, dOffset, sOffset;
    //Write top-left corner
    sOffset = sourceY * sRowSize + sourceX * dItemSize;
    for (y = Math.max(0, destinationY - marginTop), yMax = destinationY; y < yMax; y++) {
        dA = y * dRowSize;

        for (x = Math.max(0, destinationX - marginLeft), xMax = destinationX; x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //Write top margin
    sA = sourceY * sRowSize;
    for (y = Math.max(0, destinationY - marginTop), yMax = destinationY; y < yMax; y++) {
        dA = y * dRowSize;

        for (x = 0; x < width; x++) {

            dOffset = dA + (x + destinationX) * dItemSize;
            sOffset = sA + (x + sourceX) * dItemSize;
            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //Write top-right corner
    sOffset = sourceY * sRowSize + (sourceX + width - 1) * dItemSize;
    for (y = Math.max(0, destinationY - marginTop), yMax = destinationY; y < yMax; y++) {
        dA = y * dRowSize;

        for (x = destinationX + width, xMax = Math.min(this.width, x + marginRight); x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //Write left margin
    for (y = 0; y < height; y++) {
        dA = (y + destinationY) * dRowSize;
        sA = (y + sourceY) * sRowSize;

        sOffset = sA + (sourceX) * dItemSize;

        for (x = Math.max(0, destinationX - marginLeft), xMax = destinationX; x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //write actual patch
    this.copy(source, sourceX, sourceY, destinationX, destinationY, width, height);

    //Write right margin
    for (y = 0; y < height; y++) {
        dA = (y + destinationY) * dRowSize;
        sA = (y + sourceY) * sRowSize;

        sOffset = sA + (sourceX + width - 1) * dItemSize;

        for (x = destinationX + width, xMax = Math.min(this.width, x + marginRight); x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }

    //Write Bottom-left margin
    sOffset = (sourceY + height - 1) * sRowSize + sourceX * dItemSize;
    for (y = destinationY + width, yMax = Math.min(this.height, y + marginBottom); y < yMax; y++) {
        dA = y * dRowSize;

        for (x = Math.max(0, destinationX - marginLeft), xMax = destinationX; x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //Write Bottom margin
    sA = (sourceY + height - 1) * sRowSize;
    for (y = destinationY + width, yMax = Math.min(this.height, y + marginBottom); y < yMax; y++) {
        dA = y * dRowSize;

        for (x = 0; x < width; x++) {

            dOffset = dA + (x + destinationX) * dItemSize;
            sOffset = sA + (x + sourceX) * dItemSize;
            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
    //Write Bottom-right margin
    sOffset = (sourceY + height - 1) * sRowSize + (sourceX + width - 1) * dItemSize;
    for (y = destinationY + width, yMax = Math.min(this.height, y + marginBottom); y < yMax; y++) {
        dA = y * dRowSize;

        for (x = destinationX + width, xMax = Math.min(this.width, x + marginRight); x < xMax; x++) {

            dOffset = dA + x * dItemSize;

            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
};

/**
 * Copy a patch from another sampler
 * @param {Sampler2D} source where to copy from
 * @param {Number} sourceX where to start reading from, X coordinate
 * @param {Number} sourceY where to start reading from, X coordinate
 * @param {Number} destinationX where to start writing to, X coordinate
 * @param {Number} destinationY where to start writing to, X coordinate
 * @param {Number} width size of the patch that is to be copied
 * @param {Number} height size of the patch that is to be copied
 */
Sampler2D.prototype.copy = function (source, sourceX, sourceY, destinationX, destinationY, width, height) {

    const _w = Math.min(width, source.width - sourceX, this.width - destinationX);
    const _h = Math.min(height, source.height - sourceY, this.height - destinationY);


    const dItemSize = this.itemSize;
    const sItemSize = source.itemSize;
    const _itemSize = Math.min(dItemSize, sItemSize);


    const dRowSize = dItemSize * this.width;
    const sRowSize = sItemSize * source.width;

    const sData = source.data;
    const dData = this.data;

    let x, y, i;

    for (y = 0; y < _h; y++) {
        const dA = (y + destinationY) * dRowSize;
        const sA = (y + sourceY) * sRowSize;
        for (x = 0; x < _w; x++) {
            const dOffset = dA + (x + destinationX) * dItemSize;
            const sOffset = sA + (x + sourceX) * sItemSize;
            for (i = 0; i < _itemSize; i++) {
                dData[dOffset + i] = sData[sOffset + i];
            }
        }
    }
};


/**
 * Copy a patch from another sampler with the same itemSize
 * @param {Sampler2D} source where to copy from
 * @param {Number} sourceX where to start reading from, X coordinate
 * @param {Number} sourceY where to start reading from, X coordinate
 * @param {Number} destinationX where to start writing to, X coordinate
 * @param {Number} destinationY where to start writing to, X coordinate
 * @param {Number} width size of the patch that is to be copied
 * @param {Number} height size of the patch that is to be copied
 */
Sampler2D.prototype.copy_sameItemSize = function (source, sourceX, sourceY, destinationX, destinationY, width, height) {
    const itemSize = this.itemSize;
    const sItemSize = source.itemSize;

    assert.equal(sItemSize, sItemSize, `source.itemSize(=${sItemSize}) != this.itemSize(=${itemSize})`);

    const _w = Math.min(width, source.width - sourceX, this.width - destinationX);
    const _h = Math.min(height, source.height - sourceY, this.height - destinationY);


    const dRowSize = itemSize * this.width;
    const sRowSize = itemSize * source.width;

    const sData = source.data;
    const dData = this.data;

    const patchRowSize = _w * itemSize;

    let y, i;

    for (y = 0; y < _h; y++) {
        const dA = (y + destinationY) * dRowSize;
        const sA = (y + sourceY) * sRowSize;

        const dOffset = dA + destinationX * itemSize;
        const sOffset = sA + sourceX * itemSize;

        for (i = 0; i < patchRowSize; i++) {

            dData[dOffset + i] = sData[sOffset + i];

        }
    }
};


/**
 *
 * @param {Vector4} source
 * @param {Vector4} destination
 * @param {Array} result
 */
function blendFunctionNormal(source, destination, result) {

    const a1 = source.w / 255;
    const a0 = destination.w / 255;

    result[0] = source.x * a1 + destination.x * (1 - a1);
    result[1] = source.y * a1 + destination.y * (1 - a1);
    result[2] = source.z * a1 + destination.z * (1 - a1);
    result[3] = (a1 + a0 * (1 - a1)) * 255;
}

/**
 * Assumes both samplers are uint8 with values 0-255
 * @param {Sampler2D} source
 * @param sourceX
 * @param sourceY
 * @param destinationX
 * @param destinationY
 * @param width
 * @param height
 * @param {BlendingType} blendMode
 */
Sampler2D.prototype.paint = function (source, sourceX, sourceY, destinationX, destinationY, width, height, blendMode) {
    let blendFunction;
    if (blendMode === BlendingType.Normal) {
        blendFunction = blendFunctionNormal;
    } else {
        throw new Error(`Unsupported blendType(=${blendMode})`);
    }

    const _w = Math.min(width, source.width - sourceX, this.width - destinationX);
    const _h = Math.min(height, source.height - sourceY, this.height - destinationY);


    const c0 = new Vector4(0, 0, 0, 255);
    const c1 = new Vector4(0, 0, 0, 255);

    const c3 = [];

    let x, y;

    for (y = 0; y < _h; y++) {
        for (x = 0; x < _w; x++) {
            this.get(x + destinationX, y + destinationY, c0);
            source.get(x + sourceY, y + sourceY, c1);

            blendFunction(c1, c0, c3);

            this.set(x, y, c3);

        }
    }


};

/**
 * Fill data values with zeros for a given area
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
Sampler2D.prototype.zeroFill = function (x, y, width, height) {

    const x0 = clamp(x, 0, this.width);
    const y0 = clamp(y, 0, this.height);
    const x1 = clamp(x + width, 0, this.width);
    const y1 = clamp(y + height, 0, this.height);

    const data = this.data;
    const itemSize = this.itemSize;

    const rowSize = itemSize * this.width;

    const clearRowOffset0 = x0 * itemSize;
    const clearRowOffset1 = x1 * itemSize;

    let _y;

    for (_y = y0; _y < y1; _y++) {

        const a = _y * rowSize;

        data.fill(0, a + clearRowOffset0, a + clearRowOffset1);

    }
};

/**
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 * @param {Array.<Number>} value
 */
Sampler2D.prototype.fill = function (x, y, width, height, value) {

    const x0 = clamp(x, 0, this.width);
    const y0 = clamp(y, 0, this.height);
    const x1 = clamp(x + width, 0, this.width);
    const y1 = clamp(y + height, 0, this.height);

    const data = this.data;
    const itemSize = this.itemSize;

    const rowSize = itemSize * this.width;

    let _y, _x, i;

    for (_y = y0; _y < y1; _y++) {

        const a = _y * rowSize;

        for (_x = x0; _x < x1; _x++) {

            const offset = a + _x * itemSize;

            for (i = 0; i < itemSize; i++) {

                data[offset + i] = value[i];

            }

        }
    }
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number[]} value
 */
Sampler2D.prototype.set = function (x, y, value) {
    const data = this.data;
    const itemSize = this.itemSize;

    const rowSize = itemSize * this.width;

    const offset = (rowSize * y) + x * itemSize;

    for (let i = 0; i < itemSize; i++) {
        data[offset + i] = value[i];
    }
};

/**
 * Traverses area inside a circle
 * NOTE: Based on palm3d answer on stack overflow: https://stackoverflow.com/questions/1201200/fast-algorithm-for-drawing-filled-circles
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {function(x:number,y:number, sampler:Sampler2D)} visitor
 */
Sampler2D.prototype.traverseCircle = function (centerX, centerY, radius, visitor) {
    let x, y;

    //convert offsets to integers for safety
    const offsetX = centerX | 0;
    const offsetY = centerY | 0;

    const r2 = radius * radius;

    const radiusCeil = Math.ceil(radius);

    for (y = -radiusCeil; y <= radiusCeil; y++) {
        const y2 = y * y;

        for (x = -radiusCeil; x <= radiusCeil; x++) {

            if (x * x + y2 <= r2) {
                visitor(offsetX + x, offsetY + y, this);
            }

        }
    }
};

function arrayConstructorByInstance(a) {
    if (a instanceof Int8Array) {
        return Int8Array;
    } else if (a instanceof Int16Array) {
        return Int16Array;
    } else if (a instanceof Int32Array) {
        return Int32Array;
    } else if (a instanceof Uint8Array) {
        return Uint8Array;
    } else if (a instanceof Uint16Array) {
        return Uint16Array;
    } else if (a instanceof Uint32Array) {
        return Uint32Array;
    } else if (a instanceof Float32Array) {
        return Float32Array;
    } else if (a instanceof Float64Array) {
        return Float64Array;
    } else if (Array.isArray(a)) {
        return Array;
    } else {
        throw new TypeError(`Unsupported array type`);
    }
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {boolean} [preserveData=true]
 */
Sampler2D.prototype.resize = function (x, y, preserveData = true) {

    const itemSize = this.itemSize;
    const length = x * y * itemSize;

    const oldData = this.data;

    const Constructor = arrayConstructorByInstance(oldData);

    const newData = new Constructor(length);

    if (preserveData) {
        //copy old data
        if (x === this.width) {
            // number of columns is preserved, we can just copy the old data across
            newData.set(oldData.subarray(0, Math.min(oldData.length, length)));
        } else {
            //we need to copy new data row-by-row
            const rowCount = min2(y, this.height);

            const columnCount = min2(x, this.width);

            for (let i = 0; i < rowCount; i++) {
                for (let j = 0; j < columnCount; j++) {

                    const targetItemAddress = (i * x + j) * itemSize;
                    const sourceItemAddress = (i * this.width + j) * itemSize;

                    for (let k = 0; k < itemSize; k++) {

                        newData[targetItemAddress + k] = oldData[sourceItemAddress + k];

                    }
                }
            }
        }
    }

    this.width = x;
    this.height = y;
    this.data = newData;

    //Re-initialization is necessary to re-create getters and setters
    this.initialize();
};


/**
 *
 * @param {BinaryBuffer} buffer
 */
Sampler2D.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeUint16(this.width);
    buffer.writeUint16(this.height);

    buffer.writeUint8(this.itemSize);

    if (this.data instanceof Uint8Array) {
        //data type
        buffer.writeUint8(0);


        buffer.writeBytes(this.data);

    } else {
        throw new TypeError(`Unsupported data type`);
    }
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Sampler2D.prototype.fromBinaryBuffer = function (buffer) {
    this.width = buffer.readUint16();
    this.height = buffer.readUint16();

    this.itemSize = buffer.readUint8();

    const dataType = buffer.readUint8();

    if (dataType === 0) {

        const numBytes = this.height * this.width * this.itemSize;
        this.data = new Uint8Array(numBytes);

        buffer.readBytes(this.data, 0, numBytes);

    } else {
        throw new TypeError(`Unsupported data type (${dataType})`);
    }
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {function(x:number, y:number, value:number, index:number):boolean?} visitor
 * @param {*} [thisArg]
 */
Sampler2D.prototype.traverseOrthogonalNeighbours = function (x, y, visitor, thisArg) {
    const width = this.width;
    const height = this.height;

    const index = this.point2index(x, y);

    let i = 0;
    const data = this.data;
    if (x > 0) {
        i = index - 1;
        visitor.call(thisArg, x - 1, y, data[i], i);
    }
    if (x < width - 1) {
        i = index + 1;
        visitor.call(thisArg, x + 1, y, data[i], i);
    }
    if (y > 0) {
        i = index - width;
        visitor.call(thisArg, x, y - 1, data[i], i);
    }
    if (y < height - 1) {
        i = index + width;
        visitor.call(thisArg, x, y + 1, data[i], i);
    }
};

/**
 *
 * @param {Sampler2D} sampler0
 * @param {Sampler2D} sampler1
 * @returns {Sampler2D}
 */
export function differenceSampler(sampler0, sampler1) {
    let v0 = new Vector4();
    let v1 = new Vector4();
    //
    const width = sampler0.width;
    const height = sampler0.height;
    //
    const difference = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            v0 = sampler0.get(x, y, v0);
            v1 = sampler1.get(x, y, v1);
            v0.normalize();
            v1.normalize();
            //check distance
            difference[x + y * width] = 1 - v0.dot(v1);
        }
    }
    //
    const sampleD = new Sampler2D(difference, 1, width, height);
    return sampleD;
}
