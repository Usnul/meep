/**
 * Created by Alex on 20/02/2017.
 */


import Vector3, { v3_dot } from './Vector3';
import { m3_determinant } from "./Matrix3.js";

function Plane() {

}

/**

 Algorithm taken from http://geomalgorithms.com/a05-_intersect-1.html. See the
 section 'Intersection of 2 Planes' and specifically the subsection
 (A) Direct Linear Equation
 @param {Plane} p1
 @param {Plane} p2
 @param {Vector3} point
 @param {Vector3} direction
 @returns {boolean}
 */
export function computePlanePlaneIntersection(p1, p2, point, direction) {

    // the cross product gives us the direction of the line at the intersection
    // of the two planes, and gives us an easy way to check if the two planes
    // are parallel - the cross product will have zero magnitude

    direction.crossVectors(p1.normal, p2.normal);

    const magnitude = direction.lengthSqr();

    if (magnitude === 0) {
        return false
    }

    // now find a point on the intersection. We use the 'Direct Linear Equation'
    // method described in the linked page, and we choose which coordinate
    // to set as zero by seeing which has the largest absolute value in the
    // directional vector

    const X = Math.abs(direction.x);
    const Y = Math.abs(direction.y);
    const Z = Math.abs(direction.z);

    if (Z >= X && Z >= Y) {
        solveIntersectingPoint('z', 'x', 'y', p1, p2, point);
    } else if (Y >= Z && Y >= X) {
        solveIntersectingPoint('y', 'z', 'x', p1, p2, point);
    } else {
        solveIntersectingPoint('x', 'y', 'z', p1, p2, point);
    }

    return true;
}

/**
 *
 * @param {Vector3} out Result will be written here
 * @param {Vector3} origin Ray origin
 * @param {Vector3} direction Ray direction
 * @param {Vector3} normal Plane normal
 * @param {number} dist Plane distance
 * @returns {boolean} true if intersection is found, false otherwise
 */
export function planeRayIntersection(out, origin, direction, normal, dist) {
    return computePlaneRayIntersection(out, origin.x, origin.y, origin.z, direction.x, direction.y, direction.z, normal.x, normal.y, normal.z, dist)
}

/**
 *
 * @param {Vector3} out Result will be written here
 * @param {number} originX Ray origin
 * @param {number} originY Ray origin
 * @param {number} originZ Ray origin
 * @param {number} directionX Ray direction
 * @param {number} directionY Ray direction
 * @param {number} directionZ Ray direction
 * @param {number} normalX Plane normal
 * @param {number} normalY Plane normal
 * @param {number} normalZ Plane normal
 * @param {number} dist Plane distance
 * @returns {boolean} true if intersection is found, false otherwise
 */
export function computePlaneRayIntersection(out, originX, originY, originZ, directionX, directionY, directionZ, normalX, normalY, normalZ, dist) {
    const denom = v3_dot(directionX, directionY, directionZ, normalX, normalY, normalZ);

    const p = v3_dot(normalX, normalY, normalZ, originX, originY, originZ) + dist;

    if (denom !== 0) {

        const t = -p / denom;

        if (t < 0) {
            return false;
        }

        out.set(
            directionX * t + originX,
            directionY * t + originY,
            directionZ * t + originZ
        );

        return true;

    } else {

        if (p === 0) {

            out.set(originX, originY, originZ);

            return true;

        } else {

            //no intersection
            return false;

        }

    }
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} normalX
 * @param {number} normalY
 * @param {number} normalZ
 * @param {number} planeConstant
 * @returns {number}
 */
export function computePointDistanceToPlane(x, y, z, normalX, normalY, normalZ, planeConstant) {
    return planeConstant - v3_dot(x, y, z, normalX, normalY, normalZ);
}

/**
 *
 * @param {Vector3} out Result will be written here
 * @param {number} originX Ray origin
 * @param {number} originY Ray origin
 * @param {number} originZ Ray origin
 * @param {number} directionX Ray direction
 * @param {number} directionY Ray direction
 * @param {number} directionZ Ray direction
 * @param {number} normalX Plane normal
 * @param {number} normalY Plane normal
 * @param {number} normalZ Plane normal
 * @param {number} dist Plane distance
 * @returns {boolean} true if intersection is found, false otherwise
 */
