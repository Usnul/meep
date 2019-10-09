/**
 * Created by Alex on 03/08/2016.
 */


import { Sampler2D } from './Sampler2D';

/**
 *
 * @param {Array.<Sampler2D>} inputs
 * @returns {Sampler2D}
 */
function mergeSampler2D(inputs) {
    if (inputs.length > 4) {
        throw new Error("Can not merge more than 4 samplers");
    } else if (inputs.length === 0) {
        throw new Error("No samplers to merge");
    }

    const width = inputs[0].width;
    const height = inputs[0].height;

    //check dimensions of other inputs
    for (let i = 1; i < inputs.length; i++) {
        if (inputs[i].width !== width && inputs[i].height !== height) {
            console.warn('dimensions of ' + i + " input don't match");
        }
    }

    const uint8Array = new Uint8Array(width * height * 4);
    const result = new Sampler2D(uint8Array, 4, width, height);

    for (let i = 0, l = inputs.length; i < l; i++) {
        const sampler = inputs[i];
        mergeIntoChannel(sampler, result, i);
    }

    return result;
}

/**
 *
 * @param {Sampler2D} source
 * @param {Sampler2D} target
 * @param {int} targetChannelIndex
 */
function mergeIntoChannel(source, target, targetChannelIndex) {
    let sample = 0;
    let index = 0;

    const sW = source.width;
    const sH = source.height;

    const tW = target.width;
    const tH = target.height;

    let x, y;

    const tData = target.data;
    const tItemSize = target.itemSize;

    if (tW === sW && tH === sH) {
        //dimensions match exactly, no re-sampling is required

        const count = sW * sH;
        const sData = source.data;

        for (index = 0; index < count; index++) {
            sample = sData[index];

            tData[index * tItemSize + targetChannelIndex] = sample * 255;
        }

    } else {
        //dimensions don't match, use re-sampling

        //to account for 1-pixel size we force divisor to be at least 1
        const vDivisor = Math.max(1, target.height - 1);
        const uDivisor = Math.max(1, target.width - 1);

        for (y = 0; y < tH; y++) {
            const v = y / vDivisor;
            for (x = 0; x < tW; x++) {
                const u = x / uDivisor;
                sample = source.sample(u, v, sample);
                //
                tData[index + targetChannelIndex] = sample * 255;

                index += tItemSize;
            }
        }

    }
}

export { mergeSampler2D };
