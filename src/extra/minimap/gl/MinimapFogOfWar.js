import { MinimapWorldLayer } from "./MinimapWorldLayer.js";
import { Mesh, PlaneBufferGeometry } from "three";
import { buildScreenSpaceFogOfWarShader } from "../../../model/level/fow/shader/screenSpaceFogOfWarShader.js";
import { FogOfWar } from "../../../model/level/fow/FogOfWar.js";
import { computeUvTransformFromFogOfWar } from "../../../model/level/fow/shader/FogOfWarRenderer.js";
import AABB2 from "../../../model/core/geom/AABB2.js";
import { SignalBinding } from "../../../model/core/events/signal/SignalBinding.js";


/**
 *
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @param {AABB2} aabb2
 */
function enforceAspectRatio(viewportWidth, viewportHeight, aabb2) {
    const viewportAspectRatio = viewportHeight / viewportWidth;

    const aabbHeight = aabb2.getHeight();
    const aabbWidth = aabb2.getWidth();

    if (aabbWidth !== 0) {
        const aabbAspectRatio = aabbHeight / aabbWidth;

        const aspectRatioDelta = viewportAspectRatio - aabbAspectRatio;

        if (aspectRatioDelta > 0) {
            const d = aabbWidth * aspectRatioDelta;
            aabb2.y0 -= d / 2;
            aabb2.y1 += d / 2;
        } else {
            const d = -aabbWidth * aspectRatioDelta;
            aabb2.x0 -= d / 2;
            aabb2.x1 += d / 2;
        }
    }

}

export class MinimapFogOfWar extends MinimapWorldLayer {
    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {Rectangle} focusArea
     */
    constructor(ecd, focusArea) {
        super();


        /**
         *
         * @type {EntityComponentDataset}
         */
        this.dataset = ecd;

        /**
         *
         * @type {FogOfWar|null}
         */
        this.fow = null;

        this.material = buildScreenSpaceFogOfWarShader();

        const geom = new PlaneBufferGeometry(1, 1, 1, 1);

        this.object = new Mesh(geom, this.material);
        this.object.frustumCulled = false;

        /**
         *
         * @type {Rectangle}
         */
        this.focusArea = focusArea;

        this.controlFocusArea = true;
        this.focusAreaNeedsUpdate = true;

        this.signalBindings = [];
    }

    updateFocusArea() {
        const bounds = new AABB2();

        if (this.fow === null) {
            //no Fog of War
            return;
        }

        this.fow.computeRevealedGridBoundingRectangle(bounds);

        const PADDING = 2;

        bounds.grow(PADDING);

        bounds.move(-0.5, +0.5);

        const scale = this.fow.scale.getValue();

        const fowSizeX = this.fow.size.x;
        const fowSizeY = this.fow.size.y;

        const scaleX = scale * (fowSizeX - 1) / fowSizeX;
        const scaleY = scale * (fowSizeY - 1) / fowSizeY;

        bounds.x0 *= scaleX;
        bounds.x1 *= scaleX;

        bounds.y0 *= scaleY;
        bounds.y1 *= scaleY;

        //we need to square the bounds
        enforceAspectRatio(this.viewportSize.x, this.viewportSize.y, bounds);

        this.focusArea.set(bounds.x0, bounds.y0, bounds.getWidth(), bounds.getHeight());

        this.focusAreaNeedsUpdate = false;
    }

    startup() {
        const self = this;

        /**
         *
         * @param {FogOfWar} fow
         */
        function visitFoW(fow) {
            self.fow = fow;
            return false;
        }

        this.dataset.traverseComponents(FogOfWar, visitFoW);


        const fow = this.fow;

        if (fow !== null) {
            this.signalBindings.push(new SignalBinding(fow.on.textureChanged, () => {
                this.material.uniforms.tFog.value = fow.texture;
                this.material.uniforms.uResolution.value.set(fow.size.x, fow.size.y);
                this.needsRender = true;
                this.focusAreaNeedsUpdate = true;
            }));
        }

        this.signalBindings.forEach(b => b.link());

        this.needsRender = true;
    }

    shutdown() {
        this.fow = null;

        this.signalBindings.forEach(b => b.unlink());

        this.signalBindings = [];
    }

    /**
     *
     * @param {OrthographicCamera} camera
     */
    update(camera) {
        if (this.fow === null) {
            //no Fog of War
            return;
        }

        if (this.controlFocusArea && this.focusAreaNeedsUpdate) {
            this.updateFocusArea();
        }

        const material = this.material;

        const fow = this.fow;
        if (fow !== null) {
            const uniforms = material.uniforms;

            uniforms.tFog.value = fow.texture;
            uniforms.uResolution.value.set(fow.size.x, fow.size.y);
            uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
            uniforms.uViewInverse.value.copy(camera.matrixWorld);
            uniforms.uColor.value.copy(fow.color);

            computeUvTransformFromFogOfWar(fow, function (offsetX, offsetY, scaleX, scaleY) {
                uniforms.uFogUvTransform.value.set(offsetX, offsetY, scaleX, scaleY);
            });
        }
    }
}
