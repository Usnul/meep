/**
 * Created by Alex on 29/12/2015.
 */

import { lerp } from "../math/MathUtils";
import { assert } from "../assert.js";
import Signal from "../events/signal/Signal.js";
import Vector3 from "./Vector3.js";

/**
 *
 * @param {number[]} result
 * @param {number[]} input
 * @param {number[]} mat4
 */
export function v4_applyMatrix4(result, input, mat4) {
    const a0 = mat4[0];
    const a1 = mat4[1];
    const a2 = mat4[2];
    const a3 = mat4[3];

    const b0 = mat4[4];
    const b1 = mat4[5];
    const b2 = mat4[6];
    const b3 = mat4[7];

    const c0 = mat4[8];
    const c1 = mat4[9];
    const c2 = mat4[10];
    const c3 = mat4[11];

    const d0 = mat4[12];
    const d1 = mat4[13];
    const d2 = mat4[14];
    const d3 = mat4[15];

    const _x = input[0];
    const _y = input[1];
    const _z = input[2];
    const _w = input[3];

    const x = a0 * _x + b0 * _y + c0 * _z + d0 * _w;
    const y = a1 * _x + b1 * _y + c1 * _z + d1 * _w;
    const z = a2 * _x + b2 * _y + c2 * _z + d2 * _w;
    const w = a3 * _x + b3 * _y + c3 * _z + d3 * _w;

    result[0] = x;
    result[1] = y;
    result[2] = z;
    result[3] = w;
}

/**
 *
 * @param {Number} [x=0]
 * @param {Number} [y=0]
 * @param {Number} [z=0]
 * @param {Number} [w=0]
 * @constructor
 * @class
 */
function Vector4(x, y, z, w) {
    this.x = (typeof x === "number") ? x : 0;
    this.y = (typeof x === "number") ? y : 0;
    this.z = (typeof z === "number") ? z : 0;
    this.w = (typeof w === "number") ? w : 1;

    this.onChanged = new Signal();
}

/**
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @param {Number} w
 * @returns {Vector4}
 */
Vector4.prototype.set = function (x, y, z, w) {
    assert.equal(typeof x, "number", `X must be of type "number", instead was "${typeof x}"`);
    assert.equal(typeof y, "number", `Y must be of type "number", instead was "${typeof y}"`);
    assert.equal(typeof z, "number", `Z must be of type "number", instead was "${typeof z}"`);
    assert.equal(typeof w, "number", `W must be of type "number", instead was "${typeof w}"`);

    assert.ok(!Number.isNaN(x), `X must be a valid number, instead was NaN`);
    assert.ok(!Number.isNaN(y), `Y must be a valid number, instead was NaN`);
    assert.ok(!Number.isNaN(z), `Z must be a valid number, instead was NaN`);
    assert.ok(!Number.isNaN(w), `W must be a valid number, instead was NaN`);

    const _x = this.x;
    const _y = this.y;
    const _z = this.z;
    const _w = this.w;

    if (_x !== x || _y !== y || _z !== z || _w !== w) {

        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;

        if (this.onChanged.hasHandlers()) {
            this.onChanged.dispatch(x, y, z, w, _x, _y, _z, _w);
        }
    }

    return this;
};

/**
 *
 * @param {Vector3} v3
 */
Vector4.prototype.multiplyVector3 = function (v3) {
    const x = this.x * v3.x;
    const y = this.y * v3.y;
    const z = this.z * v3.z;

    this.set(x, y, z, this.w);
};

/**
 *
 * @param {Number} value
 * @returns {Vector4}
 */
Vector4.prototype.multiplyScalar = function (value) {
    assert.equal(typeof value, "number", `Input scalar must be of type "number", instead was "${typeof value}"`);
    assert.ok(!Number.isNaN(value), `Input scalar must be a valid number, instead was NaN`);

    return this.set(this.x * value, this.y * value, this.z * value, this.w * value);
};

/**
 *
 * @param {number} a0
 * @param {number} a1
 * @param {number} a2
 * @param {number} a3
 * @param {number} b0
 * @param {number} b1
 * @param {number} b2
 * @param {number} b3
 * @param {number} c0
 * @param {number} c1
 * @param {number} c2
 * @param {number} c3
 * @param {number} d0
 * @param {number} d1
 * @param {number} d2
 * @param {number} d3
 * @returns {Vector4} this
 */
