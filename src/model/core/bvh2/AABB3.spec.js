import {
    AABB3,
    deserializeAABB3,
    deserializeAABB3Quantized16Uint,
    serializeAABB3,
    serializeAABB3Quantized16Uint
} from "./AABB3";
import { BinaryBuffer } from "../binary/BinaryBuffer";


function compareBounds(expected, actual, numDigits = 10) {
    expect(actual.x0).toBeCloseTo(expected.x0, numDigits);
    expect(actual.y0).toBeCloseTo(expected.y0, numDigits);
    expect(actual.z0).toBeCloseTo(expected.z0, numDigits);
    expect(actual.x1).toBeCloseTo(expected.x1, numDigits);
    expect(actual.y1).toBeCloseTo(expected.y1, numDigits);
    expect(actual.z1).toBeCloseTo(expected.z1, numDigits);
}

test("binary serialization deserialization consistency", () => {
    const a = new AABB3(1, 0, -3, 5, 7, 11);

    const buffer = new BinaryBuffer();

    serializeAABB3(buffer, a);

    const b = new AABB3(2, 2, 2, 2, 2, 2);

    buffer.position = 0;

    deserializeAABB3(buffer, b);

    compareBounds(a, b);
});

test("binary quantized serialization deserialization consistency", () => {
    const a = new AABB3(1, 0, -3, 5, 7, 11);

    const buffer = new BinaryBuffer();

    serializeAABB3Quantized16Uint(buffer, a, -2, -3, -3, 5, 20, 20);

    const b = new AABB3(2, 2, 2, 2, 2, 2);

    buffer.position = 0;

    deserializeAABB3Quantized16Uint(buffer, b, -2, -3, -3, 5, 20, 20);

    compareBounds(a, b, 2);
});

test("equals works correctly", () => {
    const a = new AABB3(0, 1, 2, 3, 4, 5);

    const b = new AABB3(0, 1, 2, 3, 4, 5);

    const c = new AABB3(-1, 1, 2, 3, 4, 5);

    const d = new AABB3(0, -1, 2, 3, 4, 5);

    const e = new AABB3(0, 1, -1, 3, 4, 5);

    const f = new AABB3(0, 1, 2, 7, 4, 5);

    const g = new AABB3(0, 1, 2, 3, 7, 5);

    const h = new AABB3(0, 1, 2, 3, 4, 7);

    const k = new AABB3(7, 8, 9, 10, 11, 12);

    expect(a.equals(b)).toBeTruthy();

    expect(a.equals(c)).toBeFalsy();
    expect(c.equals(a)).toBeFalsy();

    expect(a.equals(d)).toBeFalsy();
    expect(d.equals(a)).toBeFalsy();

    expect(a.equals(e)).toBeFalsy();
    expect(e.equals(a)).toBeFalsy();

    expect(a.equals(f)).toBeFalsy();
    expect(f.equals(a)).toBeFalsy();

    expect(a.equals(g)).toBeFalsy();
    expect(g.equals(a)).toBeFalsy();

    expect(a.equals(h)).toBeFalsy();
    expect(h.equals(a)).toBeFalsy();

    expect(a.equals(k)).toBeFalsy();
    expect(k.equals(a)).toBeFalsy();
});
