import { PointSet } from "./PointSet";
import { Subspan } from "./Subspan";

const Tolerance = 1.0e-15;

/**
 *
 * @param {Subspan} span
 * @param {number[]} pt
 * @param {number[]}expected
 */
function shortestVectorToHull(span, pt, expected) {
    const sv = new Array(span.dimension());
    span.shortestVectorToSpan(pt, sv);
    for (let i = 0; i < span.dimension(); ++i) {
        expect(Math.abs(expected[i] - sv[i])).toBeLessThanOrEqual(Tolerance);
    }
}

test("subspan2x2WithLast", () => {
    // points = [ (1, 2), (5, 2)] in the plane
    const points = new PointSet(2, 2, [1, 2, 5, 2]);

    // Sub-span containing point 1 (i.e., the last one)
    const span = new Subspan(2, points, 1);
    expect(span.isMember(0)).toBeFalsy();
    expect(span.isMember(1)).toBeTruthy();
    expect(span.globalIndex(0)).toBe(1);
    expect(span.size()).toBe(1);
    expect(span.representationError()).toBe(0);

    // Compute shortest vector to affine hull from a test point
    shortestVectorToHull(span, [0, 0], [5, 2]);

    // Add point 0
    span.add(0);
    expect(span.isMember(0)).toBeTruthy();
    expect(span.isMember(1)).toBeTruthy();
    expect(span.globalIndex(0)).toBe(0);
    expect(span.globalIndex(1)).toBe(1);
    expect(span.size()).toBe(2);
    expect(span.representationError()).toBeLessThanOrEqual(Tolerance);

    // Compute shortest vector to affine hull from a few test points

    shortestVectorToHull(span, [0, 0], [0, 2]);

    shortestVectorToHull(span, [4, 1], [0, 1]);

    shortestVectorToHull(span, [4, 2], [0, 0]);
});