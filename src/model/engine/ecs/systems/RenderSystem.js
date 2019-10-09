/**
 * Created by Alex on 01/04/2014.
 */
import { System } from '../System';
import Renderable from '../components/Renderable';
import Transform from '../components/Transform';
import { SignalBinding } from "../../../core/events/signal/SignalBinding.js";
import { updateNodeByTransformAndBBB } from "../../../graphics/ecs/mesh/MeshSystem.js";
import { threeUpdateTransform } from "../../../graphics/Utils.js";
import { Box3 } from "three";


/**
 *
 * @param {Object3D} object
 * @param {AABB3} result
 */
export function three_computeObjectBoundingBox(object, result) {
    const _sX = object.scale.x;
    const _sY = object.scale.y;
    const _sZ = object.scale.z;

    object.scale.set(1, 1, 1);

    const box3 = new Box3();

    box3.expandByObject(object);

    object.scale.set(_sX, _sY, _sZ);

    const min = box3.min;
    const max = box3.max;

    result.setBounds(
        min.x,
        min.y,
        min.z,
        max.x,
        max.y,
        max.z
    );

}

class RenderSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphicsEngine
     * @constructor
     */
    constructor(graphicsEngine) {
        super();

        /**
         * @type {GraphicsEngine}
         */
        this.graphics = graphicsEngine;
        this.componentClass = Renderable;

        this.dependencies = [Transform];

        this.entityData = [];

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
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        this.renderLayer = this.graphics.layers.create('render-system');

        this.bvh = this.renderLayer.bvh;

        readyCallback();
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.graphics.layers.remove(this.renderLayer);

        readyCallback();
    }

    /**
     *
     * @param {Renderable} renderable
     * @param {Transform} transform
     * @param {int} entity
     */
    link(renderable, transform, entity) {
        //remember entity for fast lookup
        renderable.bvh.entity = entity;

        // compute bounding box
        three_computeObjectBoundingBox(renderable.object, renderable.boundingBox);


        function copyPositionOfMesh(x, y, z) {
            const m = renderable.object;
            const p = m.position;
            if (p.x !== x || p.y !== y || p.z !== z) {
                p.set(x, y, z);
            }
            updateMeshTransform(renderable);
            updateNodeByTransformAndBBB(renderable.bvh, renderable.boundingBox, transform);
        }

        function copyScaleOfMesh(x, y, z) {
            const m = renderable.object;
            const scale = m.scale;
            if (scale.x !== x || scale.y !== y || scale.z !== z) {
                scale.set(x, y, z);
            }
            updateMeshTransform(renderable);
            updateNodeByTransformAndBBB(renderable.bvh, renderable.boundingBox, transform);
        }

        function handleRotationChange() {
            const m = renderable.object;
            transform.rotation.__setThreeEuler(m.rotation);
            updateMeshTransform(renderable);
            updateNodeByTransformAndBBB(renderable.bvh, renderable.boundingBox, transform);
        }

        const position = transform.position;
        const scale = transform.scale;

        const bPosition = new SignalBinding(position.onChanged, copyPositionOfMesh);
        const bRotation = new SignalBinding(transform.rotation.onChanged, handleRotationChange);
        const bScale = new SignalBinding(scale.onChanged, copyScaleOfMesh);

        bPosition.link();
        bRotation.link();
        bScale.link();

        this.entityData[entity] = [
            bPosition,
            bRotation,
            bScale
        ];

        copyPositionOfMesh(position.x, position.y, position.z);
        copyScaleOfMesh(scale.x, scale.y, scale.z);

        this.bvh.insertNode(renderable.bvh);
    }

    /**
     *
     * @param {Renderable} renderable
     * @param {Transform} transform
     * @param {int} entity
     */
    unlink(renderable, transform, entity) {
        const list = this.entityData[entity];

        for (let i = 0; i < list.length; i++) {
            const binding = list[i];
            binding.unlink();
        }

        delete this.entityData[entity];

        renderable.bvh.disconnect();
    }

    update(timeDelta) {
    }
}


/**
 *
 * @param {Renderable} component
 */
function updateMeshTransform(component) {
    if (!component.matrixAutoUpdate) {
        //don't update matrix
        return;
    }

    /**
     *
     * @type {THREE.Object3D}
     */
    const m = component.object;

    threeUpdateTransform(m);
}

export default RenderSystem;
