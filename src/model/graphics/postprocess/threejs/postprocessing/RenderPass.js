/**
 * @author alteredq / http://alteredqualia.com/
 */
import { Color } from 'three';

const RenderPass = function (scene, camera, overrideMaterial, clearColor, clearAlpha) {

    this.scene = scene;
    this.camera = camera;

    this.overrideMaterial = overrideMaterial;

    this.clearColor = clearColor;
    this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha : 1;

    this.oldClearColor = new Color();
    this.oldClearAlpha = 1;

    this.enabled = true;
    this.clear = true;
    this.needsSwap = false;

};

RenderPass.prototype = {

    render: function (renderer, writeBuffer, readBuffer, delta) {

        this.scene.overrideMaterial = this.overrideMaterial;

        if (this.clearColor) {

            this.oldClearColor.copy(renderer.getClearColor());
            this.oldClearAlpha = renderer.getClearAlpha();


            renderer.setClearColor(this.clearColor, this.clearAlpha);

        }

        const oldRenderTarget = renderer.getRenderTarget();

        renderer.setRenderTarget(readBuffer);
        if (this.clear) {
            renderer.clearColor();
        }

        renderer.render(this.scene, this.camera);

        renderer.setRenderTarget(oldRenderTarget);

        if (this.clearColor) {

            renderer.setClearColor(this.oldClearColor, this.oldClearAlpha);

        }

        this.scene.overrideMaterial = null;

    }

};
export default RenderPass;