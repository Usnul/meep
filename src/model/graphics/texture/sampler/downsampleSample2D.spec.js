import { Sampler2D } from "./Sampler2D.js";
import { downsampleSampler2D } from "./downsampleSampler2D.js";

test('2x2 -> 1x1 2x channel', () => {
    const input = Sampler2D.float32(2, 2, 2);
    const output = Sampler2D.float32(2, 1, 1);

    input.set(0, 0, [1, 3]);
    input.set(1, 0, [5, 7]);
    input.set(0, 1, [11, 13]);
    input.set(1, 1, [17, 19]);

    downsampleSampler2D(input, output);

    expect(output.data[0]).toEqual(8.5);
    expect(output.data[1]).toEqual(10.5);
});
