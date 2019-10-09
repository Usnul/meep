/**
 * @author Alex Goldring
 * @copyright Alex Goldring 14/02/14.
 */

import Signal from '../events/signal/Signal.js';
import { clamp, lerp } from "../math/MathUtils";
import { assert } from "../assert.js";
import { max2, min2 } from "../math/MathUtils.js";

/**
 *
 * @param {number} [x=0
 * @param {number} [y=0]
 * @property {number} x
 * @property {number} y
 * @constructor
 */
function Vector2(x = 0, y = 0) {
    assert.equal(typeof x, "number", `X must be of type "number", instead was "${typeof x}"`);
    assert.equal(typeof y, "number", `Y must be of type "number", instead was "${typeof y}"`);

    assert.ok(!Number.isNaN(x), `X must be a valid number, instead was NaN`);
    assert.ok(!Number.isNaN(y), `Y must be a valid number, instead was NaN`);

    /**
     *
     * @type {number}
     */
    this.x = x;

    /**
     *
     * @type {number}
     */
    this.y = y;

    this.onChanged = new Signal();
}

/**
 * @readonly
 * @type {Vector2}
 */
Vector2.up = Object.freeze(new Vector2(0, 1));

/**
 * @readonly
 * @type {Vector2}
 */
Vector2.down = Object.freeze(new Vector2(0, -1));

/**
 * @readonly
 * @type {Vector2}
 */
Vector2.left = Object.freeze(new Vector2(-1, 0));

/**
 * @readonly
 * @type {Vector2}
 */
Vector2.right = Object.freeze(new Vector2(1, 0));

/**
 * @readonly
 * @type {Vector2}
 */
Vector2.zero = Object.freeze(new Vector2(0, 0));

/**
 * @readonly
 * @type {boolean}
 */
Vector2.prototype.isVector2 = true;

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {Vector2}
 */
Vector2.prototype.set = function (x, y) {
    assert.equal(typeof x, "number", `X must be of type "number", instead was "${typeof x}"`);
    assert.equal(typeof y, "number", `Y must be of type "number", instead was "${typeof y}"`);

    assert.ok(!Number.isNaN(x), `X must be a valid number, instead was NaN`);
    assert.ok(!Number.isNaN(y), `Y must be a valid number, instead was NaN`);

    const oldX = this.x;
    const oldY = this.y;

    if (oldX !== x || oldY !== y) {
        this.x = x;
        this.y = y;

        if (this.onChanged.hasHandlers()) {
            this.onChanged.send4(x, y, oldX, oldY);
        }
    }
    return this;
};

/**
 *
 * @param {number} x
 * @returns {Vector2}
 */
Vector2.prototype.setX = function (x) {
    return this.set(x, this.y);
};

/**
 *
 * @param {number} y
 * @returns {Vector2}
 */
