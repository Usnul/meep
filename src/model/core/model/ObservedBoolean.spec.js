import ObservedBoolean from "./ObservedBoolean.js";

test("invert", () => {
    const b = new ObservedBoolean(false);

    b.invert();

    expect(b.getValue()).toEqual(true);

    b.invert();

    expect(b.getValue()).toEqual(false);
});

test("set works correctly", () => {
    const b = new ObservedBoolean(false);

    b.set(true);

    expect(b.getValue()).toBe(true);

    b.set(false);

    expect(b.getValue()).toBe(false);
});

test("onChanged triggered correctly", () => {
    const b = new ObservedBoolean(false);

    const fn = jest.fn();

    b.onChanged.add(fn);

    //should not trigger change
    b.set(false);

    expect(fn).not.toBeCalled();

    b.set(true);

    expect(fn).toHaveBeenCalledTimes(1);

    b.set(true);

    expect(fn).toHaveBeenCalledTimes(1);

    b.set(false);

    expect(fn).toHaveBeenCalledTimes(2);
});

test("to/from JSON serialization consistency", () => {
    const t = new ObservedBoolean(true);
    const f = new ObservedBoolean(false);

    const temp = new ObservedBoolean(false);

    temp.fromJSON(t.toJSON());

    expect(temp.equals(t)).toBe(true);

    temp.fromJSON(f.toJSON());

    expect(temp.equals(f)).toBe(true);
});

test("equals", () => {
    const aT = new ObservedBoolean(true);
    const aF = new ObservedBoolean(false);

    const bT = new ObservedBoolean(true);
    const bF = new ObservedBoolean(false);

    expect(aT.equals(aT)).toBe(true);
    expect(aT.equals(aF)).toBe(false);
    expect(aT.equals(bT)).toBe(true);

    expect(aF.equals(aT)).toBe(false);
    expect(aF.equals(bF)).toBe(true);
});
