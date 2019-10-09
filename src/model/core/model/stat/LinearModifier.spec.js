import LinearModifier from "./LinearModifier.js";
import { StatModifierSource } from "./StatModifierSource.js";

test("constructor doesn't throw", () => {
    new LinearModifier(1, 1);
});

test("constructor parameter propagation", () => {
    const m = new LinearModifier(3, -7);

    expect(m.a).toBe(3);
    expect(m.b).toBe(-7);
});

test("equals method", () => {
    const a = new LinearModifier(3, -7);
    a.source = StatModifierSource.Unknown;

    const b = new LinearModifier(3, -7);
    b.source = StatModifierSource.Affliction;

    const c = new LinearModifier(3, 11);
    c.source = StatModifierSource.Unknown;

    const d = new LinearModifier(13, -7);
    d.source = StatModifierSource.Unknown;

    const e = new LinearModifier(3, -7);
    e.source = StatModifierSource.Unknown;

    expect(a.equals(e)).toBe(true);
    expect(a.equals(b)).toBe(false);
    expect(a.equals(c)).toBe(false);
    expect(a.equals(d)).toBe(false);
});
