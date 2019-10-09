import { ParameterLookupTable } from "./ParameterLookupTable.js";
import { ParticleParameter } from "./ParticleParameter.js";
import { ParameterSet } from "./ParameterSet.js";
import { BinaryBuffer } from "../../../../../core/binary/BinaryBuffer.js";

/**
 *
 * @returns {ParameterSet}
 */
function sampleA() {
    const parameter = new ParticleParameter();
    parameter.itemSize = 1;
    parameter.name = 'hello';

    parameter.setDefault([1, 2], [0, 1]);
    parameter.setTrackCount(1);

    const lut = new ParameterLookupTable();
    lut.itemSize = 1;
    lut.write([7], [0]);

    parameter.setTrack(0, lut);

    const set = new ParameterSet();

    set.add(parameter);

    return set;
}

test('equals', () => {
    const one = sampleA();
    const two = sampleA();

    const three = new ParameterSet();

    expect(one.equals(two)).toBe(true);

    expect(one.equals(three)).toBe(false);
});

test('hash', () => {
    const one = sampleA();
    const two = sampleA();

    const three = new ParameterSet();

    expect(one.hash()).toBe(two.hash());

    expect(three.hash()).not.toBe(one.hash());
});


test('BinaryBuffer serialization consistency', () => {
    const buffer = new BinaryBuffer();

    const expected = sampleA();

    expected.toBinaryBuffer(buffer);

    buffer.position = 0;

    const actual = new ParameterSet();

    actual.fromBinaryBuffer(buffer);

    const actualParameter = actual.getParameterByName('hello');
    expect(actualParameter).not.toBeUndefined();

    const expectedParameter = expected.getParameterByName('hello');

    expect(actualParameter.itemSize).toBe(expectedParameter.itemSize);

    expect(actualParameter.name).toBe(expectedParameter.name);
});