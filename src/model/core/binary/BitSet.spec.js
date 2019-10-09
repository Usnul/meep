import { BitSet } from "./BitSet";

test("get from empty", () => {
    const set = new BitSet();

    expect(set.get(0)).toBe(false);
    expect(set.get(10000)).toBe(false);
});

test("set and get bit 7", () => {
    const set = new BitSet();

    set.set(7, true);

    expect(set.get(7)).toBe(true);
});

test("set and get a bit", () => {
    const set = new BitSet();

    set.set(0, true);
    expect(set.get(0)).toBe(true);

    set.set(10000, true);
    expect(set.get(10000)).toBe(true);
    expect(set.get(0)).toBe(true);

    set.set(0, false);
    expect(set.get(0)).toBe(false);
    expect(set.get(10000)).toBe(true);

    set.set(10000, false);
    expect(set.get(10000)).toBe(false);
});

test("resizing up and down works as intended", () => {
    const set = new BitSet();

    const c0 = set.capacity();

    set.set(c0 + 1, true);

    const c1 = set.capacity();
    expect(c1).toBeGreaterThan(c0);

    //clear the bit
    set.set(c0 + 1, false);

    expect(set.capacity()).toBeLessThan(c1);
});

test("resizing down should throw when requested capacity is smaller than actual length", () => {
    const set = new BitSet();

    const c0 = set.capacity();

    set.set(c0 + 2, true);

    expect(() => {
        set.setCapacity(1);
    }).toThrow();
});

test("previousSetBit method works correctly", () => {
    const bits = new BitSet();

    bits.set(1, true);
    bits.set(2, true);
    bits.set(4, true);

    bits.set(8, true);
    bits.set(11, true);
    bits.set(12, true);

    expect(bits.previousSetBit(0)).toBe(-1);

    expect(bits.previousSetBit(1)).toBe(1);

    expect(bits.previousSetBit(2)).toBe(2);
    expect(bits.previousSetBit(3)).toBe(2);

    expect(bits.previousSetBit(4)).toBe(4);
    expect(bits.previousSetBit(5)).toBe(4);
    expect(bits.previousSetBit(6)).toBe(4);
    expect(bits.previousSetBit(7)).toBe(4);

    expect(bits.previousSetBit(8)).toBe(8);
    expect(bits.previousSetBit(9)).toBe(8);
    expect(bits.previousSetBit(9)).toBe(8);
    expect(bits.previousSetBit(10)).toBe(8);

    expect(bits.previousSetBit(11)).toBe(11);
    expect(bits.previousSetBit(12)).toBe(12);

    expect(bits.previousSetBit(100)).toBe(12);
});

test("nextClearBit method works correctly", () => {
    const bits = new BitSet();

    expect(bits.nextClearBit(0)).toBe(0);

    bits.set(0, true);

    expect(bits.nextClearBit(0)).toBe(1);

    bits.set(2, true);

    expect(bits.nextClearBit(2)).toBe(3);

    bits.set(1, true);

    expect(bits.nextClearBit(0)).toBe(3);

    bits.set(3, true);

    expect(bits.nextClearBit(0)).toBe(4);

    bits.set(6, true);
    bits.set(7, true);
    bits.set(8, true);
    bits.set(9, true);
    bits.set(11, true);

    expect(bits.nextClearBit(6)).toBe(10);
    expect(bits.nextClearBit(9)).toBe(10);
    expect(bits.nextClearBit(10)).toBe(10);
    expect(bits.nextClearBit(11)).toBe(12);
});

test("nextClearBit stability", () => {

    const bits = new BitSet();

    expect(bits.nextClearBit(0)).toBe(0);
    expect(bits.nextClearBit(1)).toBe(1);

    //repeat
    expect(bits.nextClearBit(0)).toBe(0);
});

