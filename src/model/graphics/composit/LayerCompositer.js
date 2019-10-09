/**
 * Created by Alex on 01/10/2015.
 */
import { LinearFilter, OrthographicCamera, RGBAFormat, Scene, WebGLRenderTarget } from 'three';
import { BlendingType } from "../texture/sampler/BlendingType.js";
import { CompositLayer } from "./CompositLayer.js";
import Vector2 from "../../core/geom/Vector2.js";

const LayerCompositer = function () {
    this.layerTargets = [];

    //
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new Scene();

    this.size = new Vector2(0, 0);

};

/**
 *
 * @param param
 * @param {BlendingType} blending
 * @return {CompositLayer}
 */
LayerCompositer.prototype.addLayer = function (param, blending = BlendingType.Normal) {
    let renderTarget;

    if (param instanceof WebGLRenderTarget) {
        renderTarget = param;
    } else {
        const renderTargetParameters = {
            minFilter: LinearFilter,
            magFilter: LinearFilter,
            format: RGBAFormat,
            depthBuffer: false,
            stencilBuffer: false,
            generateMipmaps: false
        };
        for (let p in param) {
            if (param.hasOwnProperty(p)) {
                renderTargetParameters[p] = param[p];
            }
        }
        renderTarget = new WebGLRenderTarget(this.size.x, this.size.y, renderTargetParameters);
    }

    const layer = new CompositLayer({
        renderTarget,
        blending
    });

    layer.size.set(this.size.x, this.size.y);

    this.layerTargets.push(layer);

    this.scene.add(layer.object);

    return layer;
};

/**
 *
 * @param {WebGLRenderer} renderer
 */
LayerCompositer.prototype.composite = function (renderer) {
    const numLayers = this.layerTargets.length;

    const camera = this.camera;
    const scene = this.scene;

    if (numLayers > 0) {
        //disable clearing, to allow layers to be drawn on top of current buffer content
        renderer.autoClear = false;
        //render layers

        renderer.render(scene, camera);
    }
};

/**
 *
 * @param {number} x
 * @param {number} y
 */
LayerCompositer.prototype.setSize = function (x, y) {
    this.size.set(x, y);

    const layerTargets = this.layerTargets;
    for (let i = 0; i < layerTargets.length; i++) {
        const layerTarget = layerTargets[i];
        layerTarget.setSize(x, y);
    }
};

export default LayerCompositer;