Vector2.prototype.setY = function (y) {
    return this.set(this.x, y);
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {Vector2}
 */
Vector2.prototype._sub = function (x, y) {
    return this.set(this.x - x, this.y - y);
};

/**
 *
 * @param {Vector2} other
 * @returns {Vector2}
 */
Vector2.prototype.sub = function (other) {
    return this._sub(other.x, other.y);
};

/**
 * performs Math.floor operation on x and y
 * @returns {Vector2}
 */
Vector2.prototype.floor = function () {
    return this.set(Math.floor(this.x), Math.floor(this.y));
};

/**
 * performs Math.ceil operation on x and y
 * @returns {Vector2}
 */
Vector2.prototype.ceil = function () {
    return this.set(Math.ceil(this.x), Math.ceil(this.y));
};

/**
 * performs Math.abs operation on x and y
 * @returns {Vector2}
 */
Vector2.prototype.abs = function () {
    return this.set(Math.abs(this.x), Math.abs(this.y));
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {Vector2}
 */
Vector2.prototype._mod = function (x, y) {
    return this.set(this.x % x, this.y % y);
};

/**
 *
 * @param {Vector2} other
 * @returns {Vector2}
 */
Vector2.prototype.mod = function (other) {
    return this._mod(other.x, other.y);
};

/**
 *
 * @param {Vector2} other
 * @returns {Vector2}
 */
Vector2.prototype.divide = function (other) {
    return this.set(this.x / other.x, this.y / other.y);
};

/**
 *
 * @param {Vector2} other
 * @returns {Vector2}
 */
Vector2.prototype.multiply = function (other) {
    return this._multiply(other.x, other.y);
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {Vector2}
 */
Vector2.prototype._multiply = function (x, y) {
    return this.set(this.x * x, this.y * y);
};

/**
 *
 * @param {Vector2} other
 * @returns {Vector2}
 */
Vector2.prototype.max = function (other) {
    const x = max2(this.x, other.x);
    const y = max2(this.y, other.y);
    return this.set(x, y);
};


/**
 *
 * @param {Vector2} other
 * @returns {Vector2}
 */
Vector2.prototype.copy = function (other) {
    return this.set(other.x, other.y);
};

/**
 *
 * @returns {Vector2}
 */
Vector2.prototype.clone = function () {
    return new Vector2(this.x, this.y);
};

/**
 *
 * @returns {Vector2}
 */
Vector2.prototype.negate = function () {
    return this.set(-this.x, -this.y);
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {Vector2}
 */
Vector2.prototype._add = function (x, y) {
    return this.set(this.x + x, this.y + y);
};
/**
 *
 * @param {Vector2} other
 * @returns {Vector2}
 */
Vector2.prototype.add = function (other) {
    return this._add(other.x, other.y);
};
/**
 *
 * @param {Number} val
 */
Vector2.prototype.addScalar = function (val) {
    return this._add(val, val);
};

/**
 *
 * @param {number} val
 */
Vector2.prototype.setScalar = function (val) {
    this.set(val, val);
};

/**
 *
 * @param {number} val
 */
Vector2.prototype.divideScalar = function (val) {
    this.multiplyScalar(1 / val);
};

/**
 *
 * @param {Number} val
 * @returns {Vector2}
 */
Vector2.prototype.multiplyScalar = function (val) {
    assert.equal(typeof val, "number", `Input scalar must be of type "number", instead was "${typeof val}"`);
    assert.ok(!Number.isNaN(val), `Input scalar must be a valid number, instead was NaN`);

    return this.set(this.x * val, this.y * val);
};

Vector2.prototype.toJSON = function () {
    return { x: this.x, y: this.y };
};

Vector2.prototype.fromJSON = function (obj) {
    this.set(obj.x, obj.y);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Vector2.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeFloat64(this.x);
    buffer.writeFloat64(this.y);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Vector2.prototype.fromBinaryBuffer = function (buffer) {
    const x = buffer.readFloat64();
    const y = buffer.readFloat64();

    this.set(x, y);
};
/**
 *
 * @param {BinaryBuffer} buffer
 */
Vector2.prototype.toBinaryBufferFloat32 = function (buffer) {
    buffer.writeFloat32(this.x);
    buffer.writeFloat32(this.y);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Vector2.prototype.fromBinaryBufferFloat32 = function (buffer) {
    const x = buffer.readFloat32();
    const y = buffer.readFloat32();

    this.set(x, y);
};

/**
 *
 * @returns {boolean}
 */
Vector2.prototype.isZero = function () {
    return this.x === 0 && this.y === 0;
};


/**
 *
 * @param {Number} minX
 * @param {Number} minY
 * @param {Number} maxX
 * @param {Number} maxY
 */
Vector2.prototype.clamp = function (minX, minY, maxX, maxY) {
    const x = clamp(this.x, minX, maxX);
    const y = clamp(this.y, minY, maxY);
    return this.set(x, y);
};

/**
 *
 * @param {Number} lowX
 * @param {Number} lowY
 */
Vector2.prototype.clampLow = function (lowX, lowY) {
    const x = max2(this.x, lowX);
    const y = max2(this.y, lowY);
    return this.set(x, y);
};

/**
 *
 * @param {Number} highX
 * @param {Number} highY
 */
Vector2.prototype.clampHigh = function (highX, highY) {
    const x = min2(this.x, highX);
    const y = min2(this.y, highY);
    return this.set(x, y);
};

/**
 *
 * @param {Vector2} other
 * @returns {number}
 */
Vector2.prototype.distanceSqrTo = function (other) {
    return this._distanceSqrTo(other.x, other.y);
};

/**
 *
 * @param {Vector2} result
 * @param {Vector2} a
 * @param {Vector2} b
 * @param {number} fraction
 */
function v2Lerp(result, a, b, fraction) {

    const x = lerp(a.x, b.x, fraction);
    const y = lerp(a.y, b.y, fraction);

    result.set(x, y);
}

/**
 *
 * @param {Vector2} a
 * @param {Vector2} b
 * @param {number} fraction
 */
Vector2.prototype.lerpVectors = function (a, b, fraction) {
    v2Lerp(this, a, b, fraction);
};


/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @returns {number}
 */
export function v2_dot(x0, y0, x1, y1) {
    assert.typeOf(x0, 'number', 'x0');
    assert.typeOf(y0, 'number', 'y0');
    assert.typeOf(x1, 'number', 'x1');
    assert.typeOf(y1, 'number', 'y1');

    return (x0 * x1 + y0 * y1);
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function magnitudeSqr(x, y) {
    return x * x + y * y;
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function v2_magnitude(x, y) {
    return Math.sqrt(magnitudeSqr(x, y));
}

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @returns {number}
 */
export function v2_distance(x0, y0, x1, y1) {

    assert.typeOf(x0, 'number', 'x0');
    assert.typeOf(y0, 'number', 'y0');
    assert.typeOf(x1, 'number', 'x1');
    assert.typeOf(y1, 'number', 'y1');

    return v2_magnitude(x1 - x0, y1 - y0);
}

Vector2._distance = v2_distance;

/**
 *
 * @param {Vector2} other
 * @returns {number}
 */
Vector2.prototype.distanceTo = function (other) {
    return this._distanceTo(other.x, other.y);
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
Vector2.prototype._distanceSqrTo = function (x, y) {
    const dx = this.x - x;
    const dy = this.y - y;
    return magnitudeSqr(dx, dy);
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
Vector2.prototype._distanceTo = function (x, y) {
    return Math.sqrt(this._distanceSqrTo(x, y));
};

/**
 *
 * @param {Vector2} other
 * @returns {number}
 */
Vector2.prototype.manhattanDistanceTo = function (other) {
    const dx = Math.abs(this.x - other.x);
    const dy = Math.abs(this.y - other.y);

    return dx + dy;
};

/**
 * @returns {number}
 */
Vector2.prototype.length = function () {
    return v2_magnitude(this.x, this.y);
};

/**
 *
 * @returns {number}
 */
Vector2.prototype.hashCode = function () {
    const x = this.x;
    const y = this.y;
    let hash = ((x << 5) - x) + y;
    hash |= 0; //convert to 32bit int
    return hash;
};

/**
 *
 * @param {function} processor
 * @returns {Vector2}
 */
Vector2.prototype.process = function (processor) {
    processor(this.x, this.y);
    this.onChanged.add(processor);
    return this;
};

Vector2.prototype.toString = function () {
    return `Vector2{x:${this.x}, y:${this.y}}`;
};

/**
 *
 * @param {Vector2} other
 * @returns {boolean}
 */
Vector2.prototype.equals = function (other) {
    return this.x === other.x && this.y === other.y;
};

export default Vector2;
