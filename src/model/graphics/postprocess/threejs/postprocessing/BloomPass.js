/**
 * @author alteredq / http://alteredqualia.com/
 */
import {
    AdditiveBlending,
    LinearFilter,
    Mesh,
    OrthographicCamera,
    PlaneBufferGeometry,
    RGBFormat,
    Scene,
    ShaderMaterial,
    UniformsUtils,
    Vector2,
    WebGLRenderTarget
} from 'three';
import CopyShader from "../shaders/CopyShader";
import ConvolutionShader from "../shaders/ConvolutionShader";

const BloomPass = function (strength, kernelSize, sigma, resolution) {

    strength = (strength !== undefined) ? strength : 1;
    kernelSize = (kernelSize !== undefined) ? kernelSize : 25;
    sigma = (sigma !== undefined) ? sigma : 4.0;
    resolution = (resolution !== undefined) ? resolution : 256;

    // render targets

    const pars = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat };

    this.renderTargetX = new WebGLRenderTarget(resolution, resolution, pars);
    this.renderTargetY = new WebGLRenderTarget(resolution, resolution, pars);

    // copy material

    if (CopyShader === undefined)
        console.error("THREE.BloomPass relies on THREE.CopyShader");

    const copyShader = CopyShader;

    this.copyUniforms = UniformsUtils.clone(copyShader.uniforms);

    this.copyUniforms["opacity"].value = strength;

    this.materialCopy = new ShaderMaterial({

        uniforms: this.copyUniforms,
        vertexShader: copyShader.vertexShader,
        fragmentShader: copyShader.fragmentShader,
        blending: AdditiveBlending,
        transparent: true

    });

    // convolution material

    if (ConvolutionShader === undefined)
        console.error("THREE.BloomPass relies on THREE.ConvolutionShader");

    const convolutionShader = ConvolutionShader;

    this.convolutionUniforms = UniformsUtils.clone(convolutionShader.uniforms);

    this.convolutionUniforms["uImageIncrement"].value = BloomPass.blurX;
    this.convolutionUniforms["cKernel"].value = convolutionShader.buildKernel(sigma);

    this.materialConvolution = new ShaderMaterial({

        uniforms: this.convolutionUniforms,
        vertexShader: convolutionShader.vertexShader,
        fragmentShader: convolutionShader.fragmentShader,
        defines: {
            "KERNEL_SIZE_FLOAT": kernelSize.toFixed(1),
            "KERNEL_SIZE_INT": kernelSize.toFixed(0)
        }

    });

    this.enabled = true;
    this.needsSwap = false;
    this.clear = false;


    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new Scene();

    this.quad = new Mesh(new PlaneBufferGeometry(2, 2), null);
    this.scene.add(this.quad);

};

BloomPass.prototype = {

    render: function (renderer, writeBuffer, readBuffer, delta, maskActive) {

        if (maskActive) renderer.context.disable(renderer.context.STENCIL_TEST);

        // Render quad with blured scene into texture (convolution pass 1)

        this.quad.material = this.materialConvolution;

        this.convolutionUniforms["tDiffuse"].value = readBuffer;
        this.convolutionUniforms["uImageIncrement"].value = BloomPass.blurX;

        renderer.render(this.scene, this.camera, this.renderTargetX, true);


        // Render quad with blured scene into texture (convolution pass 2)

        this.convolutionUniforms["tDiffuse"].value = this.renderTargetX;
        this.convolutionUniforms["uImageIncrement"].value = BloomPass.blurY;

        renderer.render(this.scene, this.camera, this.renderTargetY, true);

        // Render original scene with superimposed blur to texture

        this.quad.material = this.materialCopy;

        this.copyUniforms["tDiffuse"].value = this.renderTargetY;

        if (maskActive) renderer.context.enable(renderer.context.STENCIL_TEST);

        renderer.render(this.scene, this.camera, readBuffer, this.clear);

    }

};

BloomPass.blurX = new Vector2(0.001953125, 0.0);
BloomPass.blurY = new Vector2(0.0, 0.001953125);

export default BloomPass;
