import Vector3 from "./Vector3.js";

export function Bezier() {

}

Bezier.computeQuadratic = (function () {
    const a = new Vector3();

    function computeQuadratic(p0, p1, p2, t, result) {
        const minus = 1 - t;
        const minus2 = minus * minus;

        result.copy(p0).multiplyScalar(minus2);

        a.copy(p1).multiplyScalar(minus * 2 * t);
        result.add(a);

        a.copy(p2).multiplyScalar(t * t);
        result.add(a);

    }

    return computeQuadratic;
})();


/**
 *
 * @param {Vector2} result
 * @param {number} p0x
 * @param {number} p0y
 * @param {number} p1x
 * @param {number} p1y
 * @param {number} p2x
 * @param {number} p2y
 * @param {number} t
 */
export function computeQuadraticBezier2D(result, p0x, p0y, p1x, p1y, p2x, p2y, t) {
    const minus = 1 - t;
    const minus2 = minus * minus;

    const f = minus * 2 * t;
    const t2 = t * t;


    const x0 = p0x * minus2 + p1x * f + p2x * t2;
    const y0 = p0y * minus2 + p1y * f + p2y * t2;

    result.set(x0, y0);
}
