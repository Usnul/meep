import { computeFileExtension, computePathBase } from "./FilePath.js";

test('extract extension of cat.txt', () => {
    expect(computeFileExtension('cat.txt')).toEqual('txt');
});

test('extract extension of ../hmm/cat.txt', () => {
    expect(computeFileExtension('../hmm/cat.txt')).toEqual('txt');
});

test('extract extension of empty string', () => {
    expect(computeFileExtension('')).toBeNull();
});

test('extract base path of empty string', () => {
    expect(computePathBase('')).toBe('');
});

test('extract base path of hello', () => {
    expect(computePathBase('hello')).toBe('hello');
});

test('extract base path of hello/there/world', () => {
    expect(computePathBase('hello/there/world')).toBe('world');
});