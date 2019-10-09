/**
 *
 * @param {Sampler2D} sampler
 * @param {DataTexture} texture
 */
export function writeSample2DDataToDataTexture(sampler, texture) {
    texture.image.data = sampler.data;
    texture.image.width = sampler.width;
    texture.image.height = sampler.height;

    texture.needsUpdate = true;
}
