/**
 * Created by Alex on 17/10/2014.
 */
import { ClampToEdgeWrapping, DataTexture, RGBAFormat, UnsignedByteType } from 'three';
import { assert } from "../../../core/assert.js";


/**
 *
 * @param {Sampler2D} sampler
 * @param {Number} scale
 * @param {Number} offset
 * @return {DataTexture}
 */
function sampler2D2Texture(sampler, scale = 1, offset = 0) {
    assert.notEqual(sampler, undefined, 'sampler is undefined');
    assert.equal(typeof scale, "number", `scale must be a number, instead was '${typeof scale}'`);
    assert.equal(typeof offset, "number", `scale must be a number, instead was '${typeof offset}'`);

    const result = new DataTexture();
    result.format = RGBAFormat;

    let data;

    if (scale === 1 && offset === 0 && sampler.itemSize === 4) {
        //no transformation, use a direct reference
        data = sampler.data;

    } else {
        data = new Uint8Array(sampler.width * sampler.height * 4);
        //slow process with mutation
        const arrayFiller = sampler.makeArrayFiller(scale, offset);

        let index = 0;
        let x, y;

        for (y = 0; y < sampler.height; y++) {
            for (x = 0; x < sampler.width; x++) {
                arrayFiller(index, data, x, y);
                index += 4;
            }
        }
    }

    result.type = UnsignedByteType;
    result.flipY = true;
    result.image = { data: data, width: sampler.width, height: sampler.height };

    result.wrapS = ClampToEdgeWrapping;
    result.wrapT = ClampToEdgeWrapping;

    // possibly not-power-of-two
    result.generateMipmaps = false;

    result.repeat.set(1, 1);
    result.needsUpdate = true;

    result.anisotropy = 4;

    return result;

}

export default sampler2D2Texture;
