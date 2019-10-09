import Vector4 from "./Vector4";

test("toArray works correctly", () => {
    const v = new Vector4(1, 2, 3, 4);

    const actual = [];

    v.toArray(actual);

    expect(actual).toEqual([1, 2, 3, 4]);
});