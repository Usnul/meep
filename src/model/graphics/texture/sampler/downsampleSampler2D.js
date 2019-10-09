import { assert } from "../../../core/assert.js";

/**
 *
 * @param {Sampler2D} input
 * @param {Sampler2D} output
 */
export function downsampleSampler2D(input, output) {
    assert.notEqual(input, undefined, 'input is undefined');
    assert.notEqual(output, undefined, 'output is undefined');

    const iW = input.width;
    const iH = input.height;

    const oW = output.width;
    const oH = output.height;

    //compute scale
    const sW = iW / oW;
    const sH = iH / oH;

    assert.equal(input.itemSize, output.itemSize, `input.itemSize(=${input.itemSize}) is not equal to output.itemSize(=${output.itemSize})`);

    assert.ok(Number.isInteger(sW), `x scale must be an integer, instead was ${sW}`);
    assert.ok(Number.isInteger(sH), `y scale must be an integer, instead was ${sH}`);

    assert.ok(sW >= 1, `x scale must be positive, instead was ${sW}`);
    assert.ok(sH >= 1, `y scale must be positive, instead was ${sH}`);

    const itemSize = input.itemSize;

    const sample = new Array(itemSize);

    const sampleSize = sW * sH;

    const iData = input.data;
    const oData = output.data;

    let i, j, k;
    let x, y;

    for (y = 0; y < oH; y++) {

        const sampleOffsetY = y * sH;

        for (x = 0; x < oW; x++) {

            const oAddress = (x + y * oW) * itemSize;

            for (i = 0; i < itemSize; i++) {
                // reset sample
                sample[i] = 0;
            }

            const sampleOffsetX = x * sW;

            // accumulate sample
            for (j = 0; j < sH; j++) {
                for (i = 0; i < sW; i++) {

                    const iAddress = ((sampleOffsetX + i) + (sampleOffsetY + j) * iW) * itemSize;

                    for (k = 0; k < itemSize; k++) {
                        sample[k] += iData[k + iAddress];
                    }

                }
            }

            // dilute the sample
            for (i = 0; i < itemSize; i++) {
                oData[oAddress + i] = sample[i] / sampleSize;
            }


        }
    }
}
