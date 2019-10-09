import { BinaryBuffer } from "./BinaryBuffer.js";

test("writeFloat64Array", () => {
    const buffer = new BinaryBuffer();

    const expected = [1.7, 2, 3, 4.5];
    for (let i = 0; i < expected.length; i++) {
        buffer.writeFloat64(expected[i]);
    }

    buffer.position = 0;

    const actual = [];

    buffer.readFloat64Array(actual, 0, expected.length);

    expect(actual).toEqual(expected);
});

test("writeUintVar 42", () => {
    const buffer = new BinaryBuffer();

    buffer.writeUintVar(42);

    //only one byte
    expect(buffer.position).toBe(1);

    buffer.position = 0;

    const v = buffer.readUint8();

    expect(v).toBe(42);
});

test("writeUintVar 255", () => {
    const buffer = new BinaryBuffer();

    buffer.writeUintVar(255);

    //only one byte
    expect(buffer.position).toBe(2);

    buffer.position = 0;

    const v = buffer.readUint16LE();

    expect(v).toBe(0b111111111);
});

test("UintVar write/read consistency", () => {

    const buffer = new BinaryBuffer();

    function check(expected) {
        buffer.position = 0;

        buffer.writeUintVar(expected);

        buffer.position = 0;

        const actual = buffer.readUintVar();

        //validate
        expect(actual).toBe(expected);
    }

    check(0);
    check(1);
    check(42);
    check(127);

    check(128);

    check(65536); //2^16
    check(2147483647); //2^31-1
});

test('string read write consistency, short', () => {
    const buffer = new BinaryBuffer();

    const expected = "hello Mr kitty cat!";
    buffer.writeUTF8String(expected);

    buffer.position = 0;

    const actual = buffer.readUTF8String();

    expect(actual).toBe(expected);
});

test('string read write consistency, empty', () => {
    const buffer = new BinaryBuffer();

    const expected = "";
    buffer.writeUTF8String(expected);

    buffer.position = 0;

    const actual = buffer.readUTF8String();

    expect(actual).toBe(expected);
});

test('string read write consistency, complex', () => {
    const buffer = new BinaryBuffer();

    const expected = "Testing «Iñtërnâtiônàlizætiøn»: 1<2 & 4+1>3, now 20% off!";
    buffer.writeUTF8String(expected);

    buffer.position = 0;

    const actual = buffer.readUTF8String();

    expect(actual).toEqual(expected);
});

test('string read write consistency, russian', () => {
    const buffer = new BinaryBuffer();

    const expected = "Добрый день товарищ";
    buffer.writeUTF8String(expected);

    buffer.position = 0;

    const actual = buffer.readUTF8String();

    expect(actual).toEqual(expected);
});

test('string read write consistency, null', () => {
    const buffer = new BinaryBuffer();

    const expected = null;
    buffer.writeUTF8String(expected);

    buffer.position = 0;

    const actual = buffer.readUTF8String();

    expect(actual).toEqual(expected);
});

test('string read write consistency, undefined', () => {
    const buffer = new BinaryBuffer();

    const expected = undefined;
    buffer.writeUTF8String(expected);

    buffer.position = 0;

    const actual = buffer.readUTF8String();

    expect(actual).toEqual(expected);
});

test('string read write, multiple', () => {

    const buffer = new BinaryBuffer();

    buffer.writeUTF8String('a');
    buffer.writeUTF8String('b');

    buffer.position = 0;

    expect(buffer.readUTF8String()).toBe('a');
    expect(buffer.readUTF8String()).toBe('b');
});