export function computePlaneLineIntersection(out, originX, originY, originZ, directionX, directionY, directionZ, normalX, normalY, normalZ, dist) {
    const denom = v3_dot(directionX, directionY, directionZ, normalX, normalY, normalZ);

    const p = v3_dot(normalX, normalY, normalZ, originX, originY, originZ) + dist;

    if (denom !== 0) {

        const t = -p / denom;

        out.set(
            directionX * t + originX,
            directionY * t + originY,
            directionZ * t + originZ
        );

        return true;

    } else {

        if (p === 0) {

            out.set(originX, originY, originZ);

            return true;

        } else {

            //no intersection
            return false;

        }

    }
}

/**
 * NOTE: Based on Intersection of 3 planes, Graphics Gems 1 pg 305
 * @param {Vector3} out
 * @param {Plane} plane1
 * @param {Plane} plane2
 * @param {Plane} plane3
 * @returns {boolean}
 */
export function compute3PlaneIntersection(out, plane1, plane2, plane3) {
    const p1_n = plane1.normal;
    const p2_n = plane2.normal;
    const p3_n = plane3.normal;

    const p1_c_neg = -plane1.constant;
    const p2_c_neg = -plane2.constant;
    const p3_c_neg = -plane3.constant;

    const p1n_x = p1_n.x;
    const p1n_y = p1_n.y;
    const p1n_z = p1_n.z;

    const p2n_x = p2_n.x;
    const p2n_y = p2_n.y;
    const p2n_z = p2_n.z;

    const p3n_x = p3_n.x;
    const p3n_y = p3_n.y;
    const p3n_z = p3_n.z;

    const det = m3_determinant(
        p1n_x, p1n_y, p1n_z,
        p2n_x, p2n_y, p2n_z,
        p3n_x, p3n_y, p3n_z
    );

    // If the determinant is 0, that means parallel planes, no intn.
    if (det === 0) {
        return false;
    }

    //
    const ax = (p2n_y * p3n_z - p2n_z * p3n_y) * p1_c_neg;
    const ay = (p2n_z * p3n_x - p2n_x * p3n_z) * p1_c_neg;
    const az = (p2n_x * p3n_y - p2n_y * p3n_x) * p1_c_neg;

    const bx = (p3n_y * p1n_z - p3n_z * p1n_y) * p2_c_neg;
    const by = (p3n_z * p1n_x - p3n_x * p1n_z) * p2_c_neg;
    const bz = (p3n_x * p1n_y - p3n_y * p1n_x) * p2_c_neg;

    const cx = (p1n_y * p2n_z - p1n_z * p2n_y) * p3_c_neg;
    const cy = (p1n_z * p2n_x - p1n_x * p2n_z) * p3_c_neg;
    const cz = (p1n_z * p2n_y - p1n_y * p2n_x) * p3_c_neg;

    const det_inv = 1 / det;

    const rx = (ax + bx + cx) * det_inv;
    const ry = (ay + by + cy) * det_inv;
    const rz = (az + bz + cz) * det_inv;

    out.set(rx, ry, rz);
    //

    return true;
}


/*

 This method helps finding a point on the intersection between two planes.
 Depending on the orientation of the planes, the problem could solve for the
 zero point on either the x, y or z axis

 */
function solveIntersectingPoint(zeroCoord, A, B, p1, p2, result) {
    const nP1 = p1.normal;

    const a1 = nP1[A];
    const b1 = nP1[B];
    const d1 = p1.constant;

    const nP2 = p2.normal;

    const a2 = nP2[A];
    const b2 = nP2[B];
    const d2 = p2.constant;

    const A0 = ((b2 * d1) - (b1 * d2)) / ((a1 * b2 - a2 * b1));
    const B0 = ((a1 * d2) - (a2 * d1)) / ((a1 * b2 - a2 * b1));

    result[zeroCoord] = 0;
    result[A] = A0;
    result[B] = B0;
}
