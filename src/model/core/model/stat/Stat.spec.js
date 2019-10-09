import Stat from "./Stat.js";
import LinearModifier from "./LinearModifier.js";

test("constructor", () => {
    const s = new Stat(42);

    expect(s.getValue()).toBe(42);
});

test("equals", () => {
    const a = new Stat(42);
    const b = new Stat(42);

    expect(a.equals(b)).toBe(true);

    const c = new Stat(21);

    expect(a.equals(c)).toBe(false);

    c.addModifier(new LinearModifier(2, 0));

    expect(a.equals(c)).toBe(true);
});

test("order of modifiers doesn't matter", () => {
    const a = new LinearModifier(3, 7);
    const b = new LinearModifier(11, -13);
    const c = new LinearModifier(-17, 19);
    const d = new LinearModifier(-23, -29);

    const combinations = [
        [a, b, c, d],
        [a, b, d, c],
        [a, d, c, b],
        [a, d, b, c],
        [a, c, b, d],
        [a, c, d, b],

        [b, a, c, d],
        [b, a, d, c],
        [b, c, a, d],
        [b, c, d, a],
        [b, d, a, c],
        [b, d, c, a],

        [c, a, b, d],
        [c, a, d, b],
        [c, b, a, d],
        [c, b, d, a],
        [c, d, a, b],
        [c, d, b, a],

        [d, a, b, c],
        [d, a, c, b],
        [d, b, a, c],
        [d, b, c, a],
        [d, c, a, b],
        [d, c, b, a],
    ];

    for (let i = 0; i < combinations.length; i++) {

        const combination = combinations[i];
        const s = new Stat(1);

        for (let j = 0; j < combination.length; j++) {

            const mod = combination[j];

            s.addModifier(mod)
        }

        expect(s.getValue()).toEqual(-45);
    }
});
