import { computePointDistanceToPlane } from "./Plane.js";

test('computePointDistanceToPlane', () => {
    expect(computePointDistanceToPlane(1, 0, 0, 1, 0, 0, 0)).toBe(-1);
    expect(computePointDistanceToPlane(-1, 0, 0, 1, 0, 0, 0)).toBe(1);

    expect(computePointDistanceToPlane(0, 1, 0, 0, 1, 0, 0)).toBe(-1);
    expect(computePointDistanceToPlane(0, -1, 0, 0, 1, 0, 0)).toBe(1);

    expect(computePointDistanceToPlane(0, 0, 1, 0, 0, 1, 0)).toBe(-1);
    expect(computePointDistanceToPlane(0, 0, -1, 0, 0, 1, 0)).toBe(1);
});