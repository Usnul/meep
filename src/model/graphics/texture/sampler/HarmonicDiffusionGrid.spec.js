import { HarmonicDiffusionGrid } from "./HarmonicDiffusionGrid.js";
import { randomIntegerBetween, seededRandom } from "../../../core/math/MathUtils.js";

test("constructor doesn't throw", () => {
    new HarmonicDiffusionGrid([], 0, 0);
});

test("step 1x1 unassigned", () => {
    const grid = new HarmonicDiffusionGrid([7], 1, 1);

    grid.step();

    expect(grid.data.length).toEqual(1);
});

test("step 1x1 assigned", () => {
    const grid = new HarmonicDiffusionGrid([7], 1, 1);

    grid.assign(0, 0, 13);

    grid.step();

    expect(grid.data).toEqual([13]);
});

test("step 3x3 edges assigned", () => {
    const grid = new HarmonicDiffusionGrid(new Array(9).fill(0), 3, 3);

    grid.assign(0, 0, 1);
    grid.assign(1, 0, 2);
    grid.assign(2, 0, 3);

    grid.assign(0, 1, 4);
    grid.assign(2, 1, 6);

    grid.assign(0, 2, 7);
    grid.assign(1, 2, 8);
    grid.assign(2, 2, 9);

    grid.step();

    expect(grid.data).toEqual([
        1, 2, 3,
        4, 5, 6,
        7, 8, 9
    ]);
});

test("20 step 3x1, corner assigned", () => {
    const grid = new HarmonicDiffusionGrid(new Array(3).fill(0), 3, 1);

    grid.assign(0, 0, 5);

    for (let i = 0; i < 20; i++) {
        grid.step();
    }

    expect(grid.data[0]).toBe(5);
    expect(grid.data[1]).toBeCloseTo(5);
    expect(grid.data[2]).toBeCloseTo(5);
});

test("20 step 4x1, corners assigned", () => {
    const grid = new HarmonicDiffusionGrid(new Array(4).fill(0), 4, 1);

    grid.assign(0, 0, 5);
    grid.assign(3, 0, -7);

    for (let i = 0; i < 20; i++) {
        grid.step();
    }

    expect(grid.data[0]).toBe(5);
    expect(grid.data[1]).toBeCloseTo(1);
    expect(grid.data[2]).toBeCloseTo(-3);
    expect(grid.data[3]).toBe(-7);
});

test("performance 512x512", () => {
    const w = 139;
    const h = 139;

    const grid = new HarmonicDiffusionGrid(new Float32Array(w * h).fill(0), w, h);

    const rng = seededRandom(42);
    let i;
    for (i = 0; i < 100; i++) {
        const x = randomIntegerBetween(rng, 0, w - 1);
        const y = randomIntegerBetween(rng, 0, h - 1);
        grid.assign(x, y, rng());
    }

    console.time('t');
    for (i = 0; i < 500; i++) {
        grid.step();
    }
    console.timeEnd('t');
});