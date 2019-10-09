import { Sampler2D } from "../../../../graphics/texture/sampler/Sampler2D.js";
import { downsampleSampler2D } from "../../../../graphics/texture/sampler/downsampleSampler2D.js";
import { computeWholeDivisorLow } from "../../../../core/math/MathUtils.js";

/**
 *
 * @param {Sampler2D} heightSampler
 * @returns {Sampler2D}
 */
export function buildCameraTargetSampler({ heightSampler }) {
    function s(v) {
        const divisor = computeWholeDivisorLow(v, 32);

        const i = v / divisor;

        const j = Math.ceil(i);

        return Math.max(1, j);
    }

    const result = Sampler2D.float32(1, s(heightSampler.width), s(heightSampler.height));

    downsampleSampler2D(heightSampler, result);

    return result;
}
