import GaussianGlowShader from "../../shaders/GaussianGlowShader.js";
import { LinearFilter, RGBAFormat, WebGLRenderTarget } from "three";
import EffectComposer from "../../postprocess/threejs/postprocessing/EffectComposer.js";
import ShaderPass from "../../postprocess/threejs/postprocessing/ShaderPass.js";
import RenderPass from "../../postprocess/threejs/postprocessing/RenderPass.js";

/**
 *
 * @param {WebGLRenderer} renderer
 * @param {Scene} scene
 * @constructor
 */
function OutlineRenderer(renderer, scene) {
    const renderTargetParameters = {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        depthBuffer: false,
        stencilBuffer: false
    };

    this.isTargetClear = false;

    const renderTarget = new WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameters);

    const renderPass = new RenderPass(scene, null);
    renderPass.clear = true;
    renderPass.clearAlpha = 0;
    const blurPass = new ShaderPass(GaussianGlowShader);

    this.__renderPass = renderPass;


    const composer = new EffectComposer(renderer, renderTarget);

    this.mainRenderTarget = composer.renderTarget1;

    composer.addPass(renderPass);
    composer.addPass(blurPass);

    const self = this;
    this.resize = function (x, y) {
        composer.setSize(x, y);
        self.isTargetClear = false;
        self.clearRenderTarget();
        blurPass.uniforms.resolution.value.set(x, y);
    };

    /**
     *
     * @type {EffectComposer}
     */
    this.composer = composer;
}

/**
 *
 * @param {PerspectiveCamera|OrthographicCamera} camera
 */
OutlineRenderer.prototype.setCamera = function (camera) {
    this.__renderPass.camera = camera;
};

OutlineRenderer.prototype.render = function () {
    this.composer.render(0.016);
    this.isTargetClear = false;
};

OutlineRenderer.prototype.clearRenderTarget = function () {
    if (!this.isTargetClear) {
        const renderer = this.composer.renderer;

        const oldRenderTarget = renderer.getRenderTarget();

        renderer.setRenderTarget(this.mainRenderTarget);
        renderer.clearColor();

        //clear render target
        renderer.setRenderTarget(oldRenderTarget);

        this.isTargetClear = true;
    }
};

export { OutlineRenderer };