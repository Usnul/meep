import { buildScreenSpaceFogOfWarShader } from "./screenSpaceFogOfWarShader";
import { assert } from "../../../core/assert";
import { Mesh, OrthographicCamera, PlaneBufferGeometry, Scene, UnsignedShortType } from "three";
import { isValueBetweenInclusive } from "../../../core/math/MathUtils.js";

/**
 *
 * @param {FogOfWar} fow
 * @param {function(number, number, number, number)} callback
 */
export function computeUvTransformFromFogOfWar(fow, callback) {

    const sampler = fow.sampler;

    const samplerWidth = sampler.width;
    const samplerHeight = sampler.height;


    const scaleX = (fow.scale * fow.size.x) * (samplerWidth / (samplerWidth - 3));
    const scaleY = (fow.scale * fow.size.y) * (samplerHeight / (samplerHeight - 3));

    const offsetX = 1.5 / samplerWidth;
    const offsetY = 1.5 / samplerHeight;

    callback(offsetX, offsetY, 1 / scaleX, 1 / scaleY);
}

export class FogOfWarRenderer {
    constructor() {
        /**
         *
         * @type {ShaderMaterial}
         */
        this.material = buildScreenSpaceFogOfWarShader();

        this.quad = new Mesh(new PlaneBufferGeometry(2, 2), this.material);

        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.scene = new Scene();
        this.scene.add(this.quad);
    }

    /**
     *
     * @param {FogOfWar} fow
     */
    setUvTransformFromFog(fow) {
        computeUvTransformFromFogOfWar(fow, (offsetX, offsetY, scaleX, scaleY) => {

            this.setUvTransform(offsetX, offsetY, scaleX, scaleY);
        });
    }

    /**
     *
     * @param {number} offsetX UV u offset, between 0 and 1
     * @param {number} offsetY UV v offset, between 0 and 1
     * @param {number} scaleX Transform scale from world coordinate position to UV u coordinate, minus offsetX
     * @param {number} scaleY Transform scale from world coordinate position to UV v coordinate, minus offsetY
     */
    setUvTransform(offsetX, offsetY, scaleX, scaleY) {
        assert.typeOf(offsetX, 'number', 'offsetX');
        assert.notOk(Number.isNaN(offsetX), 'offsetX is NaN');
        assert.ok(isValueBetweenInclusive(offsetX, 0, 1), `expected offsetX to be between 0 and 1, instead was '${offsetX}'`);

        assert.typeOf(offsetY, 'number', 'offsetY');
        assert.notOk(Number.isNaN(offsetY), 'offsetY is NaN');
        assert.ok(isValueBetweenInclusive(offsetY, 0, 1), `expected offsetY to be between 0 and 1, instead was '${offsetY}'`);


        assert.typeOf(scaleX, 'number', 'scaleX');
        assert.notOk(Number.isNaN(scaleX), 'scaleX is NaN');
        assert.ok(Number.isFinite(scaleX), 'scaleX is Infinite');

        assert.typeOf(scaleY, 'number', 'scaleY');
        assert.notOk(Number.isNaN(scaleY), 'scaleY is NaN');
        assert.ok(Number.isFinite(scaleY), 'scaleY is Infinite');

        this.material.uniforms.uFogUvTransform.value.set(offsetX, offsetY, scaleX, scaleY);
    }

    /**
     *
     * @param {Texture} texture
     */
    setDepthBuffer(texture) {
        assert.equal(texture.type, UnsignedShortType, `expected texture type to be UnsignedShort(=${UnsignedShortType}), instead got something else (=${texture.type})`)

        this.material.uniforms.tDepth.value = texture;
    }

    /**
     *
     * @param {Texture} buffer
     */
    setFogBuffer(buffer) {
        this.material.uniforms.tFog.value = buffer;

    }

    /**
     * Resolution of the fog texture
     * @param {number} x
     * @param {number} y
     */
    setResolution(x, y) {
        this.material.uniforms.uResolution.value.set(x, y);
    }

    /**
     *
     * @param {Vector4} color
     */
    setFogColor(color) {
        this.material.uniforms.uColor.value.copy(color);
    }

    /**
     *
     * @param {WebGLRenderer} renderer
     * @param {PerspectiveCamera|OrthographicCamera} camera
     * @param {Scene} scene
     * @param {WebGLRenderTarget} target
     */
    render(renderer, camera, scene, target) {
        assert.ok(camera.isCamera, 'Not a camera');
        assert.ok(camera.isPerspectiveCamera || camera.isOrthographicCamera, 'Unsupported Camera type. Expected PerspectiveCamera or OrthographicCamera');


        //set up uniforms
        const uniforms = this.material.uniforms;

        uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
        uniforms.uViewInverse.value.copy(camera.matrixWorld);

        renderer.setRenderTarget(target);
        renderer.clearColor();

        renderer.render(this.scene, this.camera);


        renderer.setRenderTarget(null);
    }
}