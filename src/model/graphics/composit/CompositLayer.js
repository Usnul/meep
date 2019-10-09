import { Mesh, PlaneBufferGeometry, ShaderMaterial } from "three";
import Vector2 from "../../core/geom/Vector2.js";
import { assert } from "../../core/assert.js";
import { blendingType2three } from "../texture/sampler/blendingType2Three.js";
import { ScreenSpaceQuadShader } from "../shaders/ScreenSpaceQuadShader.js";

export class CompositLayer {
    /**
     *
     * @param {WebGLRenderTarget} renderTarget
     * @param {BlendingType} blending
     * @param {number} renderTargetScale
     */
    constructor({ renderTarget, blending, renderTargetScale = 1 }) {
        /**
         *
         * @type {BlendingType}
         */
        this.blending = blending;
        /**
         *
         * @type {WebGLRenderTarget}
         */
        this.renderTarget = renderTarget;

        /**
         *
         * @type {number}
         */
        this.renderTargetScale = renderTargetScale;

        const material = this.buildMaterial();

        this.object = new Mesh(new PlaneBufferGeometry(2, 2), material);

        this.size = new Vector2();

        /**
         *
         * @type {boolean}
         */
        this.enabled = true;
    }

    enable() {
        if (!this.enabled) {
            this.enabled = true;
            this.object.visible = true;
        }
    }

    disable() {
        if (this.enabled) {
            this.enabled = false;
            this.object.visible = false;
        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     */
    setSize(x, y) {
        this.size.set(x, y);
        this.updateRenderTargetSize();
    }

    updateRenderTargetSize() {

        if (this.renderTarget !== null) {
            const scale = this.renderTargetScale;

            const size = this.size;

            const width = size.x * scale;
            const height = size.y * scale;

            this.renderTarget.setSize(width, height);
        }
    }

    setRenderTargetScale(v) {
        assert.typeOf(v, 'number', 'v');
        assert.ok(!Number.isNaN(v), 'v is NaN');
        assert.ok(Number.isFinite(v), 'v is infinite');

        this.renderTargetScale = v;

        this.updateRenderTargetSize();
    }

    buildMaterial() {


        const threeBlending = blendingType2three(this.blending);
        const uniforms = {
            tTexture: {
                type: 't',
                value: this.renderTarget.texture
            }
        };

        const material = new ShaderMaterial({
            uniforms,
            vertexShader: ScreenSpaceQuadShader.vertexShader(),
            fragmentShader: ScreenSpaceQuadShader.fragmentShader(),
            blending: threeBlending,
            lights: false,
            fog: false,
            depthTest: false,
            depthWrite: false,
            transparent: true,
            vertexColors: false
        });

        return material;
    }
}