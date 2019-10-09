import { Sampler2D } from "./Sampler2D.js";
import { deserializeTexture, serializeTexture } from "./TextureBinaryBufferSerializer.js";
import { BinaryBuffer } from "../../../core/binary/BinaryBuffer.js";

function makeSample() {
    const width = 3;
    const height = 5;
    const itemSize = 2;
    const data = new Float32Array(width * height * itemSize);
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            const itemIndex = j * width + i;

            const offset = itemIndex * 2;
            data[offset] = offset;
            data[offset + 1] = offset + 1;
        }
    }

    return new Sampler2D(data, itemSize, width, height);
}

test('serialization deserialization consistency', () => {

    const a = makeSample();

    const binaryBuffer = new BinaryBuffer();
    serializeTexture(binaryBuffer, a);

    binaryBuffer.position = 0;

    const b = deserializeTexture(binaryBuffer);

    expect(a.width).toEqual(b.width);
    expect(a.height).toEqual(b.height);
    expect(a.itemSize).toEqual(b.itemSize);
    expect(a.data).toEqual(b.data);
});