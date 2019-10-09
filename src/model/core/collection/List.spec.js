import List from "./List.js";

class DummyNumber {
    constructor(n) {
        this.v = n;
    }

    equals(o) {
        return o.v === this.v;
    }
}

test("constructor doesn't throw", () => {
    expect(() => new List()).not.toThrow();
});

test("new instance has length 0", () => {
    const list = new List();

    expect(list.length).toBe(0);
});

test("removeOneOf undefined from empty", () => {
    const list = new List();

    expect(list.removeOneOf(undefined)).toBe(false);
});

test("removeOneOf undefined from [undefined]", () => {
    const list = new List([undefined]);

    expect(list.removeOneOf(undefined)).toBe(true);

    expect(list.isEmpty()).toBe(true);
});

test("removeOneOf undefined from [undefined, undefined]", () => {
    const list = new List([undefined, undefined]);

    expect(list.removeOneOf(undefined)).toBe(true);

    expect(list.isEmpty()).toBe(false);
    expect(list.length).toBe(1);
});

test("removeAll via Object.equals", () => {
    const list = new List([new DummyNumber(1), new DummyNumber(2), new DummyNumber(3)]);

    expect(
        list.removeAll([
            new DummyNumber(1),
            new DummyNumber(3)
        ])
    ).toBe(true);

    expect(list.length).toBe(1);

    expect(list.get(0).v).toBe(2);
});

test("isEmpty works correctly", () => {
    const list = new List();

    expect(list.isEmpty()).toBe(true);

    list.add(1);

    expect(list.isEmpty()).toBe(false);
});

test("get returns correct elements", () => {
    const list = new List([1, 2, 3]);

    expect(list.get(0)).toBe(1);

    expect(list.get(1)).toBe(2);

    expect(list.get(2)).toBe(3);
});

test("'set' at the end of the list", () => {
    const list = new List();

    const addHandler = jest.fn();

    list.on.added.add(addHandler);

    list.set(0, 42);

    expect(list.length).toBe(1);

    expect(addHandler).toHaveBeenCalledTimes(1);
    expect(addHandler).toHaveBeenLastCalledWith(42, 0);
});

test("add increases length", () => {
    const list = new List();

    expect(list.length).toBe(0);

    list.add(1);

    expect(list.length).toBe(1);

    list.add(1);

    expect(list.length).toBe(2);
});
