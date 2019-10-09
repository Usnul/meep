import Vector1 from "./Vector1.js";

test("Set value and read it back", () => {
    const v = new Vector1(1);

    expect(v.getValue()).toBe(1);

    v.set(7);

    expect(v.getValue()).toBe(7);

    v.set(0);

    expect(v.getValue()).toBe(0);

    v.set(-7);

    expect(v.getValue()).toBe(-7);

    //redundant operation, expected no change
    v.set(-7);

    expect(v.getValue()).toBe(-7);
});

test('JSON serialization consistency', () => {
    const a = new Vector1(42);

    const jA = a.toJSON();

    const b = new Vector1();

    b.fromJSON(jA);

    expect(b.getValue()).toBe(a.getValue());
});

test("add Vector1", () => {
    const a = new Vector1(3);

    a.add(new Vector1(5));

    expect(a.getValue()).toBe(8);

    a.add(new Vector1(-5));

    expect(a.getValue()).toBe(3);
});

test("multiply Vector1", () => {
    const a = new Vector1(3);

    a.multiply(new Vector1(-5));

    expect(a.getValue()).toBe(-15);
});

test("Number interface", () => {
    const a = new Vector1(7);

    expect(a + 1).toBe(8);

    expect(a > 0).toBe(true);

    expect(a == 7).toBe(true);
});

test("toString", () => {
    const a = new Vector1(3);

    const s = a.toString();

    expect(typeof s).toBe('string');
});
