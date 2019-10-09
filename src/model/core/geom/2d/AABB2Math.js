import { max3 } from "../../math/MathUtils.js";

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} px
 * @param {number} py
 * @returns {number}
 */
export function aabb2_distanceToPoint(x0, y0, x1, y1, px, py) {
    const sqrD = aabb2_sqrDistanceToPoint(x0, y0, x1, y1, px, py);
    return Math.sqrt(sqrD);
}

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} px
 * @param {number} py
 * @returns {number}
 */
export function aabb2_sqrDistanceToPoint(x0, y0, x1, y1, px, py) {

    const dxLeft = x0 - px;
    const dxRight = px - x1;

    const dyTop = y0 - py;
    const dyBottom = py - y1;

    var dx = max3(dxLeft, 0, dxRight);
    var dy = max3(dyTop, 0, dyBottom);

    return dx * dx + dy * dy;
}
