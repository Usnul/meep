import { Color } from "./Color.js";

test('toUint', () => {
    const c = new Color();

    c.setRGB(1, 0, 0);

    expect(c.toUint()).toBe(0xFF0000);

    c.setRGB(0, 1, 0);

    expect(c.toUint()).toBe(0x00FF00);

    c.setRGB(0, 0, 1);

    expect(c.toUint()).toBe(0x0000FF);
});

test('fromUint', () => {
    const c = new Color();

    c.fromUint(0xFF0000);
    expect(c.r).toBe(1);
    expect(c.g).toBe(0);
    expect(c.b).toBe(0);

    c.fromUint(0x00FF00);
    expect(c.r).toBe(0);
    expect(c.g).toBe(1);
    expect(c.b).toBe(0);

    c.fromUint(0x0000FF);
    expect(c.r).toBe(0);
    expect(c.g).toBe(0);
    expect(c.b).toBe(1);
});


test('toUint, fromUint consistency', () => {
    const c = new Color();

    c.fromUint(0xCAFEB1);

    expect(c.toUint()).toBe(0xCAFEB1);
});

test("setHSV white", () => {
    const c = new Color();

    c.setHSV(0, 0, 1);

    expect(c.r).toBeCloseTo(1);
    expect(c.g).toBeCloseTo(1);
    expect(c.b).toBeCloseTo(1);
});