Vector4.prototype._applyMatrix4 = function (
    a0, a1, a2, a3,
    b0, b1, b2, b3,
    c0, c1, c2, c3,
    d0, d1, d2, d3
) {

    const _x = this.x;
    const _y = this.y;
    const _z = this.z;
    const _w = this.w;

    const x = a0 * _x + b0 * _y + c0 * _z + d0 * _w;
    const y = a1 * _x + b1 * _y + c1 * _z + d1 * _w;
    const z = a2 * _x + b2 * _y + c2 * _z + d2 * _w;
    const w = a3 * _x + b3 * _y + c3 * _z + d3 * _w;

    return this.set(x, y, z, w);
};

/**
 *
 * @param {Vector4} other
 * @returns {number}
 */
Vector4.prototype.dot = function (other) {
    return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
};

/**
 * Add XYZ components from another vector
 * @param {Vector3|Vector4} v3
 * @returns {Vector4}
 */
Vector4.prototype.add3 = function (v3) {
    return this.set(this.x + v3.x, this.y + v3.y, this.z + v3.z, this.w);
};

/**
 *
 * @param {Matrix4} m
 * @returns {Vector4} this
 */
Vector4.prototype.threeApplyMatrix4 = function (m) {
    const e = m.elements;
    return this._applyMatrix4(
        e[0], e[1], e[2], e[3],
        e[4], e[5], e[6], e[7],
        e[8], e[9], e[10], e[11],
        e[12], e[13], e[14], e[15]
    );
};

/**
 *
 * @param {Vector4} vec4
 * @returns {Vector4}
 */
Vector4.prototype.copy = function (vec4) {
    return this.set(vec4.x, vec4.y, vec4.z, vec4.w);
};

/**
 *
 * @returns {Vector4}
 */
Vector4.prototype.clone = function () {
    const r = new Vector4();

    r.copy(this);

    return r;
};

/**
 *
 * @param {Quaternion} q
 */
Vector4.prototype.applyQuaternion = function (q) {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const w = this.w;

    const qx = q.x;
    const qy = q.y;
    const qz = q.z;
    const qw = q.w;

    // calculate quat * vec
    let ix = qw * x + qy * z - qz * y;
    let iy = qw * y + qz * x - qx * z;
    let iz = qw * z + qx * y - qy * x;
    let iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    const _x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    const _y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    const _z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    this.set(_x, _y, _z, w);
};

/**
 *
 * @param {Vector4} vec4
 * @returns {boolean}
 */
Vector4.prototype.equals = function (vec4) {
    return this.x === vec4.x && this.y === vec4.y && this.z === vec4.z && this.w === vec4.w;
};

/**
 *
 * @param {Vector4} v0
 * @param {Vector4} v1
 * @param {Number} f interpolation fraction
 * @param {Vector4} result
 */
Vector4.lerp = function (v0, v1, f, result) {
    const x = lerp(v0.x, v1.x, f);
    const y = lerp(v0.y, v1.y, f);
    const z = lerp(v0.z, v1.z, f);
    const w = lerp(v0.w, v1.w, f);

    result.set(x, y, z, w);
};

/**
 *
 * @param {number[]} result
 */
Vector4.prototype.toArray = function (result) {
    result[0] = this.x;
    result[1] = this.y;
    result[2] = this.z;
    result[3] = this.w;
};

/**
 * @returns {number[]}
 */
Vector4.prototype.asArray = function () {
    const result = [];

    this.toArray(result);

    return result;
};

/**
 *
 * @param {number[]} data
 * @param {number} offset
 */
Vector4.prototype.setFromArray = function (data, offset) {
    this.set(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
};

Vector4.prototype.toJSON = function () {
    return {
        x: this.x,
        y: this.y,
        z: this.z,
        w: this.w
    };
};

Vector4.prototype.fromJSON = function (json) {
    this.copy(json);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Vector4.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeFloat64(this.x);
    buffer.writeFloat64(this.y);
    buffer.writeFloat64(this.z);
    buffer.writeFloat64(this.w);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Vector4.prototype.fromBinaryBuffer = function (buffer) {
    const x = buffer.readFloat64();
    const y = buffer.readFloat64();
    const z = buffer.readFloat64();
    const w = buffer.readFloat64();

    this.set(x, y, z, w);
};
export default Vector4;
