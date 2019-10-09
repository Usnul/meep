import { BinaryBuffer } from "../binary/BinaryBuffer.js";
import ObservedInteger from "./ObservedInteger.js";

test('BinaryBuffer serialization consistency', () => {
    function tryValue(value) {
        const buffer = new BinaryBuffer();

        const expected = new ObservedInteger(value);

        const actual = new ObservedInteger(value + 1);

        expected.toBinaryBuffer(buffer);

        buffer.position = 0;

        actual.fromBinaryBuffer(buffer);

        expect(actual.getValue()).toBe(expected.getValue());
    }

    tryValue(0);
    tryValue(1);
    tryValue(-1);

    tryValue(Infinity);
    tryValue(-Infinity);
});

test("increment should work correctly", () => {
    const i = new ObservedInteger(0);

    i.increment();

    expect(i.getValue()).toBe(1);

    i.increment();

    expect(i.getValue()).toBe(2);
});

test("decrement works", ()=> {
    const i = new ObservedInteger(1);

    i.decrement();

    expect(i.getValue()).toBe(0);

    i.decrement();

    expect(i.getValue()).toBe(-1);
});