test("combination of set and clear", () => {

    const bits = new BitSet();

    bits.set(0, true);
    bits.set(1, true);
    bits.set(2, true);
    bits.set(3, true);
    bits.set(4, true);
    bits.set(5, true);

    expect(bits.size()).toBe(6);

    //set
    bits.set(0, false);

    expect(bits.get(0)).toBe(false);
    expect(bits.get(1)).toBe(true);
    expect(bits.get(2)).toBe(true);
    expect(bits.get(3)).toBe(true);
    expect(bits.get(4)).toBe(true);
    expect(bits.get(5)).toBe(true);

    expect(bits.size()).toBe(6);

    //set
    bits.set(2, false);

    expect(bits.get(0)).toBe(false);
    expect(bits.get(1)).toBe(true);
    expect(bits.get(2)).toBe(false);
    expect(bits.get(3)).toBe(true);
    expect(bits.get(4)).toBe(true);
    expect(bits.get(5)).toBe(true);

    expect(bits.size()).toBe(6);

    //set
    bits.set(4, false);

    expect(bits.get(0)).toBe(false);
    expect(bits.get(1)).toBe(true);
    expect(bits.get(2)).toBe(false);
    expect(bits.get(3)).toBe(true);
    expect(bits.get(4)).toBe(false);
    expect(bits.get(5)).toBe(true);

    expect(bits.size()).toBe(6);

    //set
    bits.set(0, true);

    expect(bits.get(0)).toBe(true);
    expect(bits.get(1)).toBe(true);
    expect(bits.get(2)).toBe(false);
    expect(bits.get(3)).toBe(true);
    expect(bits.get(4)).toBe(false);
    expect(bits.get(5)).toBe(true);

    expect(bits.size()).toBe(6);

    //set
    bits.set(5, false);

    expect(bits.get(0)).toBe(true);
    expect(bits.get(1)).toBe(true);
    expect(bits.get(2)).toBe(false);
    expect(bits.get(3)).toBe(true);
    expect(bits.get(4)).toBe(false);
    expect(bits.get(5)).toBe(false);

    expect(bits.size()).toBe(4);
});

test("nextSetBit method works correctly", () => {
    const bits = new BitSet();

    expect(bits.nextSetBit(0)).toBe(-1);

    bits.set(0, true);

    expect(bits.nextSetBit(0)).toBe(0);

    expect(bits.nextSetBit(1)).toBe(-1);

    bits.set(2, true);

    expect(bits.nextSetBit(1)).toBe(2);

    bits.set(2, false);

    expect(bits.nextSetBit(1)).toBe(-1);

    bits.set(7, true);

    expect(bits.nextSetBit(7)).toBe(7);

    bits.set(7, false);
    bits.set(10, true);

    expect(bits.nextSetBit(6)).toBe(10);
});

test("clear method works correctly", () => {
    const bits = new BitSet();

    bits.set(0, true);
    bits.set(1, true);
    bits.set(2, true);
    bits.set(11, true);

    bits.clear(1);

    expect(bits.get(0)).toBe(true);

    expect(bits.get(1)).toBe(false);

    expect(bits.get(2)).toBe(true);

    expect(bits.get(11)).toBe(true);

    bits.clear(0);

    expect(bits.get(0)).toBe(false);

    expect(bits.get(1)).toBe(false);

    expect(bits.get(2)).toBe(true);

    expect(bits.get(11)).toBe(true);

    bits.clear(11);

    expect(bits.get(0)).toBe(false);

    expect(bits.get(1)).toBe(false);

    expect(bits.get(2)).toBe(true);

    expect(bits.get(11)).toBe(false);

    bits.clear(2);

    expect(bits.get(0)).toBe(false);

    expect(bits.get(1)).toBe(false);

    expect(bits.get(2)).toBe(false);

    expect(bits.get(11)).toBe(false);
});

test("reset clears out data correctly", () => {
    const set = new BitSet();

    set.set(0, true);

    expect(set.get(0)).toBe(true);

    set.reset();

    expect(set.size()).toBe(0);

    expect(set.nextClearBit(0)).toBe(0);

    set.set(1, true);

    // bit should have been cleared
    expect(set.get(0)).toBe(false);
});
