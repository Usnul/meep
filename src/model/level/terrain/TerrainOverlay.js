/**
 * Created by Alex on 28/12/2015.
 */


import Vector4 from '../../core/geom/Vector4';
import * as THREE from 'three';
import canvas2Sampler2D from "../../graphics/texture/Canvas2Sampler2D";
import convertSampler2D2Canvas from "../../graphics/texture/sampler/Sampler2D2Canvas";
import Vector2 from "../../core/geom/Vector2";
import Vector1 from "../../core/geom/Vector1";
import { assert } from "../../core/assert.js";

/**
 *
 * @param {Sampler2D} sampler
 * @param {number} borderWidth
 * @constructor
 */
function Context(sampler, borderWidth) {
    this.sampler = sampler;
    this.borderWidth = borderWidth;
}


/**
 *
 * @param {Vector2} size
 * @constructor
 */
function TerrainOverlay(size) {
    /**
     * width is in fraction between 0 and 1, for example: 0.1 represents 10% border between tiles
     * @type {Vector1}
     * @readonly
     */
    this.borderWidth = new Vector1(0.1);
    /**
     *
     * @type {Vector2}
     * @readonly
     */
    this.size = new Vector2(size.x, size.y);
    const canvas = this.canvas = document.createElement("canvas");

    canvas.width = size.x;
    canvas.height = size.y;

    this.fillColor = new Vector4();
    this.context2d = canvas.getContext('2d');
    const texture = this.texture = new THREE.Texture(canvas);

    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    texture.repeat.set(1, 1);
    //texture.anisotropy = 8;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;

    /**
     *
     * @type {Context[]}
     */
    this.stack = [];

    this.size.onChanged.add(function (x, y) {
        canvas.width = x;
        canvas.height = y;
    });
}

/**
 * Pushes new context onto the stack, allowing you to preserve current state for later
 */
TerrainOverlay.prototype.push = function () {
    const sampler = canvas2Sampler2D(this.canvas);
    const context = new Context(sampler, this.borderWidth.getValue());
    this.stack.push(context);

    //clear
    this.clear();
};

/**
 * Pops top context from the stack, restoring previous state
 */
TerrainOverlay.prototype.pop = function () {
    if (this.stack.length === 0) {
        console.error("Can't pop overlay context, nothing on the stack");
        return;
    }

    /**
     * @type {Context}
     */
    const context = this.stack.pop();

    const sampler = context.sampler;

    this.size.set(sampler.width, sampler.height);

    // write context onto canvas
    convertSampler2D2Canvas(sampler, 1, 0, this.canvas);

    this.borderWidth.set(context.borderWidth);

    this.update();
};

TerrainOverlay.prototype.clear = function () {
    const size = this.size;
    this.context2d.clearRect(0, 0, size.x, size.y);

    this.update();
};

TerrainOverlay.prototype.update = function () {
    this.texture.needsUpdate = true;
};

/**
 *
 * @param {number} v
 * @returns {number}
 */
function float2uint8(v) {
    return Math.floor(v * 255);
}

/**
 *
 * @param {number} v
 * @returns {number}
 */
function uint82float(v) {
    return v / 255;
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {Vector4} result
 */
TerrainOverlay.prototype.readPoint = function (x, y, result) {
    const imageData = this.context2d.getImageData(x, y, 1, 1);
    const data = imageData.data;

    const r = uint82float(data[0]);
    const g = uint82float(data[1]);
    const b = uint82float(data[2]);
    const a = uint82float(data[3]);

    result.set(r, g, b, a);
};

/**
 *
 * @param {number} x
 * @param {number} y
 */
TerrainOverlay.prototype.clearPoint = function (x, y) {
    this.context2d.clearRect(x, y, 1, 1);
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {Vector4} vec4
 */
TerrainOverlay.prototype.paintPoint = function (x, y, vec4) {
    if (!this.fillColor.equals(vec4)) {
        this.fillColor.copy(vec4);
        const r = float2uint8(vec4.x);
        const g = float2uint8(vec4.y);
        const b = float2uint8(vec4.z);
        const a = vec4.w;
        this.context2d.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }
    this.context2d.fillRect(x, y, 1, 1);
    this.texture.needsUpdate = true;
};

/**
 *
 * @param {Uint8Array|number[]} data
 */
TerrainOverlay.prototype.writeData = function (data) {

    assert.ok(Array.isArray(data) || data instanceof Uint8Array || data instanceof Uint8ClampedArray, `expected data to be Array,Uint8Array or ClampedUint8Array, got something else instead`);

    const ctx = this.context2d;

    const imageData = ctx.createImageData(this.size.x, this.size.y);

    const array = imageData.data;

    array.set(data);

    ctx.putImageData(imageData, 0, 0);
};

export default TerrainOverlay;
