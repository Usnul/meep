import Quaternion from "./Quaternion.js";
import Vector3 from "./Vector3.js";

/**
 *
 * @param {Quaternion} expected
 * @param {Quaternion} actual
 * @param {number} [numDigits]
 */
function expectRoughlyEquals(actual, expected, numDigits = 2) {

    expect(actual.x).toBeCloseTo(expected.x, numDigits);
    expect(actual.y).toBeCloseTo(expected.y, numDigits);
    expect(actual.z).toBeCloseTo(expected.z, numDigits);
    expect(actual.w).toBeCloseTo(expected.w, numDigits);
}

test('equals', () => {
    const a = new Quaternion(1, 2, 3, 4);

    const b = new Quaternion(2, 2, 3, 4);
    const c = new Quaternion(1, 3, 3, 4);
    const d = new Quaternion(1, 2, 4, 4);
    const e = new Quaternion(1, 2, 3, 3);

    const f = new Quaternion(1, 2, 3, 4);

    expect(a.equals(f)).toBe(true);

    expect(a.equals(b)).toBe(false);
    expect(a.equals(c)).toBe(false);
    expect(a.equals(d)).toBe(false);
    expect(a.equals(e)).toBe(false);
});

test('empty constructor', () => {
    const q = new Quaternion();

    expect(q.x).toBe(0);
    expect(q.y).toBe(0);
    expect(q.z).toBe(0);
    expect(q.w).toBe(1);
});

test('constructor parameter passing', () => {
    const q = new Quaternion(3, 7, -1, 13);

    expect(q.x).toBe(3);
    expect(q.y).toBe(7);
    expect(q.z).toBe(-1);
    expect(q.w).toBe(13);
});

test('multiply quaternions', () => {
    const a = new Quaternion(1, 2, 3, 4);

    const b = new Quaternion(5, 6, 7, 8);

    const c = new Quaternion();

    c.multiplyQuaternions(a, b);

    expect(c.toJSON()).toEqual({
        x: 24,
        y: 48,
        z: 48,
        w: -6
    });
});

test('fromUnitVectors2', () => {
    const q = new Quaternion();

    const v = new Vector3();

    function check(v0, v1) {

        q.fromUnitVectors2(v0, v1);

        v.copy(v0);

        v.applyQuaternion(q);

        expect(v.roughlyEquals(v1)).toBe(true);
    }

    check(Vector3.up, Vector3.up);
    check(Vector3.down, Vector3.down);
    check(Vector3.left, Vector3.left);
    check(Vector3.right, Vector3.right);
    check(Vector3.forward, Vector3.forward);
    check(Vector3.back, Vector3.back);

    // Check axis-aligned 90deg rotations
    check(Vector3.up, Vector3.forward);
    check(Vector3.up, Vector3.back);
    check(Vector3.up, Vector3.left);
    check(Vector3.up, Vector3.right);

    check(Vector3.down, Vector3.forward);
    check(Vector3.down, Vector3.back);
    check(Vector3.down, Vector3.left);
    check(Vector3.down, Vector3.right);

    check(Vector3.left, Vector3.up);
    check(Vector3.left, Vector3.down);
    check(Vector3.left, Vector3.forward);
    check(Vector3.left, Vector3.back);

    check(Vector3.right, Vector3.up);
    check(Vector3.right, Vector3.down);
    check(Vector3.right, Vector3.forward);
    check(Vector3.right, Vector3.back);

    // check opposites
    check(Vector3.forward, Vector3.back);
    check(Vector3.back, Vector3.forward);

    check(Vector3.up, Vector3.down);
    check(Vector3.down, Vector3.up);

    check(Vector3.left, Vector3.right);
    check(Vector3.right, Vector3.left);

});


test('encoding to Uint32 consistency', () => {

    function check(x, y, z, w) {
        const a = new Quaternion(x, y, z, w);

        a.normalize();

        const b = new Quaternion(0, 0, 0, 1);

        const encoded = a.encodeToUint32();

        b.decodeFromUint32(encoded);

        expectRoughlyEquals(b, a);
    }

    check(1, 2, 3, 4);
    check(1, 2, 4, 3);
    check(1, 4, 2, 3);
    check(4, 1, 2, 3);
    check(1, 3, 2, 4);
    check(3, 1, 2, 4);

    check(0, 0, 0, 1);
    check(0, 0, 1, 0);
    check(0, 1, 0, 0);
    check(1, 0, 0, 0);
});
