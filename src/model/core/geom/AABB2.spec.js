import AABB2 from "./AABB2.js";

test('copy', () => {
    const a = new AABB2(1, 2, 5, 11);

    const b = new AABB2();

    b.copy(a);

    expect(b.x0).toBe(1);
    expect(b.y0).toBe(2);
    expect(b.x1).toBe(5);
    expect(b.y1).toBe(11);
});

test('clone', () => {
    const aabb2 = new AABB2(1, 3, 5, 7);

    const clone = aabb2.clone();

    expect(clone.x0).toBe(1);
    expect(clone.y0).toBe(3);
    expect(clone.x1).toBe(5);
    expect(clone.y1).toBe(7);
});

test('move', () => {
    const aabb2 = new AABB2(1, 3, 5, 7);

    aabb2.move(1, 2);

    expect(aabb2.x0).toBe(2);
    expect(aabb2.y0).toBe(5);
    expect(aabb2.x1).toBe(6);
    expect(aabb2.y1).toBe(9);
});

test('equals', () => {
    const a = new AABB2(1, 3, 5, 7);
    const b = new AABB2(1, 3, 5, 7);

    const c = new AABB2(-1, 3, 5, 7);
    const d = new AABB2(1, -3, 5, 7);
    const e = new AABB2(1, 3, 15, 7);
    const f = new AABB2(1, 3, 5, 17);

    expect(a.equals(b)).toBe(true);

    expect(a.equals(c)).toBe(false);
    expect(a.equals(d)).toBe(false);
    expect(a.equals(e)).toBe(false);
    expect(a.equals(f)).toBe(false);
});