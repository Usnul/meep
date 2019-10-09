import Vector2 from '../../core/geom/Vector2';
import BinaryHeap from './BinaryHeap';
import AStar from './AStar';
import { clamp } from "../../core/math/MathUtils";
import { assert } from "../../core/assert.js";

const blockValue = 255;

/**
 *
 * @param {Number} width
 * @param {Number} height
 * @constructor
 *
 * @property {Number} width
 * @property {Number} height
 * @property {Uint8Array} data
 */
function GridField(width, height) {
    this.width = width;
    this.height = height;
    this.data = null;

    if (height !== 0 && height !== 0) {
        const byteSize = height * width;
        this.data = new Uint8Array(byteSize);
    }

    const self = this;

    Object.defineProperties(this, {
        raw: {
            set: function (val) {
                console.warn("Deprecated, use .data accessor instead");
                self.data = val;
            },
            get: function () {
                console.warn("Deprecated, use .data accessor instead");
                return self.data;
            }
        }
    });
}

/**
 *
 * @param {Number} value
 */
GridField.prototype.fill = function (value) {
    this.data.fill(value);
};

/**
 *
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} x1
 * @param {Number} y1
 * @param {function(x:Number,y:Number,value:Number)} callback
 */
GridField.prototype.rectTraverse = function (x0, y0, x1, y1, callback) {
    const width = this.width;
    const height = this.height;

    let x, y;

    x0 = clamp(x0, 0, width - 1);
    y0 = clamp(y0, 0, height - 1);
    x1 = clamp(x1, x0, width - 1);
    y1 = clamp(y1, y0, height - 1);

    for (x = x0; x <= x1; x++) {
        for (y = y0; y <= y1; y++) {
            const index = this.point2index(x, y);
            const value = this.data[index];
            callback(x, y, value);
        }
    }
};

/**
 *
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} value
 */
GridField.prototype.rectSet = function (x0, y0, x1, y1, value) {
    let x, y;
    for (x = x0; x <= x1; x++) {
        for (y = y0; y <= y1; y++) {
            this.pointSet(x, y, value);
        }
    }
};

/**
 *
 * @param {Vector2} pos
 */
GridField.prototype.snapToNearestFreeCell = function (pos) {
    const self = this;
    const p = new Vector2().copy(pos).floor();
    const target = p.clone();
    const closed = [];

    function score(index) {
        self.index2point(index, p);
        return p.distanceSqrTo(target);
    }

    const open = new BinaryHeap(score);
    let current = this.point2index(p.x, p.y);
    open.push(current);
    const neighbors = [];
    while (open.size() > 0) {
        current = open.pop();
        closed[current] = true;
        if (this.data[current] !== blockValue) {
            break;
        }
        //add neighbours
        neighbors.length = 0; //reset
        this.calcNeighbors(current, neighbors);
        const numNeighbors = neighbors.length;
        for (let i = 0; i < numNeighbors; i++) {
            const n = neighbors[i];
            if (closed[n] !== void 0) {
                continue;
            }
            open.push(n);
        }
    }
    this.index2point(current, pos);
};

/**
 *
 * @param {Number} index
 * @param {function(index:Number, x:Number, y:Number)} visitor
 */
GridField.prototype.traverseNeighbors = function traverseNeighbors(index, visitor) {
    const width = this.width;
    const height = this.height;

    const x = index % width;
    const y = (index / width) | 0;

    if (x > 0) {
        visitor(index - 1, x, y);
    }
    if (x < width - 1) {
        visitor(index + 1, x, y);
    }
    if (y > 0) {
        visitor(index - width, x, y);
    }
    if (y < height - 1) {
        visitor(index + width, x, y);
    }
};

/**
 *
 * @param {Number} x
 * @param {Number} y
 * @returns {Number}
 */
GridField.prototype.read = function (x, y) {
    const index = this.point2index(x, y);
    return this.data[index];
};

/**
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} value
 */
GridField.prototype.pointAdd = function (x, y, value) {
    const index = this.point2index(x, y);
    this.data[index] += value;
};

/**
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} value
 */
GridField.prototype.pointSet = function (x, y, value) {
    const index = this.point2index(x, y);
    this.data[index] = value;
};


/**
 *
 * @param {Number} x
 * @param {Number} y
 * @returns {Number}
 */
GridField.prototype.point2index = function (x, y) {
    return x + y * this.width;
};

/**
 * Paints with additive brush
 * @param {Array.<Number>} bendPointIndexList
 * @param {Number} value
 */
GridField.prototype.pathAdd = function pathAdd(bendPointIndexList, value) {
    const indices = bendPointIndexList;
    const length = indices.length;

    //
    if (length > 0) {
        const pCurrent = new Vector2();
        const pTarget = new Vector2();
        let dx, dy;
        this.index2point(indices[0], pCurrent);
        this.pointAdd(pCurrent.x, pCurrent.y, value);
        for (let i = 1; i < length; i++) {
            this.index2point(indices[i], pTarget);
            dx = pTarget.x - pCurrent.x;
            dy = pTarget.y - pCurrent.y;
            if (dx !== 0) {
                //drop values to multiple of 1
                dx /= Math.abs(dx);
                while (pCurrent.x !== pTarget.x) {
                    pCurrent.x += dx;
                    this.pointAdd(pCurrent.x, pCurrent.y, value);
                }
            }
            if (dy !== 0) {
                //drop values to multiple of 1
                dy /= Math.abs(dy);
                while (pCurrent.y !== pTarget.y) {
                    pCurrent.y += dy;
                    this.pointAdd(pCurrent.x, pCurrent.y, value);
                }
            }
        }
    }
};

/**
 *
 * @param {Number} index
 * @param {Vector2} point
 */
GridField.prototype.index2point = function (index, point) {
    const width = this.width;

    point.set(index % width, Math.floor(index / width));
};

/**
 *
 * @param {Number} index
 * @param {Array.<Number>} result
 */
GridField.prototype.calcNeighbors = function (index, result) {
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
 * @param {Number} index1
 * @param {Number} index2
 * @returns {Number}
 */
GridField.prototype.manhattanDistanceByIndices = function (index1, index2) {
    const width = this.width;

    const x1 = index1 % width;
    const y1 = Math.floor(index1 / width);
    //
    const x2 = index2 % width;
    const y2 = Math.floor(index2 / width);
    //
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return dx + dy;
};

/**
 *
 * @param {Vector2} start
 * @param {Vector2} goal
 * @param {Number} crossingPenalty
 * @param {Number} bendPenalty
 * @returns {Number[]} path of indices
 */
GridField.prototype.findPath = function (start, goal, crossingPenalty, bendPenalty) {
    assert.notEqual(start,null,'start is null');
    assert.notEqual(start,undefined,'start is undefined');

    assert.notEqual(goal,null,'goal is null');
    assert.notEqual(goal,undefined,'goal is undefined');

    return AStar(this, this.width, this.height, start, goal, crossingPenalty, bendPenalty);
};

export default GridField;