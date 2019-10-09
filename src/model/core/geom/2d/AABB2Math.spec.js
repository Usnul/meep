import { aabb2_distanceToPoint } from "./AABB2Math.js";

test('aabb2_distanceToPoint', () => {
    expect(aabb2_distanceToPoint(0, 0, 0, 0, 0, 0)).toBeCloseTo(0);

    expect(aabb2_distanceToPoint(0, 0, 0, 0, 1, 0)).toBeCloseTo(1);
    expect(aabb2_distanceToPoint(0, 0, 0, 0, 0, 1)).toBeCloseTo(1);

    expect(aabb2_distanceToPoint(0, 0, 0, 0, 1, 1)).toBeCloseTo(1.41421356237);


    expect(aabb2_distanceToPoint(0, 0, 1, 1, 2, 0.5)).toBeCloseTo(1);
    expect(aabb2_distanceToPoint(0, 0, 1, 1, 0.5, 2)).toBeCloseTo(1);

    expect(aabb2_distanceToPoint(0, 0, 1, 1, -1, 0.5)).toBeCloseTo(1);
    expect(aabb2_distanceToPoint(0, 0, 1, 1, 0.5, -1)).toBeCloseTo(1);
});
