/**
 * Created by Alex on 15/11/2014.
 */

import { Sampler2D } from '../../graphics/texture/sampler/Sampler2D';
import sampler2D2Texture from '../../graphics/texture/sampler/Sampler2D2Texture';
import NormalMapShader from '../../graphics/shaders/NormalMapShader2';
import ImageFilter from '../../graphics/filter/ImageFilter';
import { LinearFilter, Vector2 } from "three";


function convertChannel(v) {
    return (v) / 255 - 0.5;
}

/**
 *
 * @param {number[]|Uint8Array} source
 * @returns {Float32Array}
 */
function rgbaArray2RGB(source) {
    const length = source.length;
    const numPixels = Math.floor(length / 4);
    const target = new Float32Array(numPixels * 3);
    //
    let h;
    for (let i = 0; i < numPixels; i++) {
        const j = i * 4;
        const k = i * 3;
        //normalize source to normal vectors
        let x = convertChannel(source[j]);
        let y = convertChannel(source[j + 1]);
        let z = convertChannel(source[j + 2]);
        //
        h = Math.sqrt(x * x + y * y + z * z);

        x /= h;
        y /= h;
        z /= h;
        //
        target[k] = x;
        target[k + 1] = y;
        target[k + 2] = z;
    }
    return target;
}

/**
 *
 * @param {WebGLRenderer} renderer
 * @param {Sampler2D} sampler
 * @param {number} zRange
 * @returns {Sampler2D}
 */
function heightMap2NormalMap(renderer, sampler, zRange) {
    const width = sampler.width;
    const height = sampler.height;

    const resolution = new Vector2(width, height);

    const texture = sampler2D2Texture(sampler, 255 / zRange, zRange / 2);

    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    texture.flipY = false;
    //construct shader
    const shader = new NormalMapShader();
    shader.uniforms.height.value = zRange;
    shader.uniforms.heightMap.value = texture;
    shader.uniforms.resolution.value = resolution;
    //perform filtering
    const result = ImageFilter(renderer, width, height, shader);
    //create the sampler
    const array = result.array;
    const rgb = rgbaArray2RGB(array);
    //reduce array's alpha component
    return new Sampler2D(rgb, 3, width, height);
}

export default heightMap2NormalMap;
