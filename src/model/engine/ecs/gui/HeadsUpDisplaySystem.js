/**
 * User: Alex Goldring
 * Date: 22/6/2014
 * Time: 22:07
 */
import { System } from '../System.js';
import HeadsUpDisplay from './HeadsUpDisplay.js';
import Transform from '../components/Transform.js';

import { Matrix4 } from 'three';
import { GraphicsEngine } from "../../../graphics/GraphicsEngine.js";
import { FogOfWarVisibilityPredicate } from "../../../level/fow/FogOfWarVisibilityPredicate.js";
import Vector4 from "../../../core/geom/Vector4.js";
import ViewportPosition from "./ViewportPosition.js";
import GUIElement from "./GUIElement.js";

/**
 *
 * @type {Vector4}
 */
const v4 = new Vector4();
const projectionMatrix = new Matrix4();

/**
 *
 * @param {GraphicsEngine} graphicsEngine
 * @param containerView
 * @constructor
 */
class HeadsUpDisplaySystem extends System {
    constructor(graphicsEngine) {
        super();

        this.componentClass = HeadsUpDisplay;

        if (!(graphicsEngine instanceof GraphicsEngine)) {
            throw new TypeError(`graphicsEngine is not an instance of GraphicsEngine`);
        }

        this.graphics = graphicsEngine;

        const self = this;
        this.preRenderHandler = function () {
            self.synchronizePositions();
        };

    }

    shutdown(em, cbOK, cbFailure) {
        try {
            this.graphics.on.preRender.remove(this.preRenderHandler);

            cbOK();
        } catch (e) {
            cbFailure(e);
        }
    }

    startup(em, cbOK, cbFailure) {
        this.entityManager = em;

        this.graphics.on.preRender.add(this.preRenderHandler);

        cbOK();
    }

    synchronizePositions() {
        const entityManager = this.entityManager;

        /**
         *
         * @type {Camera} three.js camera object
         */
        const camera = this.graphics.camera;


        projectionMatrix.multiplyMatrices(camera.projectionMatrix, projectionMatrix.getInverse(camera.matrixWorld));

        const visibilityPredicate = new FogOfWarVisibilityPredicate();
        // Because of blur being applied to FOW, sometimes you can see a tile quite clearly, though be unable to interact with it, higher clearance helps with that
        visibilityPredicate.maxClearance = 1;

        /**
         *
         * @param {HeadsUpDisplay} hud
         * @param {Transform} transform
         * @param {ViewportPosition} vp
         * @param {GUIElement} element
         */
        function visitEntity(hud, transform, vp, element) {
            const position = transform.position;
            const worldOffset = hud.worldOffset;

            let worldOffsetX = worldOffset.x;
            let worldOffsetY = worldOffset.y;
            let worldOffsetZ = worldOffset.z;

            v4.set(
                worldOffsetX,
                worldOffsetY,
                worldOffsetZ,
                1
            );

            if (hud.transformWorldOffset) {
                //apply scale and rotation

                v4.multiplyVector3(transform.scale);

                v4.applyQuaternion(transform.rotation);
            }

            v4.add3(position);

            const worldPositionX = v4.x;
            const worldPositionY = v4.y;
            const worldPositionZ = v4.z;

            // Convert the [-1, 1] screen coordinate into a world coordinate on the near plane
            v4.threeApplyMatrix4(projectionMatrix);

            const d = 1 / Math.abs(v4.w);
            v4.x *= d;
            v4.y *= d;
            v4.z *= d;

            const ndcX = (v4.x + 1) / 2;
            const ndcY = (1 - v4.y) / 2;

            vp.position.set(ndcX, ndcY);


            const trackedPositionOutOfBounds = v4.z > 1 || v4.z < -1;

            const visible = (!trackedPositionOutOfBounds || vp.stickToScreenEdge) && visibilityPredicate.test(worldPositionX, worldPositionY, worldPositionZ);

            if (!visible) {
                vp.enabled.set(false);
                element.visible.set(false);
            } else {
                vp.enabled.set(true);
                //TODO set z-index to ensure that things that are closer to the camera appear on top
            }

        }

        /**
         * @type {EntityComponentDataset}
         */
        const dataset = entityManager.dataset;
        if (dataset !== null) {
            visibilityPredicate.initialize(camera, dataset);
            dataset.traverseEntities([HeadsUpDisplay, Transform, ViewportPosition, GUIElement], visitEntity);
            visibilityPredicate.finalize();
        }
    };
}

export default HeadsUpDisplaySystem;
