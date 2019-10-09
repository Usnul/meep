/**
 * Created by Alex on 11/09/2015.
 */
import Vector2 from "../../core/geom/Vector2";

import {
    FloatType,
    LinearFilter,
    MeshDepthMaterial,
    NearestFilter,
    NoBlending,
    RGBADepthPacking,
    RGBAFormat,
    WebGLRenderTarget
} from 'three';
import EffectComposer from "./threejs/postprocessing/EffectComposer";
import RenderPass from "./threejs/postprocessing/RenderPass";
import ShaderPass from "./threejs/postprocessing/ShaderPass";
import AdaptiveToneMappingPass from "./threejs/postprocessing/AdaptiveToneMappingPass";
import BloomPass from "./threejs/postprocessing/BloomPass";
import BokehPass from "./threejs/postprocessing/BokehPass";
import SMAAPass from "./threejs/postprocessing/SMAAPass";
import CopyShader from "./threejs/shaders/CopyShader";
import SSAOShader from "./threejs/shaders/SSAOShader";
import FXAAShader from "./threejs/shaders/FXAAShader";

const PostProcess = function (scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.graphics = renderer;

    this.size = new Vector2(800, 600);
};

function makeUniformAccessor(uniforms) {
    const t = {};

    function bindUniform(propName) {
        Object.defineProperty(t, propName, {
            get: function () {
                return uniforms[propName].value;
            },
            set: function (val) {
                return uniforms[propName].value = val;
            }
        })
    }

    for (let p in uniforms) {
        if (uniforms.hasOwnProperty(p)) {
            bindUniform(p);
        }
    }
    return t;
}

PostProcess.prototype.initializeGUI = function (gui) {
    const fPostProcess = gui.addFolder("Post-processing");
    fPostProcess.open();
    if (this.effectSSAO !== undefined) {
        const aSSAO = makeUniformAccessor(this.effectSSAO.uniforms);
        const ssao = fPostProcess.addFolder("SSAO");
        ssao.add(this.effectSSAO, "enabled");

        ssao.add(aSSAO, "onlyAO");
        ssao.add(aSSAO, "strength", 0, 1, 0.05);
        ssao.add(aSSAO, "lumInfluence", 0, 1, 0.05);
        ssao.add(aSSAO, "aoClamp", 0, 1, 0.05);

        ssao.open();
    }
    if (this.effectFXAA !== undefined) {
        const fxaa = fPostProcess.addFolder("FXAA");
        fxaa.add(this.effectFXAA, "enabled");
        fxaa.open();
    }
    if (this.effectSMAA !== undefined) {
        const smaa = fPostProcess.addFolder("SMAA");
        smaa.add(this.effectSMAA, "enabled");
        smaa.open();
    }
    if (this.effectBloom !== undefined) {
        const bloom = fPostProcess.addFolder("Bloom");
        bloom.add(this.effectBloom, "enabled");
        bloom.open();
    }
    if (this.effectToneMap !== undefined) {
        const toneMap = fPostProcess.addFolder("Tone Mapping");
        toneMap.add(this.effectToneMap, "enabled");

        const aMTM = makeUniformAccessor(this.effectToneMap.materialToneMap.uniforms);
        toneMap.add(aMTM, "maxLuminance", 0, 30, 0.05);
        toneMap.add(aMTM, "middleGrey", 0, 30, 0.05);
        toneMap.add(aMTM, "averageLuminance", 0, 30, 0.05);

        const aATM = makeUniformAccessor(this.effectToneMap.materialAdaptiveLum.uniforms);
        toneMap.add(aATM, "tau", 0, 10, 0.1).name('Adaption time');

        toneMap.open();
    }
};

PostProcess.prototype.getFinalRenderTarget = function () {
    const composer = this.composer;
    const passes = composer.passes;

    let firstRT = true;
    for (let i = passes.length - 1; i > 0; i--) {
        //render to screen last pass only
        const pass = passes[i];
        if (pass.enabled && pass.needsSwap) {
            firstRT = !firstRT;
        }
    }

    if (firstRT) {
        return composer.renderTarget1;
    } else {
        return composer.renderTarget2;
    }
};

