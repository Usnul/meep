import Vector2 from "./Vector2";

test("setting x and y via constructor", () => {
    const v = new Vector2(7, 13);

    expect(v.x).toBe(7);
    expect(v.y).toBe(13);
});

test('add works', () => {
    const a = new Vector2(1, 3);
    const b = new Vector2(5, 7);

    a.add(b);

    expect(a.x).toBe(6);
    expect(a.y).toBe(10);
});

test("add doesn't modify input", () => {
    const a = new Vector2(1, 3);
    const b = new Vector2(5, 7);

    a.add(b);

    expect(b.x).toBe(5);
    expect(b.y).toBe(7);
});

test("equals correctness", () => {
    const a = new Vector2(1, 3);
    const b = new Vector2(1, 7);
    const c = new Vector2(5, 3);
    const d = new Vector2(1, 3);

    expect(a.equals(b)).toBe(false);
    expect(a.equals(c)).toBe(false);

    expect(b.equals(a)).toBe(false);
    expect(c.equals(a)).toBe(false);

    expect(b.equals(c)).toBe(false);
    expect(c.equals(b)).toBe(false);

    expect(a.equals(d)).toBe(true);
    expect(d.equals(a)).toBe(true);
});

test("equals does not modify vectors", () => {
    const a = new Vector2(1, 3);
    const b = new Vector2(5, 7);

    a.equals(b);

    expect(a.x).toBe(1);
    expect(a.y).toBe(3);

    expect(b.x).toBe(5);
    expect(b.y).toBe(7);
});

test("onChange is not dispatched when same value is written via set", () => {

    const v = new Vector2(1, 3);

    const changeHandler = jest.fn();

    v.onChanged.add(changeHandler);

    v.set(1, 3);

    expect(changeHandler).not.toHaveBeenCalled();
});

test("onChange is dispatched when same value is written via set twice", () => {

    const v = new Vector2(1, 3);

    const changeHandler = jest.fn();

    v.onChanged.add(changeHandler);

    v.set(7, 13);

    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler).toHaveBeenLastCalledWith(7, 13, 1, 3);
    v.set(2, 5);

    expect(changeHandler).toHaveBeenCalledTimes(2);
    expect(changeHandler).toHaveBeenLastCalledWith(2, 5, 7, 13)
});

test("onChange is dispatched when x and y change via set", () => {
    const v = new Vector2(1, 3);

    const changeHandler = jest.fn();

    v.onChanged.add(changeHandler);

    v.set(5, 7);


    expect(changeHandler).toHaveBeenCalled();

    expect(changeHandler).toHaveBeenCalledTimes(1);

    expect(changeHandler).toHaveBeenLastCalledWith(5, 7, 1, 3);
});

test("onChange is dispatched when x changes via set", () => {
    const v = new Vector2(1, 3);

    const changeHandler = jest.fn();

    v.onChanged.add(changeHandler);

    v.set(2, 3);


    expect(changeHandler).toHaveBeenCalled();

    expect(changeHandler).toHaveBeenCalledTimes(1);

    expect(changeHandler).toHaveBeenLastCalledWith(2, 3, 1, 3);
});

test("onChange is dispatched when y changes via set", () => {
    const v = new Vector2(1, 3);

    const changeHandler = jest.fn();

    v.onChanged.add(changeHandler);

    v.set(2, 3);

    expect(changeHandler).toHaveBeenCalled();

    expect(changeHandler).toHaveBeenCalledTimes(1);

    expect(changeHandler).toHaveBeenLastCalledWith(2, 3, 1, 3);
});