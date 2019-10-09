import { ParameterLookupTable } from "./ParameterLookupTable.js";
import { BinaryBuffer } from "../../../../../core/binary/BinaryBuffer.js";

/**
 *
 * @returns {ParameterLookupTable}
 */
function sample_v4() {
    const lut = new ParameterLookupTable(4);

    lut.write([
        7, 2, -3, 11,
        13, -17, 19, 23,
        29, 31, 37, -41
    ], [0, 0.5, 1]);

    return lut;
}

test('hash method', () => {
    const lut = new ParameterLookupTable(1);

    const hashA = lut.hash();

    lut.write([1, 2, 3], [0, 0.5, 1]);

    const hashB = lut.hash();

    expect(hashA).not.toBe(hashB);

    //test stability
    expect(lut.hash()).toBe(hashB);

    //test small change
    lut.write([1, 2, 4], [0, 0.5, 1]);

    expect(lut.hash()).not.toBe(hashB);

    //hashes on numbers less than 1
    lut.write([0.1, 0.2], [0, 1]);

    const hashSmall = lut.hash();

    lut.write([0.3, 0.4], [0, 1]);

    expect(lut.hash()).not.toBe(hashSmall);
});

test('equals', () => {
    const a = new ParameterLookupTable(1);
    const b = new ParameterLookupTable(1);

    expect(a.equals(b)).toBe(true);
    expect(b.equals(a)).toBe(true);

    a.write([1], [0]);

    expect(a.equals(b)).toBe(false);

    b.write([1], [0]);

    expect(a.equals(b)).toBe(true);

    b.write([2], [0]);

    expect(a.equals(b)).toBe(false);

    a.write([2], [0]);

    expect(a.equals(b)).toBe(true);

    b.write([2], [0.5]);

    expect(a.equals(b)).toBe(false);

    a.write([2], [0.5]);

    expect(a.equals(b)).toBe(true);

    b.write([2, 3], [0.5, 1]);

    expect(a.equals(b)).toBe(false);

    const c = new ParameterLookupTable(1);
    const d = new ParameterLookupTable(3);

    expect(c.equals(d)).toBe(false);
});

test('json serialization consistency', () => {
    const a = new ParameterLookupTable(1);

    a.write([1, 2, 3], [0, 0.5, 1]);

    const json = a.toJSON();

    const b = new ParameterLookupTable(2);

    b.fromJSON(json);

    expect(b.equals(a));
});

describe('sampling', () => {

    test('non-uniform distribution', () => {
        const lut = new ParameterLookupTable(1);

        lut.write([7, 2, -3], [0, 0.8, 1]);

        const sample = [];

        lut.sample(0.5, sample);

        expect(sample).toEqual([3.875]);

        lut.sample(0.9, sample);

        expect(sample).toEqual([-0.5]);
    });

    test('sampling itemSize=1, 3 elements', () => {
        const lut = new ParameterLookupTable(1);

        lut.write([7, 2, -3], [0, 0.5, 1]);

        const sample = [];

        lut.sample(0, sample);

        expect(sample).toEqual([7]);

        lut.sample(1, sample);

        expect(sample).toEqual([-3]);

        lut.sample(0.5, sample);

        expect(sample).toEqual([2]);

        lut.sample(0.25, sample);

        expect(sample).toEqual([4.5]);

        lut.sample(0.75, sample);

        expect(sample).toEqual([-0.5]);
    });

    test('sampling itemSize=1, 1 element', () => {
        const lut = new ParameterLookupTable(1);

        lut.write([7], [0]);

        const sample = [];

        lut.sample(0, sample);

        expect(sample).toEqual([7]);

        lut.sample(1, sample);

        expect(sample).toEqual([7]);

        lut.sample(0.5, sample);

        expect(sample).toEqual([7]);
    });

    test('sampling itemSize=4, 3 elements', () => {
        const lut = sample_v4();
        const sample = [];

        lut.sample(0, sample);

        expect(sample).toEqual([7, 2, -3, 11]);

        lut.sample(1, sample);

        expect(sample).toEqual([29, 31, 37, -41]);

        lut.sample(0.5, sample);

        expect(sample).toEqual([13, -17, 19, 23]);

        lut.sample(0.25, sample);

        expect(sample).toEqual([10, -7.5, 8, 17]);

        lut.sample(0.75, sample);

        expect(sample).toEqual([21, 7, 28, -9]);
    });

});

test('BinaryBuffer serialization consistency', () => {
    const buffer = new BinaryBuffer();

    const expected = sample_v4();

    expected.toBinaryBuffer(buffer);

    buffer.position = 0;

    const actual = new ParameterLookupTable();

    actual.fromBinaryBuffer(buffer);

    expect(actual.itemSize).toEqual(expected.itemSize);

    expect(Array.from(actual.data)).toEqual(expected.data);

    expect(Array.from(actual.positions)).toEqual(expected.positions);
});