PostProcess.prototype.init = function (layer) {
    const self = this;

    const scene = this.scene;
    const camera = this.camera;
    const renderer = this.graphics;

    const gl = renderer.getContext();
    const parameters = {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        stencilBuffer: false
    };


    if (gl.getExtension('OES_texture_half_float_linear') !== null) {
        parameters.type = FloatType;
    }

    let renderTarget;
    if (layer === undefined) {
        renderTarget = new WebGLRenderTarget(this.size.x, this.size.y, parameters);
    } else {
        renderTarget = layer.renderTarget;
    }

    const composer = this.composer = new EffectComposer(renderer, renderTarget);

    const renderPass = new RenderPass(scene, camera, null, false);
    renderPass.clear = true;
    //SSAO
    const effectSSAO = this.effectSSAO = new ShaderPass(SSAOShader);

    const width = this.size.x;
    const height = this.size.y;

    // Setup depth pass
    const depthMaterial = this.depthMaterial = new MeshDepthMaterial();
    depthMaterial.depthPacking = RGBADepthPacking;
    depthMaterial.blending = NoBlending;
    depthMaterial.skinning = false;


    const depthTarget = this.depthTarget = new WebGLRenderTarget(width, height, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat
    });

    effectSSAO.uniforms['tDepth'].value = depthTarget;
    effectSSAO.uniforms['size'].value.set(width, height);
    effectSSAO.uniforms['cameraNear'].value = camera.near;
    effectSSAO.uniforms['cameraFar'].value = camera.far;
    effectSSAO.uniforms['onlyAO'].value = false;
    effectSSAO.uniforms['strength'].value = 0.5;
    effectSSAO.uniforms['lumInfluence'].value = 0.5;
//        effectSSAO.uniforms[ 'fogNear' ].value = scene.fog.near;
//        effectSSAO.uniforms[ 'fogFar' ].value = scene.fog.far;
//    effectSSAO.uniforms['fogEnabled'].value = 0;
    effectSSAO.uniforms['aoClamp'].value = 0.5;
//        effectSSAO.renderToScreen = true;
    effectSSAO.material.defines = { "FLOAT_DEPTH": true };
    //FXAA
    const effectFXAA = this.effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.enabled = false;
    effectFXAA.uniforms['resolution'].value.set(1 / (width), 1 / (height));

    const effectSMAA = this.effectSMAA = new SMAAPass(width, height);
    effectSMAA.needsSwap = true;

    //BOKEH
    let bokehPass = new BokehPass(scene, camera, {
        focus: 1.0,
        aperture: 0.025,
        maxblur: 1.0,

        width: width,
        height: height
    });
    //BLOOM
    const effectBloom = this.effectBloom = new BloomPass();
    effectBloom.enabled = false;

    //dynamic tone mapping
    const adaptToneMappingPass = this.effectToneMap = new AdaptiveToneMappingPass(true, 256);
    adaptToneMappingPass.enabled = true;
    adaptToneMappingPass.setMaxLuminance(16);
    adaptToneMappingPass.setMiddleGrey(7);
    adaptToneMappingPass.needsSwap = true;

    //Gamma correction
    const outputCorrectionPass = new ShaderPass(CopyShader);
    outputCorrectionPass.renderToScreen = true;

    //build up passes
    composer.addPass(renderPass);
    // composer.addPass(effectFXAA);
    composer.addPass(effectSMAA);
    composer.addPass(effectSSAO);
    //composer.addPass(bokehPass);
    composer.addPass(adaptToneMappingPass);
    composer.addPass(effectBloom);
    composer.addPass(outputCorrectionPass);

    function update() {
        let renderToScreenFlagged = false;
        const passes = composer.passes;
        for (let i = passes.length - 1; i > 0; i--) {
            //render to screen last pass only
            const pass = passes[i];
            if (pass.enabled && !renderToScreenFlagged) {
                // pass.renderToScreen = true;
                renderToScreenFlagged = true;
                pass.renderToScreen = false;
            } else {
                pass.renderToScreen = false;
            }
        }
        //specify if composer should be used at all
        if (layer !== undefined) {
            layer.renderTarget = self.getFinalRenderTarget();
        }
    }

    update();
};
PostProcess.prototype.setViewPortSize = function (width, height) {
    try {
        this.size.set(width, height);
        this.composer.setSize(width, height);
        //effects

        this.depthTarget = new WebGLRenderTarget(width, height, {
            minFilter: NearestFilter,
            magFilter: NearestFilter,
            format: RGBAFormat
        });
//
        this.effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);

        this.effectSMAA.setSize(width, height);

        this.effectSSAO.uniforms['size'].value.set(width, height);
//
        this.effectSSAO.uniforms['tDepth'].value = this.depthTarget;
    } catch (e) {
        console.error(e);
    }
};
PostProcess.prototype.render = function (renderer, camera, scene, delta) {
    renderer.gammaInput = true;
    renderer.gammaOutput = false;
    renderer.autoClear = false;
    scene.overrideMaterial = this.depthMaterial;
    renderer.render(scene, this.camera, this.depthTarget, true);

    //effects render
    scene.overrideMaterial = null;
    this.composer.render(delta);
};
export default PostProcess;