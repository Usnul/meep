/**
 * Depth-of-field post-process with bokeh shader
 */
import {
    LinearFilter,
    Mesh,
    MeshDepthMaterial,
    OrthographicCamera,
    PlaneBufferGeometry,
    RGBFormat,
    Scene,
    ShaderMaterial,
    UniformsUtils,
    WebGLRenderTarget
} from 'three';
import BokehShader from "../shaders/BokehShader";

const BokehPass = function (scene, camera, params) {

    this.scene = scene;
    this.camera = camera;

    const focus = (params.focus !== undefined) ? params.focus : 1.0;
    const aspect = (params.aspect !== undefined) ? params.aspect : camera.aspect;
    const aperture = (params.aperture !== undefined) ? params.aperture : 0.025;
    const maxblur = (params.maxblur !== undefined) ? params.maxblur : 1.0;

    // render targets

    const width = params.width || window.innerWidth || 1;
    const height = params.height || window.innerHeight || 1;

    this.renderTargetColor = new WebGLRenderTarget(width, height, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBFormat
    });

    this.renderTargetDepth = this.renderTargetColor.clone();

    // depth material

    this.materialDepth = new MeshDepthMaterial();

    // bokeh material

    if (BokehShader === undefined) {

        console.error("THREE.BokehPass relies on THREE.BokehShader");

    }

    const bokehShader = BokehShader;
    const bokehUniforms = UniformsUtils.clone(bokehShader.uniforms);

    bokehUniforms["tDepth"].value = this.renderTargetDepth;

    bokehUniforms["focus"].value = focus;
    bokehUniforms["aspect"].value = aspect;
    bokehUniforms["aperture"].value = aperture;
    bokehUniforms["maxblur"].value = maxblur;

    this.materialBokeh = new ShaderMaterial({
        uniforms: bokehUniforms,
        vertexShader: bokehShader.vertexShader,
        fragmentShader: bokehShader.fragmentShader
    });

    this.uniforms = bokehUniforms;
    this.enabled = true;
    this.needsSwap = false;
    this.renderToScreen = false;
    this.clear = false;

    this.camera2 = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene2 = new Scene();

    this.quad2 = new Mesh(new PlaneBufferGeometry(2, 2), null);
    this.scene2.add(this.quad2);

};

BokehPass.prototype = {

    render: function (renderer, writeBuffer, readBuffer, delta, maskActive) {

        this.quad2.material = this.materialBokeh;

        // Render depth into texture

        this.scene.overrideMaterial = this.materialDepth;

        renderer.render(this.scene, this.camera, this.renderTargetDepth, true);

        // Render bokeh composite

        this.uniforms["tColor"].value = readBuffer;

        if (this.renderToScreen) {

            renderer.render(this.scene2, this.camera2);

        } else {

            renderer.render(this.scene2, this.camera2, writeBuffer, this.clear);

        }

        this.scene.overrideMaterial = null;

    }

};

export default BokehPass;