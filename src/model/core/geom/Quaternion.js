/**
 * Created by Alex on 10/03/14.
 */


import Vector3, { v3_dot } from './Vector3';
import Signal from "../events/signal/Signal.js";
import { Matrix4 as ThreeMatrix4 } from 'three';
import { assert } from "../assert.js";
import { copysign, EPSILON, epsilonEquals, lerp, PI2, PI_HALF } from "../math/MathUtils.js";

class Quaternion {
    /**
     *
     * @param {Number} [x=0]
     * @param {Number} [y=0]
     * @param {Number} [z=0]
     * @param {Number} [w=1]
     * @constructor
     */
    constructor(x, y, z, w) {
        this.x = (typeof x === "number") ? x : 0;
        this.y = (typeof x === "number") ? y : 0;
        this.z = (typeof z === "number") ? z : 0;
        this.w = (typeof w === "number") ? w : 1;

        this.onChanged = new Signal();
        this.lookRotation_2 = (function () {
            // just in case you need that function also
            function CreateFromAxisAngle(axis, angle, result) {
                const halfAngle = angle * .5;
                const s = Math.sin(halfAngle);
                return result.set(axis.x * s, axis.y * s, axis.z * s, Math.cos(halfAngle));
            }

            const __forwardVector = new Vector3(0, 0, 1);
            const __upVector = new Vector3(0, 1, 0);
            const rotAxis = new Vector3();

            function lookAt(forwardVector) {
                const dot = __forwardVector.dot(forwardVector);
                if (Math.abs(dot - (-1.0)) < 0.000001) {
                    return this.set(__upVector.x, __upVector.y, __upVector.z, 3.1415926535897932);
                }
                if (Math.abs(dot - (1.0)) < 0.000001) {
                    return this.set(0, 0, 0, 1);
                }

                const rotAngle = Math.acos(dot);
                rotAxis.copy(__forwardVector);
                rotAxis.cross(forwardVector);
                rotAxis.normalize();
                return CreateFromAxisAngle(rotAxis, rotAngle, this);
            }

            return lookAt;
        })();
        /**
         *
         * @param {Vector3} forward
         * @param {Vector3} [up=Vector3.up]
         *
         * @source http://answers.unity3d.com/questions/467614/what-is-the-source-code-of-quaternionlookrotation.html
         */
        this.lookRotation = (function () {
            const forward = new Vector3();
            const up = new Vector3();
            const right = new Vector3();

            /**
             *
             * @param vForward
             * @param vUp
             */
            function lookRotation(vForward, vUp = Vector3.up) {

                forward.copy(vForward).normalize();

                right.crossVectors(vUp, forward);
                right.normalize();

                up.crossVectors(forward, right);

                var m00 = right.x;
                var m01 = right.y;
                var m02 = right.z;
                var m10 = up.x;
                var m11 = up.y;
                var m12 = up.z;
                var m20 = forward.x;
                var m21 = forward.y;
                var m22 = forward.z;


                const num8 = (m00 + m11) + m22;

                let _x, _y, _z, _w;

                if (num8 > 0) {
                    let num = Math.sqrt(num8 + 1);
                    _w = num * 0.5;
                    num = 0.5 / num;
                    _x = (m12 - m21) * num;
                    _y = (m20 - m02) * num;
                    _z = (m01 - m10) * num;
                } else if ((m00 >= m11) && (m00 >= m22)) {
                    var num7 = Math.sqrt(((1 + m00) - m11) - m22);
                    var num4 = 0.5 / num7;
                    _x = 0.5 * num7;
                    _y = (m01 + m10) * num4;
                    _z = (m02 + m20) * num4;
                    _w = (m12 - m21) * num4;
                } else if (m11 > m22) {
                    var num6 = Math.sqrt(((1 + m11) - m00) - m22);
                    var num3 = 0.5 / num6;
                    _x = (m10 + m01) * num3;
                    _y = 0.5 * num6;
                    _z = (m21 + m12) * num3;
                    _w = (m20 - m02) * num3;
                } else {
                    var num5 = Math.sqrt(((1 + m22) - m00) - m11);
                    var num2 = 0.5 / num5;
                    _x = (m20 + m02) * num2;
                    _y = (m21 + m12) * num2;
                    _z = 0.5 * num5;
                    _w = (m01 - m10) * num2;
                }

                this.set(_x, _y, _z, _w);
            }

            return lookRotation;
        })();
        this.__setThreeEuler = (function () {

            const matrix = new ThreeMatrix4();

            function setThreeEuler(euler) {

                this.__setRotationMatrix(matrix.elements);

                return euler.setFromRotationMatrix(matrix);
            }

            return setThreeEuler;
        })();
    }

