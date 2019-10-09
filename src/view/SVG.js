/**
 * Created by Alex on 13/12/2016.
 */


/**
 *
 * @param {number} r0 inner radius
 * @param {number} r1 outer radius
 * @param {number} a0 starting angle
 * @param {number} a1 end angle
 * @returns {string}
 */
function svgArc(r0, r1, a0, a1) {
    let da, df;
    const c0 = Math.cos(a0);
    const s0 = Math.sin(a0);
    const c1 = Math.cos(a1);
    const s1 = Math.sin(a1);

    da = (a1 < a0 && (da = a0, a0 = a1, a1 = da), a1 - a0);

    df = da < Math.PI ? "0" : "1";

    return "M" + r1 * c0 + "," + r1 * s0
        + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1
        + "L" + r0 * c1 + "," + r0 * s1
        + "A" + r0 + "," + r0 + " 0 " + df + ",0 " + r0 * c0 + "," + r0 * s0
        + "Z";
}

/**
 *
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {number} angle in radians
 * @returns {{x: *, y: *}}
 */
function polarToCartesian(centerX, centerY, radius, angle) {
    return {
        x: centerX + (radius * Math.cos(angle)),
        y: centerY + (radius * Math.sin(angle))
    };
}

/**
 *
 * @param {number} r Outer Radius
 * @param {number} a Start of the outer arc (in rad)
 * @param {number} b End of the outer arc (in rad)
 * @returns {string}
 */
export function svgCircularPath(r, a, b) {

    const ac = Math.cos(a);
    const as = Math.sin(a);

    const bc = Math.cos(b);
    const bs = Math.sin(b);

    const largeArcFlag1 = b - a <= Math.PI ? "0" : "1";

    const sweepFlag = b > a ? "1" : "0";

    return `
    M${r * ac},${r * as}
    A${r},${r} 0 ${largeArcFlag1},${sweepFlag} ${r * bc},${r * bs}
    
    `;
}

/**
 *
 * @param {number} r0 Inner radius
 * @param {number} r1 Outer Radius
 * @param {number} a0 Start of the inner arc (in rad)
 * @param {number} b0 End of the inner arc (in rad)
 * @param {number} a1 Start of the outer arc (in rad)
 * @param {number} b1 End of the outer arc (in rad)
 * @returns {string}
 */
function svgArc2(r0, r1, a0, b0, a1, b1) {
    const ac0 = Math.cos(a0);
    const as0 = Math.sin(a0);

    const bc0 = Math.cos(b0);
    const bs0 = Math.sin(b0);

    const ac1 = Math.cos(a1);
    const as1 = Math.sin(a1);

    const bc1 = Math.cos(b1);
    const bs1 = Math.sin(b1);

    const largeArcFlag0 = b0 - a0 <= Math.PI ? "0" : "1";
    const largeArcFlag1 = b1 - a1 <= Math.PI ? "0" : "1";

    return `
    M${r1 * ac1},${r1 * as1}
    A${r1},${r1} 0 ${largeArcFlag1},1 ${r1 * bc1},${r1 * bs1}
    L${r0 * bc0},${r0 * bs0}
    A${r0},${r0} 0 ${largeArcFlag0},0 ${r0 * ac0},${r0 * as0}
    Z
    `;
}

/**
 *
 * @param {String} tag
 * @returns {Element}
 */
function createSVGElement(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

export default {
    arcPath: svgArc,
    svgArc2,
    createElement: createSVGElement
};
