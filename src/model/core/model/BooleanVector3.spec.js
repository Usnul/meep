import { BooleanVector3 } from "./BooleanVector3.js";

test("constructor doesn't throw", () => {
    new BooleanVector3()
});

test("constructor parameters are propagated correctly", () => {
    const a = new BooleanVector3(true, false, false);

    expect(a.x).toBe(true);
    expect(a.y).toBe(false);
    expect(a.z).toBe(false);

    const b = new BooleanVector3(false, true, false);

    expect(b.x).toBe(false);
    expect(b.y).toBe(true);
    expect(b.z).toBe(false);

    const c = new BooleanVector3(false, false, true);

    expect(c.x).toBe(false);
    expect(c.y).toBe(false);
    expect(c.z).toBe(true);
});

test("set works correctly", () => {
    const b = new BooleanVector3(false, false, false);

    expect(b.x).toBe(false);
    expect(b.y).toBe(false);
    expect(b.z).toBe(false);

    b.set(true, false, false);

    expect(b.x).toBe(true);
    expect(b.y).toBe(false);
    expect(b.z).toBe(false);

    b.set(false, true, false);

    expect(b.x).toBe(false);
    expect(b.y).toBe(true);
    expect(b.z).toBe(false);

    b.set(false, false, true);

    expect(b.x).toBe(false);
    expect(b.y).toBe(false);
    expect(b.z).toBe(true);
});