    /**
     *
     * @param {Vector3} direction
     * @param {Vector3} reference Reference direction, for example if you want to align Up direction or Forward, supply those here
     * @param {number} limit
     */
    lookRotation_3(direction, reference, limit) {
        const q = new Quaternion();

        const f = new Vector3();

        f.copy(reference);

        f.applyQuaternion(this);

        f.normalize();

        //
        q.fromUnitVectors2(f, direction);

        console.log(f.toJSON(), q.toJSON(), direction.toJSON(), reference.toJSON());

        this.multiply(q);
    }

    /**
     * Calculates the inverse
     */
    invert() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;

        const dot = x * x + y * y + z * z + w * w;

        if (dot === 0) {
            this.set(0, 0, 0, 0);
            return;
        }

        const invDot = 1.0 / dot;

        const _x = -x * invDot;
        const _y = -y * invDot;
        const _z = -z * invDot;
        const _w = w * invDot;

        this.set(_x, _y, _z, _w);
    }

    /**
     *
     * @param {Vector3} axis
     * @param {number} angle
     */
    fromAxisAngle(axis, angle) {
        this._fromAxisAngle(axis.x, axis.y, axis.z, angle);
    }

    /**
     *
     * @param {number} ax
     * @param {number} ay
     * @param {number} az
     * @param {number} angle
     */
    _fromAxisAngle(ax, ay, az, angle) {
        const halfAngle = angle * 0.5;

        const sinA2 = Math.sin(halfAngle);
        const cosA2 = Math.cos(halfAngle);

        const qx = ax * sinA2;
        const qy = ay * sinA2;
        const qz = az * sinA2;
        const qw = cosA2;

        this.set(qx, qy, qz, qw);
    }

    /**
     *
     * @param {Vector3} axis
     * @returns {number} angle in radians
     */
    toAxisAngle(axis) {
        const rad = Math.acos(this.w) * 2.0;
        const s = Math.sin(rad / 2.0);
        if (s > EPSILON) {
            axis.set(
                this.x / s,
                this.y / s,
                this.z / s
            );
        } else {
            // If s is zero, return any axis (no rotation - axis does not matter)
            axis.set(1, 0, 0);
        }
        return rad;
    }

    normalize() {
        let l = this.length();

        if (l === 0) {
            this.set(0, 0, 0, 1);
        } else {
            const m = 1 / l;
            this.multiplyScalar(m, m, m, m);
        }
    }

    multiplyScalar(val) {
        return this.set(this.x * val, this.y * val, this.z * val, this.w * val);
    }

    /**
     * @see http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
     * @param {Quaternion} other
     */
    multiply(other) {
        this.multiplyQuaternions(this, other);
    }

    /**
     *
     * @param {Quaternion} first
     * @param {Quaternion} second
     */
    multiplyQuaternions(first, second) {
        const aX = first.x;
        const aY = first.y;
        const aZ = first.z;
        const aW = first.w;

        const bX = second.x;
        const bY = second.y;
        const bZ = second.z;
        const bW = second.w;

        this._multiplyQuaternions(aX, aY, aZ, aW, bX, bY, bZ, bW)
    }

    /**
     *
     * @param {number} ax
     * @param {number} ay
     * @param {number} az
     * @param {number} aw
     * @param {number} bx
     * @param {number} by
     * @param {number} bz
     * @param {number} bw
     * @return {Quaternion}
     */
    _multiplyQuaternions(ax, ay, az, aw, bx, by, bz, bw) {

        const x = ax * bw + aw * bx + ay * bz - az * by;
        const y = ay * bw + aw * by + az * bx - ax * bz;
        const z = az * bw + aw * bz + ax * by - ay * bx;
        const w = aw * bw - ax * bx - ay * by - az * bz;

        return this.set(x, y, z, w);
    }

    /**
     *
     * @return {number}
     */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    /**
     *
     * @param {Vector3} direction
     * @param {Vector3} [up]
     * @param {Vector3} [forward]
     */
    alignToDirection(direction, up = Vector3.up, forward = Vector3.forward) {

        const dot = up.dot(direction);


        if (Math.abs(dot + 1) < 0.000001) {
            // vector a and b point exactly in the opposite direction,
            // so it is a 180 degrees turn around the up-axis
            this.set(forward.x, forward.y, forward.z, Math.PI);
        } else if (Math.abs(dot - 1) < 0.000001) {
            // vector a and b point exactly in the same direction
            // so we return the identity quaternion
            this.set(0, 0, 0, 1);
        }

        const angle = Math.acos(dot);

        axis.crossVectors(up, direction);
        axis.normalize();

        this.fromAxisAngle(axis, angle);
    }

    /**
     *
     * @param {Vector3} source
     * @param {Vector3} target
     */
    lookAt(source, target) {
        const forward = new Vector3();

        forward
            .copy(target)
            .sub(source)
            .normalize();

        this.alignToDirection(forward);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {String} order a combination of capital letters X,Y,Z. Examples: XYZ, YXZ
     * @returns {Quaternion}
     */
    __setFromEuler(x, y, z, order = 'XYZ') {

        // http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m

        const cos = Math.cos;
        const sin = Math.sin;

        const c1 = cos(x / 2);
        const c2 = cos(y / 2);
        const c3 = cos(z / 2);

        const s1 = sin(x / 2);
        const s2 = sin(y / 2);
        const s3 = sin(z / 2);

        if (order === 'XYZ') {

            return this.set(
                s1 * c2 * c3 + c1 * s2 * s3,
                c1 * s2 * c3 - s1 * c2 * s3,
                c1 * c2 * s3 + s1 * s2 * c3,
                c1 * c2 * c3 - s1 * s2 * s3
            );

        } else if (order === 'YXZ') {


            return this.set(
                s1 * c2 * c3 + c1 * s2 * s3,
                c1 * s2 * c3 - s1 * c2 * s3,
                c1 * c2 * s3 - s1 * s2 * c3,
                c1 * c2 * c3 + s1 * s2 * s3
            );

        } else if (order === 'ZXY') {

            return this.set(
                s1 * c2 * c3 - c1 * s2 * s3,
                c1 * s2 * c3 + s1 * c2 * s3,
                c1 * c2 * s3 + s1 * s2 * c3,
                c1 * c2 * c3 - s1 * s2 * s3
            );

        } else if (order === 'ZYX') {

            return this.set(
                s1 * c2 * c3 - c1 * s2 * s3,
                c1 * s2 * c3 + s1 * c2 * s3,
                c1 * c2 * s3 - s1 * s2 * c3,
                c1 * c2 * c3 + s1 * s2 * s3
            );

        } else if (order === 'YZX') {

            return this.set(
                s1 * c2 * c3 + c1 * s2 * s3,
                c1 * s2 * c3 + s1 * c2 * s3,
                c1 * c2 * s3 - s1 * s2 * c3,
                c1 * c2 * c3 - s1 * s2 * s3
            );

        } else if (order === 'XZY') {

            return this.set(
                s1 * c2 * c3 - c1 * s2 * s3,
                c1 * s2 * c3 - s1 * c2 * s3,
                c1 * c2 * s3 + s1 * s2 * c3,
                c1 * c2 * c3 + s1 * s2 * s3
            );

        }
    }

    toEulerAnglesXYZ(result) {

        const x = this.x;

        const y = this.y;
        const z = this.z;
        const w = this.w;

        const w2 = w * w;
        const x2 = x * x;
        const y2 = y * y;
        const z2 = z * z;

        const psi = Math.atan2(2 * (x * w - y * z), (w2 - x2 - y2 + z2));
        const theta = Math.asin(2 * (x * z + y * w));
        const phi = Math.atan2(2 * (z * w - x * y), (w2 + x2 - y2 - z2));

        result.set(psi, theta, phi);
    }

    /**
     *
     * @param {Array.<Number>} elements
     */
    __setRotationMatrix(elements) {
        const x = this.x, y = this.y, z = this.z, w = this.w;

        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;

        elements[0] = 1 - (yy + zz);
        elements[4] = xy - wz;
        elements[8] = xz + wy;

        elements[1] = xy + wz;
        elements[5] = 1 - (xx + zz);
        elements[9] = yz - wx;

        elements[2] = xz - wy;
        elements[6] = yz + wx;
        elements[10] = 1 - (xx + yy);

        // last column
        elements[3] = 0;
        elements[7] = 0;
        elements[11] = 0;

        // bottom row
        elements[12] = 0;
        elements[13] = 0;
        elements[14] = 0;
        elements[15] = 1;
    }

    /**
     * Writes Pitch(Y), Yaw(Z), Roll(X) to a given vector
     * @param {Vector3} result
     */
    toEulerAngles2(result) {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;

        // roll (x-axis rotation)
        const sinr_cosp = +2.0 * (w * x + y * z);
        const cosr_cosp = +1.0 - 2.0 * (x * x + y * y);
        const roll = Math.atan2(sinr_cosp, cosr_cosp);

        let pitch;
        // pitch (y-axis rotation)
        const sinp = +2.0 * (w * y - z * x);
        if (Math.abs(sinp) >= 1) {
            pitch = copysign(Math.PI / 2, sinp); // use 90 degrees if out of range
        } else {
            pitch = Math.asin(sinp);
        }

        // yaw (z-axis rotation)
        const siny_cosp = +2.0 * (w * z + x * y);
        const cosy_cosp = +1.0 - 2.0 * (y * y + z * z);
        const yaw = Math.atan2(siny_cosp, cosy_cosp);

        result.set(roll, pitch, yaw);
    }

    /**
     * @source: https://stackoverflow.com/questions/12088610/conversion-between-euler-quaternion-like-in-unity3d-engine
     * @param {number} x angle in X axis in radians
     * @param {number} y angle in Y axis in radians
     * @param {number} z angle in Z axis in radians
     */
    fromEulerAngles(x, y, z) {
        const half = 0.5;

        x *= half;
        y *= half;
        z *= half;

        const sx = Math.sin(x);
        const cx = Math.cos(x);
        const sy = Math.sin(y);
        const cy = Math.cos(y);
        const sz = Math.sin(z);
        const cz = Math.cos(z);

        const _x = sx * cy * cz - cx * sy * sz;
        const _y = cx * sy * cz + sx * cy * sz;
        const _z = cx * cy * sz - sx * sy * cz;
        const _w = cx * cy * cz + sx * sy * sz;

        this.set(_x, _y, _z, _w);
    }

    /**
     * Writes Pitch(Y), Yaw(Z), Roll(X) to a given vector
     * @source http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/
     * @param {Vector3} result
     */
    toEulerAngles(result) {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;

        const sqw = w * w;
        const sqx = x * x;
        const sqy = y * y;
        const sqz = z * z;

        const unit = sqx + sqy + sqz + sqw; // if normalised is one, otherwise is correction factor

        const test = x * w - y * z;

        function normalizeAngle(v) {
            return v % PI2;
        }

        let yaw, pitch, roll;

        if (test > 0.4995 * unit) { // singularity at north pole
            yaw = 2 * Math.atan2(y, x);
            pitch = PI_HALF;
            roll = 0;
        } else if (test < -0.4995 * unit) { // singularity at south pole
            yaw = -2 * Math.atan2(y, x);
            pitch = -PI_HALF;
            roll = 0;
        } else {
            yaw = Math.atan2(2 * x * w + 2 * y * z, 1 - 2 * (sqz + sqw));
            pitch = Math.asin(2 * (x * z - w * y));
            roll = Math.atan2(2 * x * y - 2 * z * w, 1 - 2 * (sqy + sqz))
        }

        //normalize angles
        yaw = normalizeAngle(yaw);
        pitch = normalizeAngle(pitch);
        roll = normalizeAngle(roll);

        result.set(pitch, yaw, roll);
    }

    /**
     * Based on blog post: http://lolengine.net/blog/2013/09/18/beautiful-maths-quaternion-from-vectors
     * @param {Vector3} from
     * @param {Vector3} to
     */
    fromNonUnitVectors(from, to) {
        //quat quat::fromtwovectors(vec3 u, vec3 v)
        // {
        //     vec3 w = cross(u, v);
        //     quat q = quat(dot(u, v), w.x, w.y, w.z);
        //     q.w += length(q);
        //     return normalize(q);
        // }

        const ax = from.x;
        const ay = from.y;
        const az = from.z;

        const bx = to.x;
        const by = to.y;
        const bz = to.z;

        //compute cross product
        const crossX = ay * bz - az * by;
        const crossY = az * bx - ax * bz;
        const crossZ = ax * by - ay * bx;

        const uv_dot = v3_dot(ax, ay, az, bx, by, bz);


        const qX = crossX;
        const qY = crossY;
        const qZ = crossZ;
        const qW = uv_dot;

        const p0 = qX * qX + qY * qY + qZ * qZ;

        const l0 = Math.sqrt(p0 + qW * qW);

        const qW_1 = qW + l0;

        //normalize result
        const l1 = Math.sqrt(p0 + qW_1 * qW_1);

        const x = qX / l1;
        const y = qY / l1;
        const z = qZ / l1;
        const w = qW / l1;

        this.set(x, y, z, w);
    }

    /**
     * Based on blog post: http://lolengine.net/blog/2013/09/18/beautiful-maths-quaternion-from-vectors
     * @param {Vector3} from
     * @param {Vector3} to
     */
    fromUnitVectors2(from, to) {
        assert.ok(from.isNormalized(), `from vector is not normalized, length = ${from.length()}`);
        assert.ok(to.isNormalized(), `to vector is not normalized, length = ${to.length()}`);

        //quat quat::fromtwovectors(vec3 u, vec3 v)
        // {
        //     float m = sqrt(2.f + 2.f * dot(u, v));
        //     vec3 w = (1.f / m) * cross(u, v);
        //     return quat(0.5f * m, w.x, w.y, w.z);
        // }

        const ax = from.x;
        const ay = from.y;
        const az = from.z;

        const bx = to.x;
        const by = to.y;
        const bz = to.z;

        const uv_dot = v3_dot(ax, ay, az, bx, by, bz);

        if (uv_dot === -1) {
            //to vector is opposite, produce a reversal quaternion

            tempvec3.crossVectors(Vector3.left, from);

            if (tempvec3.lengthSqr() < 0.00001) {
                tempvec3.crossVectors(Vector3.up, from);
            }

            tempvec3.normalize();

            this.set(
                tempvec3.x,
                tempvec3.y,
                tempvec3.z,
                0
            );

            return;
        }

        const m = Math.sqrt(2 + 2 * uv_dot);

        const inv_m = 1 / m;

        //compute cross product
        const crossX = ay * bz - az * by;
        const crossY = az * bx - ax * bz;
        const crossZ = ax * by - ay * bx;

        //compute W vector
        const wX = inv_m * crossX;
        const wY = inv_m * crossY;
        const wZ = inv_m * crossZ;


        this.set(
            wX,
            wY,
            wZ,
            0.5 * m
        );
    }

    /**
     * Input vectors must be normalized
     * @param {Vector3} from
     * @param {Vector3} to
     */
    fromUnitVectors(from, to) {
        assert.ok(from.isNormalized(), `from vector is not normalized, length = ${from.length()}`);
        assert.ok(to.isNormalized(), `to vector is not normalized, length = ${to.length()}`);

        const dot = from.dot(to);

        let x, y, z, w;

        if (dot < -0.9999999) {
            const tempvec3 = new Vector3();

            tempvec3.crossVectors(Vector3.left, from);

            if (tempvec3.lengthSqr() < 0.00001) {
                tempvec3.crossVectors(Vector3.up, from);
            }

            tempvec3.normalize();

            this.fromAxisAngle(tempvec3, Math.PI);
        } else if (dot > 0.9999999) {
            x = 0;
            y = 0;
            z = 0;
            w = 1;

            this.set(x, y, z, w);
        } else {
            //cross product from x to

            x = from.y * to.z - from.z * to.y;
            y = from.z * to.x - from.x * to.z;
            z = from.x * to.y - from.y * to.x;
            w = 1 + dot;

            this.set(x, y, z, w);
            this.normalize();
        }
    }

    /**
     *
     * @param {number} m11
     * @param {number} m12
     * @param {number} m13
     * @param {number} m21
     * @param {number} m22
     * @param {number} m23
     * @param {number} m31
     * @param {number} m32
     * @param {number} m33
     * @returns {Quaternion}
     */
    __setFromRotationMatrix(m11, m12, m13, m21, m22, m23, m31, m32, m33) {
        const trace = m11 + m22 + m33;

        let x, y, z, w, s;

        if (trace > 0) {

            s = 0.5 / Math.sqrt(trace + 1.0);

            w = 0.25 / s;
            x = (m32 - m23) * s;
            y = (m13 - m31) * s;
            z = (m21 - m12) * s;

        } else if (m11 > m22 && m11 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

            w = (m32 - m23) / s;
            x = 0.25 * s;
            y = (m12 + m21) / s;
            z = (m13 + m31) / s;

        } else if (m22 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

            w = (m13 - m31) / s;
            x = (m12 + m21) / s;
            y = 0.25 * s;
            z = (m23 + m32) / s;

        } else {

            s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

            w = (m21 - m12) / s;
            x = (m13 + m31) / s;
            y = (m23 + m32) / s;
            z = 0.25 * s;

        }

        return this.set(x, y, z, w);
    }

    /**
     * Linear interpolation
     * @param {Quaternion} other
     * @param {number} t fractional value between 0 and 1
     */
    lerp(other, t) {
        const x = lerp(this.x, other.x, t);
        const y = lerp(this.y, other.y, t);
        const z = lerp(this.z, other.z, t);
        const w = lerp(this.w, other.w, t);


        this.set(x, y, z, w);
    }

    /**
     * @see https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/quat.js
     * @param {Quaternion} other
     * @param {number} t
     */
    slerp(other, t) {
        const ax = this.x,
            ay = this.y,
            az = this.z,
            aw = this.w;

        let bx = this.x,
            by = this.y,
            bz = this.z,
            bw = this.w;

        let omega, cosom, sinom, scale0, scale1;

        // calc cosine
        cosom = ax * bx + ay * by + az * bz + aw * bw;

        // adjust signs (if necessary)
        if (cosom < 0.0) {
            cosom = -cosom;
            bx = -bx;
            by = -by;
            bz = -bz;
            bw = -bw;
        }
        // calculate coefficients
        if ((1.0 - cosom) > EPSILON) {
            // standard case (slerp)
            omega = Math.acos(cosom);
            sinom = Math.sin(omega);
            scale0 = Math.sin((1.0 - t) * omega) / sinom;
            scale1 = Math.sin(t * omega) / sinom;
        } else {
            // "from" and "to" quaternions are very close
            //  ... so we can do a linear interpolation
            scale0 = 1.0 - t;
            scale1 = t;
        }

        // calculate final values
        const _x = scale0 * ax + scale1 * bx;
        const _y = scale0 * ay + scale1 * by;
        const _z = scale0 * az + scale1 * bz;
        const _w = scale0 * aw + scale1 * bw;

        this.set(_x, _y, _z, _w);
    }

    /**
     *
     * @param {function} handler
     */
    process(handler) {
        handler(this.x, this.y, this.z, this.w);

        this.onChanged.add(handler);
    }

    /**
     *
     * @param {Quaternion} other
     * @returns {Quaternion}
     */
    copy(other) {
        return this.set(other.x, other.y, other.z, other.w);
    }

    /**
     *
     * @returns {Quaternion}
     */
    clone() {
        const result = new Quaternion();

        result.copy(this);

        return result;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} w
     * @returns {Quaternion}
     */
    set(x, y, z, w) {
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
    }

    /**
     *
     * @returns {Quaternion}
     */
    conjugate() {
        return this.set(-this.x, -this.y, -this.z, this.w);
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            w: this.w
        };
    }

    fromJSON(obj) {
        this.set(obj.x, obj.y, obj.z, obj.w);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        buffer.writeFloat64(this.x);
        buffer.writeFloat64(this.y);
        buffer.writeFloat64(this.z);
        buffer.writeFloat64(this.w);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        const x = buffer.readFloat64();
        const y = buffer.readFloat64();
        const z = buffer.readFloat64();
        const w = buffer.readFloat64();

        this.set(x, y, z, w);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBufferFloat32(buffer) {
        buffer.writeFloat32(this.x);
        buffer.writeFloat32(this.y);
        buffer.writeFloat32(this.z);
        buffer.writeFloat32(this.w);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBufferFloat32(buffer) {
        const x = buffer.readFloat32();
        const y = buffer.readFloat32();
        const z = buffer.readFloat32();
        const w = buffer.readFloat32();

        this.set(x, y, z, w);
    }

    decodeFromUint32(value) {
        //read components
        const max = value & 0x3;

        const iv0 = (value >> 2) & 0x3FF;
        const iv1 = (value >> 12) & 0x3FF;
        const iv2 = (value >> 22) & 0x3FF;

        //scale components back to quaternion range
        const v0 = (iv0 / 511.5 - 1) * K_CONST;
        const v1 = (iv1 / 511.5 - 1) * K_CONST;
        const v2 = (iv2 / 511.5 - 1) * K_CONST;

        //restore dropped component using quaternion identity: x^2 + y^2 + z^2 + w^2 = 1
        const dropped_2 = 1 - v0 * v0 - v1 * v1 - v2 * v2;
        const dropped = Math.sqrt(dropped_2);

        if (max === 0) {
            this.set(dropped, v0, v1, v2);
        } else if (max === 1) {
            this.set(v0, dropped, v1, v2);
        } else if (max === 2) {
            this.set(v0, v1, dropped, v2);
        } else {
            this.set(v0, v1, v2, dropped);
        }
    }

    /**
     *
     * @returns {number}
     */
    encodeToUint32() {
        const x = this.x;
        const y = this.y;
        const z = this.z;
        const w = this.w;

        const absX = Math.abs(x);
        const absY = Math.abs(y);
        const absZ = Math.abs(z);
        const absW = Math.abs(w);

        let max = 0;

        //pick max component
        if (absY > absX) {
            if (absY > absZ) {
                if (absY > absW) {
                    //absY is max
                    max = 1;
                } else {
                    //absW is max
                    max = 3;
                }
            } else if (absZ > absW) {
                //absZ is max
                max = 2;
            } else {
                //absW is max
                max = 3;
            }
        } else if (absX > absZ) {
            if (absX > absW) {
                max = 0;
            } else {
                max = 3;
            }
        } else if (absZ > absW) {
            max = 2;
        } else {
            max = 3;
        }

        let v0, v1, v2, dropped;

        //max will be dropped
        if (max === 0) {
            //dropping x
            v0 = y;
            v1 = z;
            v2 = w;

            dropped = x;
        } else if (max === 1) {
            //dropping y
            v0 = x;
            v1 = z;
            v2 = w;

            dropped = y;
        } else if (max === 2) {
            //dropping z
            v0 = x;
            v1 = y;
            v2 = w;

            dropped = z;
        } else {
            //dropping w
            v0 = x;
            v1 = y;
            v2 = z;

            dropped = w;
        }

        if (dropped < 0) {
            //reconstructing dropped value is only possible if it is positive, so we invert the quaternion to make dropped value positive
            v0 = -v0;
            v1 = -v1;
            v2 = -v2;
        }

        const l = Math.sqrt(x * x + y * y + z * z + w * w);
        const m = 1 / (l * K_CONST);

        //re-normalize the remaining components to 10 bit UINT value
        const oV0 = ((v0 * m + 1) * 511.5) | 0;
        const oV1 = ((v1 * m + 1) * 511.5) | 0;
        const oV2 = ((v2 * m + 1) * 511.5) | 0;

        assert.ok(oV0 <= 1023 && oV0 >= 0, `expected 0 <= ov0 <= 1023, instead was '${oV0}'`);
        assert.ok(oV1 <= 1023 && oV1 >= 0, `expected 0 <= ov1 <= 1023, instead was '${oV1}'`);
        assert.ok(oV2 <= 1023 && oV2 >= 0, `expected 0 <= ov2 <= 1023, instead was '${oV2}'`);


        const result = (max & 0x3)
            | ((oV0 & 0x3FF) << 2)
            | ((oV1 & 0x3FF) << 12)
            | ((oV2 & 0x3FF) << 22)
        ;

        return result;
    }

    /**
     *
     * @param {Quaternion} other
     * @returns {boolean}
     */
    equals(other) {
        return this.x === other.x && this.y === other.y && this.z === other.z && this.w === other.w;
    }

    /**
     *
     * @param {Quaternion} other
     * @param {number} [tolerance]
     * @return {boolean}
     */
    roughlyEquals(other, tolerance) {
        return this._roughlyEquals(other.x, other.y, other.z, other.w, tolerance);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} w
     * @param {number} [tolerance]
     * @return {boolean}
     * @private
     */
    _roughlyEquals(x, y, z, w, tolerance = EPSILON) {
        return epsilonEquals(this.x, x, tolerance)
            && epsilonEquals(this.y, y, tolerance)
            && epsilonEquals(this.z, z, tolerance)
            && epsilonEquals(this.w, w, tolerance);
    }

    /**
     *
     * @param {function} random random number generator function
     * @returns {Quaternion}
     */
    static random(random = Math.random) {
        const result = new Quaternion(random(), random(), random(), random());

        result.normalize();

        return result;
    }
}

/**
 * @readonly
 * @type {Quaternion}
 */
Quaternion.identity = Object.freeze(new Quaternion(0, 0, 0, 1));


/**
 *
 * @type {Vector3}
 */
const axis = new Vector3();


const tempvec3 = new Vector3();

const K_CONST = 0.70710678118; // 1/sqrt(2)

export default Quaternion;
