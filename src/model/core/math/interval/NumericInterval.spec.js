import { NumericInterval } from "./NumericInterval.js";

test("constructor parameters propagation", () => {
    const sut = new NumericInterval(-3, 7);

    expect(sut.min).toBe(-3);
    expect(sut.max).toBe(7);
});

test("set works correctly", () => {
    const sut = new NumericInterval(0, 0);

    sut.set(-3, 7);

    expect(sut.min).toBe(-3);
    expect(sut.max).toBe(7);

    sut.set(-1, 7);

    expect(sut.min).toBe(-1);
    expect(sut.max).toBe(7);

    sut.set(-1, 11);

    expect(sut.min).toBe(-1);
    expect(sut.max).toBe(11);
});

test("multiplyScalar", () => {
    const sut = new NumericInterval(-3, 7);

    sut.multiplyScalar(1);

    expect(sut.min).toBe(-3);
    expect(sut.max).toBe(7);

    sut.multiplyScalar(2);

    expect(sut.min).toBe(-6);
    expect(sut.max).toBe(14);

    sut.multiplyScalar(-2);

    expect(sut.min).toBe(-28);
    expect(sut.max).toBe(12);
});

test("isZero", () => {
    const sut = new NumericInterval(-3, 7);

    expect(sut.isZero()).toBe(false);

    sut.set(0, 1);

    expect(sut.isZero()).toBe(false);

    sut.set(-1, 0);

    expect(sut.isZero()).toBe(false);

    sut.set(0, 0);

    expect(sut.isZero()).toBe(true);
});

test("normalizeValue", () => {
    const sut = new NumericInterval(-1, 1);

    expect(sut.normalizeValue(-1)).toBe(0);
    expect(sut.normalizeValue(1)).toBe(1);
    expect(sut.normalizeValue(0)).toBeCloseTo(0.5);
});

test("sampleRandom", () => {
    const sut = new NumericInterval(-3, 7);

    expect(sut.sampleRandom(() => 0)).toBe(-3);
    expect(sut.sampleRandom(() => 1)).toBe(7);
    expect(sut.sampleRandom(() => 0.5)).toBeCloseTo(2);
});
