import Rectangle from "./Rectangle";

test("toArray works correctly", () => {
    const v = new Rectangle(1, 2, 3, 4);

    const actual = [];

    v.toArray(actual);

    expect(actual).toEqual([1, 2, 3, 4]);
});