/**
 * Created by Alex on 15/11/2014.
 */


import * as THREE from 'three';
import { Sampler2D } from '../../graphics/texture/sampler/Sampler2D';
import sampler2D2Texture from '../../graphics/texture/sampler/Sampler2D2Texture';
import AmbientOcclusionShader from '../../graphics/shaders/AmbientOcclusionShader';
import GaussianBlurShader from '../../graphics/shaders/GaussianBlurShader';
import ImageFilter from '../../graphics/filter/ImageFilter';

function filterResult2Texture(data, width, height) {
    const result = new THREE.DataTexture();
    result.format = THREE.RGBAFormat;


    result.type = THREE.UnsignedByteType;
    result.flipY = false;
    result.image = { data: data, width: width, height: height };

    result.wrapS = THREE.ClampToEdgeWrapping;
    result.wrapT = THREE.ClampToEdgeWrapping;

    result.repeat.set(1, 1);
    result.needsUpdate = true;

    result.anisotropy = 4;

    return result;
}

/**
 *
 * @param {WebGLRenderer} renderer
 * @param {Sampler2D} heightMap
 * @param {Sampler2D} normalMap
 * @param {number} zRange
 * @param {Vector2} resultSize
 * @returns {Sampler2D}
 */
function normalMap2OcclusionMap(renderer, heightMap, normalMap, zRange, resultSize) {
    const width = resultSize.x;
    const height = resultSize.y;
    const resolution = new THREE.Vector2(heightMap.width, heightMap.height);
    //
    const normalTexture = sampler2D2Texture(normalMap, 255, 0.5);
    const heightTexture = sampler2D2Texture(heightMap, 255 / zRange, zRange / 2);
    //construct shader
    const shaderAO = new AmbientOcclusionShader();
    shaderAO.uniforms.heightMap.value = heightTexture;
    shaderAO.uniforms.normalMap.value = normalTexture;
    shaderAO.uniforms.resolution.value = resolution;
    //perform filtering
    const rawAO = ImageFilter(renderer, width, height, shaderAO);

    const shaderBlur = new GaussianBlurShader();
    shaderBlur.uniforms.resolution.value = resolution;
    shaderBlur.uniforms.tDiffuse.value = filterResult2Texture(rawAO.array, width, height);
    shaderBlur.uniforms.sigma.value.set(1.3, 1.3);

    const smoothAO = ImageFilter(renderer, width, height, shaderBlur);

    //create the sampler
    return new Sampler2D(smoothAO.array, 4, width, height);
}

export default normalMap2OcclusionMap;
