import { create32BitCodec } from "./32BitEncoder.js";

test("16x2", () => {
    const codec = create32BitCodec([16, 16]);

    const result = [];

    codec.decode(codec.encode(13, 17), result);

    expect(result).toEqual([13, 17]);
});
