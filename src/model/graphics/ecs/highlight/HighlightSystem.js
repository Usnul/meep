/**
 * Created by Alex on 20/09/2015.
 */


import { System } from '../../../engine/ecs/System';
import Highlight from './Highlight';
import Mesh from '../mesh/Mesh';
import { MeshBasicMaterial, Scene as ThreeScene } from 'three';
import { OutlineRenderer } from "./OutlineRenderer.js";
import { BlendingType } from "../../texture/sampler/BlendingType.js";
import { max2 } from "../../../core/math/MathUtils.js";

const materialMemory = new Map();

class HighlightSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphicsEngine
     * @constructor
     */
    constructor(graphicsEngine) {
        super();

        this.componentClass = Highlight;
        this.dependencies = [Mesh];

        this.entityManager = null;

        const scene = this.scene = new ThreeScene();

        /**
         *
         * @type {GraphicsEngine}
         */
        this.graphicsEngine = graphicsEngine;
        const self = this;

        this.outlineRenderer = new OutlineRenderer(graphicsEngine.graphics, scene, graphicsEngine.camera);
        this.boundRender = this.render.bind(this);

        this.__handleModelMeshSet = function (model3d, entityId) {
            if (model3d.hasMesh() && model3d.mesh.material !== null) {
                /**
                 *
                 * @type {Highlight}
                 */
                const highlight = self.entityManager.getComponent(entityId, Highlight);

                model3d.mesh.traverse(o => {
                    if (o.isSkinnedMesh) {
                        highlight.material.skinning = true;
                    }
                });
            }
        };

        this.setViewportSize = function (x, y) {
            const width = max2(0, x);
            const height = max2(0, y);

            self.outlineRenderer.resize(width, height);
        };
    }


    /**
     *
     * @param {EntityManager} entityManager
     * @param {function} readyCallback
     * @param {function} errorCallback
     */
    shutdown(entityManager, readyCallback, errorCallback) {
        try {
            this.graphicsEngine.on.preRender.remove(this.boundRender);
            this.graphicsEngine.viewport.size.onChanged.remove(this.setViewportSize);

            readyCallback();
        } catch (e) {
            errorCallback();
        }
    }

    /**
     *
     * @param {EntityManager} entityManager
     * @param {function} readyCallback
     * @param {function} errorCallback
     */
    startup(entityManager, readyCallback, errorCallback) {
        /**
         *
         * @type {EntityManager}
         */
        this.entityManager = entityManager;

        this.graphicsEngine.viewport.size.process(this.setViewportSize);

        this.graphicsEngine.on.preRender.add(this.boundRender);

        //this.graphicsEngine.renderTargets.push(this.outlineRenderer.composer.renderTarget2);
        const compositLayer = this.graphicsEngine.layerComposer.addLayer(this.outlineRenderer.mainRenderTarget, BlendingType.Add);

        //render at half the resolution
        compositLayer.setRenderTargetScale(1);

        readyCallback();
    }

    render(renderer, camera, scene) {
        const em = this.entityManager;

        const _scene = this.scene;

        const dataset = em.dataset;


        if (dataset !== null) {
            //swap materials of scene objects
            dataset.traverseEntities([Highlight, Mesh], function (highlight, model, entity) {
                if (model.hasMesh()) {

                    model.mesh.traverse(o => {
                        if (o.isMesh || o.isSkinnedMesh) {
                            //remember material
                            materialMemory.set(o, o.material);

                            //replace with highlight material
                            o.material = highlight.material;
                        }
                    });

                    highlight.oldMeshParent = model.mesh.parent;
                    _scene.add(model.mesh);
                }
            });

            if (_scene.children.length === 0) {
                this.outlineRenderer.clearRenderTarget();
                //nothing to render
                return;
            } else {
                this.outlineRenderer.setCamera(camera);
                this.outlineRenderer.render();
            }

            //return material
            dataset.traverseEntities([Highlight, Mesh], function (highlight, model, entity) {
                if (model.hasMesh()) {
                    _scene.remove(model.mesh);

                    model.mesh.traverse(o => {
                        if (o.isMesh || o.isSkinnedMesh) {
                            // retrieve material
                            const material = materialMemory.get(o);

                            // restore material
                            o.material = material;
                        }
                    });


                    //THREE.js only allows a node to have a single parent, so we re-parent it back to original place
                    if (highlight.oldMeshParent !== null) {
                        highlight.oldMeshParent.add(model.mesh);
                    }
                }
            });

            materialMemory.clear();
        }
    }

    /**
     *
     * @param {Highlight} highlight
     * @param {Mesh} model
     * @param {int} entityId
     */
    link(highlight, model, entityId) {
        if (highlight.material === undefined) {
            highlight.material = new MeshBasicMaterial({
                color: { r: highlight.r, g: highlight.g, b: highlight.b },
                opacity: highlight.a,
                transparent: true
            });
        }
        const onModelMeshSet = this.__handleModelMeshSet;

        this.entityManager.addEntityEventListener(entityId, "model-mesh-set", onModelMeshSet);
        onModelMeshSet(model, entityId);
    }

    /**
     *
     * @param {Highlight} highlight
     * @param {Mesh} model
     * @param {int} entityId
     */
    unlink(highlight, model, entityId) {
        this.entityManager.removeEntityEventListener(entityId, "model-mesh-set", this.__handleModelMeshSet);
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const dataset = entityManager.dataset;

        if (dataset !== null) {
            dataset.traverseComponents(Highlight, function (h, entity) {

                if (h === undefined) {
                    console.error(`ECD.traverseComponents supplied undefined Highlight for entity ${entity}, skipping`);
                    return;
                }

                const m = h.material;

                if (m === undefined) {
                    return;
                }

                const c = m.color;
                if (c.r !== h.r || c.g !== h.g || c.b !== h.b) {
                    c.r = h.r;
                    c.g = h.g;
                    c.b = h.b;
                    m.needsUpdate = true;
                }
                if (h.a !== m.opacity) {
                    m.opacity = h.a;
                    m.needsUpdate = true;
                }
            });
        }
    }
}


export default HighlightSystem;
