/**
 * @author Alex Goldring
 * @copyright Alex Goldring 2015
 */

import Signal from "../events/signal/Signal.js";
import { computeHashFloat, EPSILON, epsilonEquals, lerp, sign } from '../math/MathUtils';
import { assert } from "../assert.js";
import { clamp } from "../math/MathUtils.js";

class Vector3 {
    /**
     *
     * @param {number} [x=0]
     * @param {number} [y=0]
     * @param {number} [z=0]
     * @constructor
     */
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.onChanged = new Signal();
        /**
         * @readonly
         * @type {boolean}
         */
        this.isVector3 = true;
    }

    /**
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {Vector3}
     */
    set(x, y, z) {
        assert.equal(typeof x, "number", `X must be of type "number", instead was "${typeof x}"`);
        assert.equal(typeof y, "number", `Y must be of type "number", instead was "${typeof y}"`);
        assert.equal(typeof z, "number", `Z must be of type "number", instead was "${typeof z}"`);

        assert.ok(!Number.isNaN(x), `X must be a valid number, instead was NaN`);
        assert.ok(!Number.isNaN(y), `Y must be a valid number, instead was NaN`);
        assert.ok(!Number.isNaN(z), `Z must be a valid number, instead was NaN`);

        const oldX = this.x;
        const oldY = this.y;
        const oldZ = this.z;
        if (x !== oldX || y !== oldY || z !== oldZ) {
            this.x = x;
            this.y = y;
            this.z = z;

            if (this.onChanged.hasHandlers()) {
                this.onChanged.dispatch(x, y, z, oldX, oldY, oldZ);
            }
        }
        return this;
    }

    /**
     *
     * @param {number} v
     */
    setScalar(v) {
        this.set(v, v, v);
    }

    /**
     *
     * @param {number} v
     * @returns {Vector3}
     */
    setX(v) {
        return this.set(v, this.y, this.z);
    }

    /**
     *
     * @param {number} v
     * @returns {Vector3}
     */
    setY(v) {
        return this.set(this.x, v, this.z);
    }

    /**
     *
     * @param {number} v
     * @returns {Vector3}
     */
    setZ(v) {
        return this.set(this.x, this.y, v);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {Vector3}
     */
    setXY(x, y) {
        return this.set(x, y, this.z);
    }

    /**
     *
     * @param {number} x
     * @param {number} z
     * @returns {Vector3}
     */
    setXZ(x, z) {
        return this.set(x, this.y, z);
    }

    /**
     *
     * @param {number} y
     * @param {number} z
     * @returns {Vector3}
     */
    setYZ(y, z) {
        return this.set(this.x, y, z);
    }

    /**
     *
     * @param {Vector3} other
     * @returns {Vector3}
     */
    add(other) {
        return this._add(other.x, other.y, other.z);
    }

    /**
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {Vector3}
     */
    _add(x, y, z) {
        return this.set(this.x + x, this.y + y, this.z + z);
    }

    /**
     *
     * @param {Vector3} other
     * @returns {Vector3}
     */
    sub(other) {
        return this._sub(other.x, other.y, other.z);
    }

    /**
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {Vector3}
     */
    _sub(x, y, z) {
        return this.set(this.x - x, this.y - y, this.z - z);
    }

    /**
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @returns {Vector3}
     */
    _multiply(x, y, z) {
        return this.set(this.x * x, this.y * y, this.z * z);
    }

    /**
     *
     * @param {Vector3} other
     * @returns {Vector3}
     */
    multiply(other) {
        return this._multiply(other.x, other.y, other.z);
    }

    /**
     *
     * @param {Vector3} a
     * @param {Vector3} b
     */
    multiplyVectors(a, b) {
        this.set(
            a.x * b.x,
            a.y * b.y,
            a.z * b.z
        );
    }

    /**
     * Subtract scalar value from each component of the vector
     * @param {number} val
     * @returns {Vector3}
     */
    subScalar(val) {
        return this.set(this.x - val, this.y - val, this.z - val);
    }

    /**
     * Add a scalar value to each component of the vector
     * @param {number} val
     * @returns {Vector3}
     */
    addScalar(val) {
        return this.set(this.x + val, this.y + val, this.z + val);
    }

    /**
     *
     * @returns {Vector3}
     */
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    /**
     *
     * @param {number} val
     * @returns {Vector3}
     */
    multiplyScalar(val) {
        assert.equal(typeof val, "number", `Input scalar must be of type "number", instead was "${typeof val}"`);
        assert.ok(!Number.isNaN(val), `Input scalar must be a valid number, instead was NaN`);

        return this.set(this.x * val, this.y * val, this.z * val);
    }

    /**
     *
     * @returns {boolean}
     */
    isZero() {
        return this.x === 0 && this.y === 0 && this.z === 0;
    }

    /**
     * Compute cross-product of two vectors. Result is written to this vector.
     * @param {Vector3} other
     * @returns {Vector3}
     */
    cross(other) {
        this.crossVectors(this, other);

        return this;
    }

    crossVectors(first, second) {
        const ax = first.x, ay = first.y, az = first.z;
        const bx = second.x, by = second.y, bz = second.z;

        const x = ay * bz - az * by;
        const y = az * bx - ax * bz;
        const z = ax * by - ay * bx;

        this.set(x, y, z);
    }

    /**
     * Sets all components of the vector to absolute value (positive)
     * @returns {Vector3}
     */
    abs() {
        return this.set(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
    }

    /**
     *
     * @param {Vector3} v
     * @returns {number}
     */
    dot(v) {
        return Vector3.dot(this, v);
    }

    /**
     * Computes length(magnitude) of the vector
     * @returns {number}
     */
    length() {
        return v3Length(this);
    }

    /**
     * Computes squared length(magnitude) of the vector.
     * Note: this operation is faster than computing length, because it doesn't involve computing square root
     * @returns {number}
     */
    lengthSqr() {
        return v3LengthSqr_i(this.x, this.y, this.z);
    }

    /**
     * Normalizes the vector, preserving its direction, but making magnitude equal to 1
     */
    normalize() {
        const l = this.length();

        if (l === 0) {
            //special case, can't normalize 0 length vector
            return;
        }

        const m = 1 / l;

        this.multiplyScalar(m);
    }

    /**
     * @param {number} [squaredError=0.01]
     * @return {boolean}
     */
    isNormalized(squaredError = 0.01) {
        const lengthSq = this.lengthSqr();

        return (lengthSq + squaredError) >= 1 && (lengthSq - squaredError) <= 1;
    }

    /**
     *
     * @param {Vector3} other
     * @returns {Vector3}
     */
    copy(other) {
        return this.set(other.x, other.y, other.z);
    }

    /**
     *
     * @param {Vector3} other
     * @returns {number}
     */
    distanceTo(other) {
        return Math.sqrt(this.distanceToSquared(other));
    }

    /**
     * Negates every component of the vector making it {-x, -y, -z}
     * @returns {Vector3}
     */
    negate() {
        return this.set(-this.x, -this.y, -this.z);
    }

    /**
     * Squared distance between this vector and another. It is faster than computing real distance because no SQRT operation is needed.
     * @param {Vector3} other
     * returns {number}
     */
    distanceSqrTo(other) {
        return v3LengthSqr_i(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    distanceToSquared(other) {
        return v3LengthSqr_i(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    /**
     * Angle between two vectors (co-planar) in radians
     * @param {Vector3} other
     * @returns {number}
     */
    angleTo(other) {
        return v3_angleBetween(this.x, this.y, this.z, other.x, other.y, other.z);
    }

    /**
     *
     * @param {Quaternion} q
     * @returns {Vector3}
     */
    applyQuaternion(q) {
        //transform point into quaternion

        var x = this.x, y = this.y, z = this.z;
        var qx = q.x, qy = q.y, qz = q.z, qw = q.w;

        // calculate quat * vector

        var ix = qw * x + qy * z - qz * y;
        var iy = qw * y + qz * x - qx * z;
        var iz = qw * z + qx * y - qy * x;
        var iw = -qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        const _x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        const _y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        const _z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

        this.set(_x, _y, _z);
    }

    /**
     * Set components X,Y,Z to values 1,0 or -1 based on the sign of their original value.
     * @example new Vector(5,0,-10).sign().equals(new Vector(1,0,-1)); //true
     * @returns {Vector3}
     */
    sign() {
        return this.set(sign(this.x), sign(this.y), sign(this.z));
    }

    /**
     * Linear interpolation
     * @param {Vector3} other
     * @param {Number} fraction between 0 and 1
     * @returns {Vector3}
     */
    lerp(other, fraction) {
        const x = lerp(this.x, other.x, fraction);
        const y = lerp(this.y, other.y, fraction);
        const z = lerp(this.z, other.z, fraction);

        return this.set(x, y, z);
    }

    /**
     *
     * @param {Vector3} a
     * @param {Vector3} b
     * @param {number} fraction
     */
    lerpVectors(a, b, fraction) {
        v3Lerp(this, a, b, fraction);
    }

    applyMatrix4_three(matrix4) {

        const x = this.x, y = this.y, z = this.z;
        const e = matrix4.elements;

        const _x = e[0] * x + e[4] * y + e[8] * z + e[12];
        const _y = e[1] * x + e[5] * y + e[9] * z + e[13];
        const _z = e[2] * x + e[6] * y + e[10] * z + e[14];

        return this.set(_x, _y, _z);
    }

    /**
     *
     * @param {Vector3} other
     * @returns {boolean}
     */
    equals(other) {
        return this._equals(other.x, other.y, other.z);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @return {boolean}
     */
    _equals(x, y, z) {
        return this.x === x && this.y === y && this.z === z;
    }

    /**
     *
     * @param {Vector3} other
     * @param {number} [tolerance]
     * @return {boolean}
     */
    roughlyEquals(other, tolerance) {
        return this._roughlyEquals(other.x, other.y, other.z, tolerance);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} [tolerance] acceptable deviation
     * @return {boolean}
     */
    _roughlyEquals(x, y, z, tolerance = EPSILON) {
        return epsilonEquals(this.x, x, tolerance) && epsilonEquals(this.y, y, tolerance) && epsilonEquals(this.z, z, tolerance);
    }

    /**
     *
     * @param {function} processor
     * @returns {Vector3}
     */
    process(processor) {
        processor(this.x, this.y, this.z);
        this.onChanged.add(processor);
        return this;
    }

    toJSON() {
        return { x: this.x, y: this.y, z: this.z };
    }

    fromJSON(json) {
        this.copy(json);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        buffer.writeFloat64(this.x);
        buffer.writeFloat64(this.y);
        buffer.writeFloat64(this.z);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        const x = buffer.readFloat64();
        const y = buffer.readFloat64();
        const z = buffer.readFloat64();

        this.set(x, y, z);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBufferFloat32(buffer) {
        buffer.writeFloat32(this.x);
        buffer.writeFloat32(this.y);
        buffer.writeFloat32(this.z);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBufferFloat32(buffer) {
        const x = buffer.readFloat32();
        const y = buffer.readFloat32();
        const z = buffer.readFloat32();

        this.set(x, y, z);
    }

    hash() {
        let hash = computeHashFloat(this.x);

        hash = ((hash << 5) - hash) + computeHashFloat(this.y);

        hash = ((hash << 5) - hash) + computeHashFloat(this.z);

        return hash;
    }

    /**
     * Dot product
     * @param {Vector3|Vector4} a
     * @param {Vector3|Vector4} b
     * @returns {number}
     */
    static dot(a, b) {
        return Vector3._dot(a.x, a.y, a.z, b.x, b.y, b.z);
    }

    /**
     *
     * @param {Vector3} a
     * @param {Vector3} b
     * @returns {number}
     */
    static distance(a, b) {
        return v3Length_i(a.x - b.x, a.y - b.y, a.z - b.z);
    }
}

/**
 * @readonly
 * @type {Vector3}
 */
Vector3.zero = Object.freeze(new Vector3(0, 0, 0));

/**
 * Useful for setting scale
 * @readonly
 * @type {Vector3}
 */
Vector3.one = Object.freeze(new Vector3(1, 1, 1));

/**
 * @readonly
 * @type {Vector3}
 */
Vector3.up = Object.freeze(new Vector3(0, 1, 0));

/**
 * @readonly
 * @type {Vector3}
 */
Vector3.down = Object.freeze(new Vector3(0, -1, 0));

/**
 * @readonly
 * @type {Vector3}
 */
Vector3.left = Object.freeze(new Vector3(-1, 0, 0));

/**
 * @readonly
 * @type {Vector3}
 */
Vector3.right = Object.freeze(new Vector3(1, 0, 0));

/**
 * @readonly
 * @type {Vector3}
 */
Vector3.forward = Object.freeze(new Vector3(0, 0, 1));

/**
 * @readonly
 * @type {Vector3}
 */
Vector3.back = Object.freeze(new Vector3(0, 0, -1));

Vector3.typeName = "Vector3";


/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @returns {number}
 */
export function v3_dot(x0, y0, z0, x1, y1, z1) {
    return (x0 * x1 + y0 * y1 + z0 * z1);
}

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @returns {number}
 */
Vector3._dot = v3_dot;


function v3Length(v) {
    return v3Length_i(v.x, v.y, v.z);
}

export function v3Length_i(x, y, z) {
    return Math.sqrt(v3LengthSqr_i(x, y, z));
}

function v3LengthSqr_i(x, y, z) {
    return x * x + y * y + z * z;
}


/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @returns {number}
 */
export function v3_angleBetween(x0, y0, z0, x1, y1, z1) {
    const d = v3_dot(x0, y0, z0, x1, y1, z1);
    const l = v3Length_i(x0, y0, z0) * v3Length_i(x1, y1, z1);

    const theta = clamp(d / l, -1, 1);

    return Math.acos(theta);
}

/**
 *
 * @param {Vector3} result
 * @param {Vector3} a
 * @param {Vector3} b
 * @param {number} fraction
 */
function v3Lerp(result, a, b, fraction) {

    const x = lerp(a.x, b.x, fraction);
    const y = lerp(a.y, b.y, fraction);
    const z = lerp(a.z, b.z, fraction);

    result.set(x, y, z);
}

export default Vector3;
