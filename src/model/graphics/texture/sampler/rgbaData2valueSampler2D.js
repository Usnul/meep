/**
 * Created by Alex on 11/11/2014.
 */
import { Sampler2D } from './Sampler2D';

/**
 *
 * @param {ArrayLike} data
 * @param {number} width
 * @param {number} height
 * @param {number} [scale=1]
 * @param {number} [offset=0]
 * @returns {Sampler2D}
 */
function convert(data, width, height, scale, offset) {
    scale = scale || 1;
    offset = offset || 0;
    const bufferSize = width * height;
    const buffer = new Float32Array(bufferSize);
    const multiplier = scale / 765;
    for (let i = 0; i < bufferSize; i++) {
        const j = (i * 4);
        const r = data[j];
        const g = data[j + 1];
        const b = data[j + 2];
        buffer[i] = (r + g + b) * multiplier + offset;
    }
    return new Sampler2D(buffer, 1, width, height);
}

export default convert;
