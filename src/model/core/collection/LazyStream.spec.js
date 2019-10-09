import { lazyArrayMap } from "./LazyStream.js";

test('lazyArrayMap', () => {
    const source = [1, 2, 3];

    const map = lazyArrayMap(source, a => a * 2);

    expect(map.length).toBe(source.length);

    for (let i = 0; i < source.length; i++) {
        expect(map[i]).toBe(source[i] * 2);
    }
});