import { Sampler2D } from "./Sampler2D";
import Vector4 from "../../../core/geom/Vector4.js";

test("constructor arguments", () => {
    const uint8Array = new Uint8Array(24);
    const ut = new Sampler2D(uint8Array, 4, 2, 3);

    expect(ut.width).toBe(2);
    expect(ut.height).toBe(3);
    expect(ut.itemSize).toBe(4);
    expect(ut.data).toBe(uint8Array);
});

test("get method v1 1x1", () => {
    const uint8Array = new Uint8Array(1);

    uint8Array[0] = 7;

    const ut = new Sampler2D(uint8Array, 1, 1, 1);

    expect(ut.get(0, 0)).toBe(7);
});

test("resize uint8 v1 1x1 to 2x3", () => {
    const s = Sampler2D.uint8(1, 1, 1);

    s.set(0, 0, [1]);

    s.resize(2, 3);

    expect(s.width).toBe(2);
    expect(s.height).toBe(3);

    //old data is preserved
    expect(s.get(0, 0)).toBe(1);

    expect(s.data.length).toBe(6);
});

test("resize uint8 v1 1x2 to 2x3", () => {
    const s = Sampler2D.uint8(1, 1, 2);

    s.set(0, 0, [1]);
    s.set(0, 1, [3]);

    s.resize(2, 3);

    expect(s.width).toBe(2);
    expect(s.height).toBe(3);

    //old data is preserved
    expect(s.get(0, 0)).toBe(1);
    expect(s.get(0, 1)).toBe(3);

    expect(s.data.length).toBe(6);
});

test("resize uint8 v1 2x3 to 1x2", () => {
    const s = Sampler2D.uint8(1, 2, 3);

    s.set(0, 0, [1]);
    s.set(0, 1, [3]);

    s.resize(1, 2);

    expect(s.width).toBe(1);
    expect(s.height).toBe(2);

    //old data is preserved
    expect(s.get(0, 0)).toBe(1);
    expect(s.get(0, 1)).toBe(3);

    expect(s.data.length).toBe(2);
});

test("get method v1 2x2", () => {
    const uint8Array = new Uint8Array(4);

    uint8Array[0] = 7;
    uint8Array[1] = 11;
    uint8Array[2] = 13;
    uint8Array[3] = 5;

    const ut = new Sampler2D(uint8Array, 1, 2, 2);

    expect(ut.get(0, 0)).toBe(7);
    expect(ut.get(1, 0)).toBe(11);
    expect(ut.get(0, 1)).toBe(13);
    expect(ut.get(1, 1)).toBe(5);
});


test('set and get consistency itemSize=4, 2x2', () => {
    const ut = Sampler2D.uint8(4, 2, 2);


    ut.set(0, 0, [1, 2, 3, 4]);
    ut.set(1, 0, [5, 6, 7, 8]);
    ut.set(0, 1, [9, 10, 11, 12]);
    ut.set(1, 1, [13, 14, 15, 16]);


    const sample = new Vector4();

    ut.get(0, 0, sample);

    expect(sample.asArray()).toEqual([1, 2, 3, 4]);

    ut.get(1, 0, sample);

    expect(sample.asArray()).toEqual([5, 6, 7, 8]);

    ut.get(0, 1, sample);

    expect(sample.asArray()).toEqual([9, 10, 11, 12]);

    ut.get(1, 1, sample);

    expect(sample.asArray()).toEqual([13, 14, 15, 16]);
});

test('computeMax itemSize=1, 0x0', () => {
    const ut = Sampler2D.int8(1, 0, 0);

    expect(ut.computeMax(0)).toEqual(undefined);
});

test('computeMax itemSize=1, 1x1', () => {
    const ut = Sampler2D.int8(1, 1, 1);

    ut.set(0, 0, [7]);

    expect(ut.computeMax(0)).toEqual({ value: 7, x: 0, y: 0, index: 0 });
});

test('computeMax itemSize=1, 2x2', () => {
    const ut = Sampler2D.int8(1, 2, 2);

    ut.set(0, 0, [3]);
    ut.set(1, 0, [-7]);
    ut.set(0, 1, [7]);
    ut.set(1, 1, [4]);

    expect(ut.computeMax(0)).toEqual({ value: 7, x: 0, y: 1, index: 2 });
});

test('computeMax itemSize=2, 2x2', () => {
    const ut = Sampler2D.int8(2, 2, 2);

    ut.set(0, 0, [3, 8]);
    ut.set(1, 0, [-7, 13]);
    ut.set(0, 1, [7, 1]);
    ut.set(1, 1, [4, -3]);

    expect(ut.computeMax(0)).toEqual({ value: 7, x: 0, y: 1, index: 4 });

    expect(ut.computeMax(1)).toEqual({ value: 13, x: 1, y: 0, index: 3 });
});

test('Sampler2.combine ADD', () => {
    const s0 = new Sampler2D([
        1, 2,
        3, 4,
        5, 6,
        7, 8
    ], 2, 2, 2);

    const s1 = new Sampler2D([
        11, 13,
        17, 19,
        23, 29,
        31, 37
    ], 2, 2, 2);

    const ut = new Sampler2D(new Array(8), 2, 2, 2);

    Sampler2D.combine(s0, s1, ut, function (arg0, arg1, res, index) {
        res[0] = arg0[0] + arg1[0];
        res[1] = arg0[1] + arg1[1];
    });

    expect(ut.data).toEqual([
        12, 15,
        20, 23,
        28, 35,
        38, 45
    ]);
});

describe("copy method", () => {
    test("entire other sampler of same size", () => {
        const target = Sampler2D.uint8(1, 1, 1);
        target.data[0] = 1;

        const source = Sampler2D.uint8(1, 1, 1);
        source.data[0] = 2;

        target.copy(source, 0, 0, 0, 0, 1, 1);

        expect(target.data[0]).toBe(2);

        //source is untouched
        expect(source.data[0]).toBe(2);
    });

    test("entire other smaller sampler into the middle", () => {
        const target = Sampler2D.uint8(1, 3, 3);

        const source = Sampler2D.uint8(1, 1, 1);
        source.data[0] = 2;


        target.copy(source, 0, 0, 1, 1, 1, 1);

        expect(target.get(1, 1)).toBe(2);
    });
});

describe("copyWithMargin method", () => {
    test("one texel patch with 1 texel margin all around", () => {
        const target = Sampler2D.uint8(1, 3, 3);
        target.data[0] = 1;

        const source = Sampler2D.uint8(1, 1, 1);
        source.data[0] = 2;

        target.copyWithMargin(source, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1);

        //top left
        expect(target.get(0, 0)).toEqual(2);
        //top
        expect(target.get(1, 0)).toEqual(2);
        //top right
        expect(target.get(2, 0)).toEqual(2);
        //left
        expect(target.get(0, 1)).toEqual(2);
        //copied region
        expect(target.get(1, 1)).toEqual(2);
        //right
        expect(target.get(2, 1)).toEqual(2);
        //bottom left
        expect(target.get(0, 2)).toEqual(2);
        //bottom
        expect(target.get(1, 2)).toEqual(2);
        //bottom right
        expect(target.get(2, 2)).toEqual(2);
    });
});
