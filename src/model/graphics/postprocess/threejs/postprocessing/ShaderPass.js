/**
 * @author alteredq / http://alteredqualia.com/
 * @author Alex Goldring (maintenance)
 */
import { Mesh, OrthographicCamera, PlaneBufferGeometry, Scene, ShaderMaterial, UniformsUtils } from 'three';

const ShaderPass = function (shader, textureID) {

    this.textureID = (textureID !== undefined) ? textureID : "tDiffuse";

    if (shader instanceof ShaderMaterial) {

        this.uniforms = shader.uniforms;

        this.material = shader;

    } else if (shader) {

        this.uniforms = UniformsUtils.clone(shader.uniforms);

        this.material = new ShaderMaterial({

            defines: shader.defines || {},
            uniforms: this.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader

        });

    }

    this.renderToScreen = false;

    this.enabled = true;
    this.needsSwap = true;
    this.clear = false;


    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new Scene();

    this.quad = new Mesh(new PlaneBufferGeometry(2, 2), null);
    this.scene.add(this.quad);

};

ShaderPass.prototype = {

    /**
     *
     * @param {WebGLRenderer} renderer
     * @param {WebGLRenderTarget} writeBuffer
     * @param {WebGLRenderTarget} readBuffer
     * @param {number} delta
     */
    render: function (renderer, writeBuffer, readBuffer, delta) {

        if (this.uniforms[this.textureID]) {

            this.uniforms[this.textureID].value = readBuffer.texture;

        }

        this.quad.material = this.material;

        if (this.renderToScreen) {

            renderer.render(this.scene, this.camera);

        } else {

            const oldRenderTarget = renderer.getRenderTarget();

            renderer.setRenderTarget(writeBuffer);

            if (this.clear) {
                renderer.clear();
            }

            renderer.render(this.scene, this.camera);

            renderer.setRenderTarget(oldRenderTarget);
        }

    }

};

export default ShaderPass;