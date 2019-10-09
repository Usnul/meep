/**
 * @author alteredq / http://alteredqualia.com/
 */
import { LinearFilter, RGBFormat, WebGLRenderTarget } from 'three';
import CopyShader from "../shaders/CopyShader";
import ShaderPass from "./ShaderPass";
import ClearMaskPass from "./ClearMaskPass";
import MaskPass from "./MaskPass";

const EffectComposer = function (renderer, renderTarget) {

    this.renderer = renderer;

    if (renderTarget === undefined) {

        const pixelRatio = renderer.getPixelRatio();

        const width = Math.floor(renderer.context.canvas.width / pixelRatio) || 1;
        const height = Math.floor(renderer.context.canvas.height / pixelRatio) || 1;
        const parameters = {
            minFilter: LinearFilter,
            magFilter: LinearFilter,
            format: RGBFormat,
            stencilBuffer: false
        };

        renderTarget = new WebGLRenderTarget(width, height, parameters);

    }

    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();

    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;

    this.passes = [];

    if (CopyShader === undefined)
        console.error("THREE.EffectComposer relies on THREE.CopyShader");

    this.copyPass = new ShaderPass(CopyShader);

};

EffectComposer.prototype = {

    swapBuffers: function () {

        const tmp = this.readBuffer;
        this.readBuffer = this.writeBuffer;
        this.writeBuffer = tmp;

    },

    addPass: function (pass) {

        this.passes.push(pass);

    },

    insertPass: function (pass, index) {

        this.passes.splice(index, 0, pass);

    },

    render: function (delta) {

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

        let maskActive = false;

        let pass, i;
        const il = this.passes.length;

        for (i = 0; i < il; i++) {

            pass = this.passes[i];

            if (!pass.enabled) continue;

            pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive);

            if (pass.needsSwap) {

                if (maskActive) {

                    const context = this.renderer.context;

                    context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff);

                    this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, delta);

                    context.stencilFunc(context.EQUAL, 1, 0xffffffff);

                }

                this.swapBuffers();

            }

            if (pass instanceof MaskPass) {

                maskActive = true;

            } else if (pass instanceof ClearMaskPass) {

                maskActive = false;

            }

        }

    },

    reset: function (renderTarget) {

        if (renderTarget === undefined) {

            renderTarget = this.renderTarget1.clone();

            const pixelRatio = this.renderer.getPixelRatio();

            renderTarget.width = Math.floor(this.renderer.context.canvas.width / pixelRatio);
            renderTarget.height = Math.floor(this.renderer.context.canvas.height / pixelRatio);

        }

        this.renderTarget1.dispose();
        this.renderTarget1 = renderTarget;
        this.renderTarget2.dispose();
        this.renderTarget2 = renderTarget.clone();

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

    },

    setSize: function (width, height) {

        this.renderTarget1.setSize(width, height);
        this.renderTarget2.setSize(width, height);

    }

};

export default EffectComposer;