import { System } from "../../../engine/ecs/System.js";
import { ParticleEmitter } from "../particular/engine/emitter/ParticleEmitter.js";
import { ParticularEngine } from "../particular/engine/ParticularEngine.js";
import { StandardFrameBuffers } from "../../GraphicsEngine.js";
import Transform from "../../../engine/ecs/components/Transform.js";
import { frustumFromCamera } from "../../ecs/camera/CameraSystem.js";
import { Frustum } from "three";
import { ParticleEmitterFlag } from "../particular/engine/emitter/ParticleEmitterFlag.js";
import { RenderPassType } from "../../render/RenderPassType.js";
import { ParticleEmitterLibrary } from "../ParticleEmitterLibrary.js";

const frustum = new Frustum();

/**
 *
 * @param {ParticleEmitter} emitter
 */
function putEmitterToSleep(emitter) {
    emitter.setFlag(ParticleEmitterFlag.Sleeping);
}

export class ParticleEmitterSystem2 extends System {
    /**
     *
     * @extends {System.<ParticleEmitter>}
     * @constructor
     * @param {AssetManager} assetManager
     * @param {GraphicsEngine} graphicsEngine
     */
    constructor(assetManager, graphicsEngine) {
        super();

        this.componentClass = ParticleEmitter;
        this.dependencies = [Transform];

        /**
         *
         * @type {GraphicsEngine}
         */
        this.graphicsEngine = graphicsEngine;

        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = assetManager;

        /**
         *
         * @type {ParticularEngine}
         */
        this.particleEngine = new ParticularEngine(assetManager);

        /**
         *
         * @type {ParticleEmitter[]}
         */
        this.awakeSet = [];

        /**
         *
         * @type {RenderLayer|null}
         */
        this.renderLayer = null;

        /**
         *
         * @type {BinaryNode}
         */
        this.bvh = null;

        /**
         *
         * @type {ParticleEmitterLibrary}
         */
        this.library = new ParticleEmitterLibrary(assetManager);

        this.__handlers = [];
    }

    updateAwakeSetFromCamera(camera) {
        //put all awake emitters to sleep
        const awakeSet = this.awakeSet;

        awakeSet.forEach(putEmitterToSleep);

        awakeSet.length = 0;

        frustumFromCamera(camera, frustum);

        this.particleEngine.bvh.threeTraverseFrustumsIntersections([frustum], function (leaf) {
            /**
             * @type {ParticleEmitter}
             */
            const emitter = leaf.object;

            //wake up
            emitter.clearFlag(ParticleEmitterFlag.Sleeping);

            //add to awake set
            awakeSet.push(emitter);
        });
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        const graphicsEngine = this.graphicsEngine;
        this.renderLayer = graphicsEngine.layers.create('particles-system');

        this.renderLayer.renderPass = RenderPassType.Transparent;

        /**
         *
         * @param {ParticleEmitter} emitter
         * @returns {Group|Object3D}
         */
        function extractRenderable(emitter) {


            return emitter.mesh;
        }

        this.renderLayer.extractRenderable = extractRenderable;

        this.bvh = this.renderLayer.bvh;
        this.bvh.insertNode(this.particleEngine.bvh);

        const self = this;

        const depthBuffer = graphicsEngine.frameBuffers.getById(StandardFrameBuffers.ColorAndDepth);

        const depthTexture = depthBuffer.renderTarget.depthTexture;

        this.particleEngine.setDepthTexture(depthTexture);


        function updateViewportSize() {
            const size = graphicsEngine.viewport.size;

            const pixelRatio = graphicsEngine.computeTotalPixelRatio();

            self.particleEngine.setViewportSize(size.x * pixelRatio, size.y * pixelRatio);
        }

        graphicsEngine.viewport.size.process(updateViewportSize);
        graphicsEngine.pixelRatio.onChanged.add(updateViewportSize);

        function preRenderHook(renderer, camera, scene) {
            //update camera
            self.particleEngine.setCamera(camera);
            //update sleeping/ awake status
            self.updateAwakeSetFromCamera(camera);
            //update shaders
            self.particleEngine.shaderManager.update();

            /**
             *
             * @type {ParticleEmitter[]}
             */
            const awakeSet = self.awakeSet;
            const numAwake = awakeSet.length;

            if (numAwake > 0) {
                depthBuffer.referenceCount++;
                self.graphicsEngine.on.postRender.addOne(function () {
                    depthBuffer.referenceCount--;
                });
            }

            for (let i = 0; i < numAwake; i++) {
                /**
                 *
                 * @type {ParticleEmitter}
                 */
                const emitter = awakeSet[i];

                //update particle geometry
                emitter.update();


                if (emitter.getFlag(ParticleEmitterFlag.DepthSorting)) {

                    /*
                     sort particles.

                     NOTE: It is important that update is done first before sort, as sort assumes that all particles in the
                     pool are alive. If this assumption is broken - corruption of the pool may occur
                     */
                    emitter.sort(camera);
                }
            }
        }

        graphicsEngine.on.preRender.add(preRenderHook);

        readyCallback();
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.graphicsEngine.layers.remove(this.renderLayer);

        readyCallback();
    }

    /**
     *
     * @param {ParticleEmitter} emitter
     * @param {Transform} transform
     * @param entity
     */
    link(emitter, transform, entity) {
        function handlePositionChange(x, y, z) {
            emitter.position.set(x, y, z);
        }

        transform.position.process(handlePositionChange);

        function handleRotationChange(x, y, z, w) {
            emitter.rotation.set(x, y, z, w);
        }

        transform.rotation.process(handleRotationChange);

        function handleScaleChange(x, y, z) {
            emitter.scale.set(x, y, z);
        }

        transform.scale.process(handleScaleChange);

        this.__handlers[entity] = {
            handlePositionChange,
            handleRotationChange,
            handleScaleChange
        };

        //initialize emitter as suspended to prevent needless updates
        emitter.setFlag(ParticleEmitterFlag.Sleeping);

        // emitter.bvhLeaf.entity = entity; //this line makes emitter selectable via bounding box in editor

        this.particleEngine.add(emitter);
    }

    /**
     *
     * @param {ParticleEmitter} emitter
     * @param {Transform} transform
     * @param entity
     */
    unlink(emitter, transform, entity) {
        const handler = this.__handlers[entity];

        transform.position.onChanged.remove(handler.handlePositionChange);
        transform.rotation.onChanged.remove(handler.handleRotationChange);
        transform.scale.onChanged.remove(handler.handleScaleChange);

        delete this.__handlers[entity];

        this.particleEngine.remove(emitter);
    }

    update(timeDelta) {
        this.particleEngine.advance(timeDelta);
    }
}
