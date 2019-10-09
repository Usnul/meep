import Vector3 from "./Vector3.js";
import { computeHashFloat, computeHashIntegerArray, EPSILON, epsilonEquals } from "../math/MathUtils.js";
import { assert } from "../assert.js";


/**
 *
 * @constructor
 */
export function ConicRay() {
    /**
     * Must be normalized
     * @type {Vector3}
     */
    this.direction = new Vector3(0, 1, 0);
    /**
     * In radians
     * @type {number}
     */
    this.angle = 0;
}

ConicRay.prototype.toJSON = function () {
    return {
        direction: this.direction.toJSON(),
        angle: this.angle
    };
};

ConicRay.prototype.fromJSON = function (json) {
    this.direction.fromJSON(json.direction);
    this.angle = json.angle;
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ConicRay.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeFloat64(this.angle);
    this.direction.toBinaryBufferFloat32(buffer);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ConicRay.prototype.fromBinaryBuffer = function (buffer) {
    this.angle = buffer.readFloat64();
    this.direction.fromBinaryBufferFloat32(buffer);

    //normalize direction
    this.direction.normalize();
};

/**
 *
 * @param {ConicRay} other
 * @returns {boolean}
 */
ConicRay.prototype.equals = function (other) {
    return this.angle === other.angle && this.direction.equals(other.direction);
};

/**
 *
 * @param {ConicRay} other
 * @param {number} tolerance
 * @returns {boolean}
 */
ConicRay.prototype.roughlyEquals = function (other, tolerance = EPSILON) {
    return epsilonEquals(this.angle, other.angle, tolerance) && this.direction.roughlyEquals(other.direction, tolerance);
};

ConicRay.prototype.hash = function () {
    return computeHashIntegerArray(
        computeHashFloat(this.angle),
        this.direction.hash()
    );
};

/**
 * NOTE: Heavily based on a stackoverflow answer
 * @see https://stackoverflow.com/questions/38997302/create-random-unit-vector-inside-a-defined-conical-region/39003745#39003745
 * @param {function} random
 * @param {Vector3} result
 */
ConicRay.prototype.sampleRandomDirection = function (random, result) {
    const coneAngle = this.angle;

    // Generate points on the spherical cap around the north pole [1].
    // [1] See https://math.stackexchange.com/a/205589/81266
    const z = random() * (1 - Math.cos(coneAngle)) + Math.cos(coneAngle);
    const phi = random() * 2 * Math.PI;
    const zSqr = Math.pow(z, 2);
    const zSqrtNeg = Math.sqrt(1 - zSqr);
    const x = zSqrtNeg * Math.cos(phi);
    const y = zSqrtNeg * Math.sin(phi);

    // If the spherical cap is centered around the north pole, we're done.
    const direction = this.direction;
    if (direction._equals(0, 0, 1)) {
        result.set(x, y, z);
        return;
    }

    assert.ok(direction.isNormalized(), 'direction vector must be normalized');

    // Find the rotation axis `u` and rotation angle `rot` [1]

    const dX = direction.x;
    const dY = direction.y;
    const dZ = direction.z;

    //compute u
    //compute rotation angle
    const rot = Math.acos(dZ);


    // Convert rotation axis and angle to 3x3 rotation matrix [2]
    // [2] See https://en.wikipedia.org/wiki/Rotation_matrix#Rotation_matrix_from_axis_and_angle

    //write matrix
    const c = Math.cos(rot); //TODO can we replace this with dZ?
    const s = Math.sin(rot);
    const t = 1 - c;
    const tx = -t * dY;
    const ty = t * dX;

    //build relevant terms of the matrix
    const n11 = c - tx * dY;
    const n12 = tx * dX;
    const n22 = ty * dX + c;
    const n13 = s * dX;
    const n32 = -s * dY;


    // Rotate [x; y; z] from north pole to `coneDir`.
    const _x = n11 * x + n12 * y + n13 * z;
    const _y = n12 * x + n22 * y + -n32 * z;
    const _z = -n13 * x + n32 * y + c * z;

    result.set(_x, _y, _z);
};
