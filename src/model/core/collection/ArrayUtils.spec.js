import { arrayPickBestElement } from "./ArrayUtils.js";

test("arrayPickBestElement largest number", () => {
    expect(
        arrayPickBestElement([7, 3, 11, -5], v => v)
    ).toEqual(11);
});
