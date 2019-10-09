import BinaryHeap from "./FastBinaryHeap.js";
import { passThrough, returnZero } from "../../core/function/Functions.js";
import { randomIntegerBetween, seededRandom } from "../../core/math/MathUtils.js";

test("constructor doesn't throw", () => {
    new BinaryHeap(returnZero);
});

test("empty heap has size 0", () => {
    const h = new BinaryHeap(returnZero);

    expect(h.size()).toBe(0);
});

test('clear empty', () => {
    const h = new BinaryHeap(returnZero);

    h.clear();

    expect(h.size()).toBe(0);
    expect(h.pop()).toBe(undefined);
});

test('clear heap with 1 element', () => {
    const h = new BinaryHeap(returnZero);

    h.push(1);

    h.clear();

    expect(h.size()).toBe(0);
    expect(h.pop()).toBe(undefined);
});

test("isEmpty", () => {
    const h = new BinaryHeap(returnZero);

    expect(h.isEmpty()).toBe(true);

    h.push(1);

    expect(h.isEmpty()).toBe(false);

    h.pop();

    expect(h.isEmpty()).toBe(true);
});

test("push followed by a pop", () => {
    const h = new BinaryHeap(returnZero);

    h.push(7);

    expect(h.size()).toBe(1);

    const popped = h.pop();

    expect(popped).toBe(7);

    expect(h.size()).toBe(0);
});

test("contains method", () => {
    const h = new BinaryHeap(returnZero);

    expect(h.contains(7)).toBe(false);

    h.push(3);

    expect(h.contains(7)).toBe(false);

    h.push(7);

    expect(h.contains(7)).toBe(true);

    h.pop();
    h.pop();

    expect(h.contains(7)).toBe(false);
});

test("correct sorting of 4 numbers", () => {
    const h = new BinaryHeap(passThrough);

    const input = [2, 7, 1, 5];

    input.forEach(i => {
        h.push(i)
    });

    const output = [];

    while (h.size() > 0) {
        output.push(h.pop());
    }

    expect(output).toEqual([1, 2, 5, 7]);
});

test.skip("performance 100k random fill -> drain", () => {
    const h = new BinaryHeap(passThrough);

    const random = seededRandom(42);

    const elements = [];

    const n = 100000;

    //prepare data
    let i;
    for (i = 0; i < n; i++) {
        const index = randomIntegerBetween(random, 0, i);
        elements.splice(index, 0, i);
    }

    //fill
    let t = performance.now();
    for (i = 0; i < n; i++) {
        const el = elements[i];

        h.push(el);
    }

    let d = (performance.now() - t) / 1000;
    console.log(`Push ${n / d} elements per second`);

    //drain
    t = performance.now();
    for (i = 0; i < n; i++) {
        h.pop();
    }
    d = (performance.now() - t) / 1000;

    console.log(`Drain ${n / d} elements per second`);
});
