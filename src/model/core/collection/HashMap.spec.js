import { HashMap } from "./HashMap.js";

/**
 *
 * @returns {HashMap}
 */
function makeA() {
    return new HashMap({
        keyHashFunction(k) {
            return 1;
        },
        keyEqualityFunction(a, b) {
            return a === b;
        }
    });
}

test('put and get same value', () => {
    const m = makeA();

    m.set("hey", 42);

    expect(m.size).toBe(1);

    expect(m.get("hey")).toBe(42);
});

test("map has a key", () => {
    const m = makeA();

    expect(m.has('cat')).toBe(false);

    m.set('cat', 1);

    expect(m.has('cat')).toBe(true);
});

test("put 2 values with same hash", () => {


    const m = makeA();

    m.set("a", 7);
    m.set("b", 42);

    expect(m.size).toBe(2);

    expect(m.get("a")).toBe(7);
    expect(m.get("b")).toBe(42);
});