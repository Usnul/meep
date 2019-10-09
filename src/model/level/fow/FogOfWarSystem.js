import { System } from "../../engine/ecs/System.js";
import { FogOfWar } from "./FogOfWar.js";
import Terrain from "../terrain/ecs/Terrain.js";
import { Frustum } from "three";
import { VisibilityFilter } from "../../graphics/render/visibility/VisibilityFilter.js";
import Vector4 from "../../core/geom/Vector4.js";
import { Camera } from "../../graphics/ecs/camera/Camera.js";
import { computePerspectiveCameraFocalPosition, frustumFromCamera } from "../../graphics/ecs/camera/CameraSystem.js";
import WaterSystem from "../../graphics/ecs/water/WaterSystem.js";
import Vector3 from "../../core/geom/Vector3.js";
import { BlendingType } from "../../graphics/texture/sampler/BlendingType.js";
import { FogOfWarRenderer } from "./shader/FogOfWarRenderer.js";
import { StandardFrameBuffers } from "../../graphics/GraphicsEngine.js";


const frustum = new Frustum();

export class FogOfWarSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphics
     */
    constructor(graphics) {
        super();

        /**
         *
         * @type {GraphicsEngine}
         */
        this.graphics = graphics;

        this.componentClass = FogOfWar;

        this.visibilityFilter = this.buildVisibilityFilter();
        //turn off by default
        this.visibilityFilter.enabled = false;

        this.dependencies.push(Terrain);

        this.componentCount = 0;
    }

    /**
     *
     * @returns {VisibilityFilter}
     */
    buildVisibilityFilter() {

        /**
         *
         * @type {FogOfWar|null}
         */
        let fog = null;

        const projectionPlane = new Vector4();

        const cameraFocalPoint = new Vector3();

        const result = new VisibilityFilter({
            name: 'fog of war',
            layerPredicate: (layer) => {
                return (layer !== this.renderLayer) && (layer.name !== WaterSystem.RENDER_LAYER_NAME);
            },

            objectPredicateInitialize: (camera) => {

                computePerspectiveCameraFocalPosition(camera, cameraFocalPoint);

                fog = null;

                const dataset = this.entityManager.dataset;

                if (dataset !== null) {
                    dataset.traverseComponents(FogOfWar, (fow) => {

                        fog = fow;

                        // stop traversal
                        return false;
                    });

                    //find current projection plane
                    dataset.traverseComponents(Camera, c => {
                        if (c.active) {

                            frustumFromCamera(c.object, frustum);

                            const nearPlane = frustum.planes[4];

                            const ppN = nearPlane.normal;

                            projectionPlane.set(ppN.x, ppN.y, ppN.z, nearPlane.constant);

                            return false;
                        }
                    });
                }
            },

            objectPredicateFinalize: () => {
                fog = null;
            },

            /**
             *
             * @param {AABB3} aabb
             * @returns {boolean}
             */
            objectPredicateExecute: function (aabb) {
                return fog.computeAABBVisibility(aabb, cameraFocalPoint, 1);
            }
        });

        return result;

    }

    /**
     *
     * @param {EntityManager} entityManager
     * @param readyCallback
     * @param errorCallback
     */
    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        const graphics = this.graphics;

        const compositerLayer = graphics.layerComposer.addLayer({}, BlendingType.Normal);

        const renderTarget = compositerLayer.renderTarget;
        this.renderTarget = renderTarget;

        const fogOfWarRenderer = new FogOfWarRenderer();

        // graphics.visibilitySet.addFilter(this.visibilityFilter);


        let renderingFog = false;

        graphics.on.preRender.add(function (renderer, camera, scene) {
            const dataset = entityManager.dataset;

            const depthFrameBuffer = graphics.frameBuffers.getById(StandardFrameBuffers.ColorAndDepth);

            renderingFog = false;

            /**
             *
             * @param {FogOfWar} fow
             */
            function drawFow(fow) {
                renderingFog = true;

                fogOfWarRenderer.setDepthBuffer(depthFrameBuffer.renderTarget.depthTexture);
                fogOfWarRenderer.setFogBuffer(fow.texture);
                fogOfWarRenderer.setResolution(fow.size.x, fow.size.y);
                fogOfWarRenderer.setUvTransformFromFog(fow);
                fogOfWarRenderer.setFogColor(fow.color);


                //stop traversal
                return false;
            }

            if (dataset !== null) {
                dataset.traverseComponents(FogOfWar, drawFow);

                if (!renderingFog) {
                    compositerLayer.disable();
                } else {
                    compositerLayer.enable();

                    depthFrameBuffer.referenceCount++;
                }
            }
        });

        graphics.on.buffersRendered.add(function (renderer, camera, scene) {
            if (renderingFog) {
                fogOfWarRenderer.render(renderer, camera, scene, compositerLayer.renderTarget);
            }
        });

        graphics.on.postRender.add(function (renderer, camera, scene) {
            if (renderingFog) {
                const depthFrameBuffer = graphics.frameBuffers.getById(StandardFrameBuffers.ColorAndDepth);

                depthFrameBuffer.referenceCount--;
            }
        });


        readyCallback();
    }

    /**
     *
     * @param {FogOfWar} fow
     * @param {Terrain} terrain
     * @param {number} entity
     */
    link(fow, terrain, entity) {
        /**
         *
         * @type {Vector2}
         */
        const terrainSize = terrain.size;

        fow.resize(terrainSize.x, terrainSize.y, terrain.gridScale);


        this.componentCount++;

        if (!this.visibilityFilter.enabled) {
            this.visibilityFilter.enabled = true;
        }
    }

    unlink(fow, terrain, entity) {
        this.componentCount--;

        if (this.componentCount <= 0) {
            //disable visibility filter
            this.visibilityFilter.enabled = false;
        }
    }

    update(timeDelta) {
        const entityManager = this.entityManager;

        const dataset = entityManager.dataset;

        if (dataset !== null) {
            dataset.traverseComponents(FogOfWar, function (fow) {
                fow.update(timeDelta);
            });
        }
    }
}