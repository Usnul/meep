/**
 * Created by Alex on 13/05/2016.
 */
import { System } from '../../../engine/ecs/System';
import Transform from '../../../engine/ecs/components/Transform';

import ClingToTerrain from './ClingToTerrain';
import Terrain, { obtainTerrain } from './Terrain';

import Vector3 from '../../../core/geom/Vector3';
import Quaternion from "../../../core/geom/Quaternion.js";
import { clamp, EPSILON, min2 } from "../../../core/math/MathUtils.js";
import { Matrix4 } from "three";
import { noop } from "../../../core/function/Functions.js";


function deregister(datum) {
    const update = datum.update;

    const transform = datum.transform;

    transform.position.onChanged.remove(update);
    transform.rotation.onChanged.remove(update);
}

class ClingToTerrainSystem extends System {
    /**
     *
     * @constructor
     */
    constructor() {
        super();

        this.componentClass = ClingToTerrain;
        this.dependencies = [Transform];

        /**
         *
         * @type {EntityManager|null}
         */
        this.entityManager = null;

        this.updateQueue = [];
        this.data = [];

        /**
         * How many entities can be updated in a single tick, this is useful for performance optimization, if you have a large number of entities that need to be updated, updates can be executed over several ticks
         * @type {number}
         */
        this.updateBatchLimit = 100;
    }

    requestUpdate(entity) {
        if (this.updateQueue.indexOf(entity) === -1) {
            //queue up update
            this.updateQueue.push(entity);
        }
    }

    /**
     *
     * @param {Transform} transform
     * @param {ClingToTerrain} cling
     * @param {int} entityId
     */
    link(cling, transform, entityId) {
        const self = this;

        function update() {
            self.requestUpdate(entityId);
        }

        self.data[entityId] = {
            update,
            transform,
            component: cling
        };

        transform.position.onChanged.add(update);
        transform.rotation.onChanged.add(update);

        update();
    }

    /**
     *
     * @param {Transform} transform
     * @param {ClingToTerrain} cling
     * @param {int} entityId
     */
    unlink(cling, transform, entityId) {
        const datum = this.data[entityId];

        if (datum === undefined) {
            console.error(`Tried to remove entity ${entityId}, but it was not registered. This is an inconsistency bug.`, transform, cling, `component dump:`, this.entityManager.getComponents(entityId));
            return;
        }

        deregister(datum);

        delete this.data[entityId];

        const updateIndex = this.updateQueue.indexOf(entityId);
        if (updateIndex !== -1) {
            //clear update request if one is pending
            this.updateQueue.splice(updateIndex, 1);
        }
    }

    reset() {
        this.updateQueue = [];

        const data = this.data;
        for (let entity in data) {
            if (!data.hasOwnProperty(entity)) {
                continue;
            }
            const datum = data[entity];
            deregister(datum);
        }

        this.data = [];
    }

    update(timeDelta) {
        const em = this.entityManager;

        /**
         *
         * @type {EntityComponentDataset}
         */
        const dataset = em.dataset;

        if (dataset === null) {
            //no dataset attached
            return;
        }

        const updateCandidates = this.updateQueue;

        const terrain = obtainTerrain(dataset);

        if (terrain !== null) {
            const batchSize = min2(
                updateCandidates.length,
                this.updateBatchLimit
            );


            const batch = updateCandidates.splice(0, batchSize);

            for (let i = 0; i < batchSize; i++) {
                const entity = batch[i];

                const c = this.data[entity];

                if (c === undefined) {
                    /*
                        this should never happen as update queue is cleaned up when component is removed
                        the entity is gone
                     */

                    console.warn("ClingToTerrain component was in the update queue, but no data found. Skipping");
                    continue;
                }

                doCling(c, terrain, timeDelta);
            }
        }
    }
}


const matrix4 = new Matrix4();
const v3_temp = new Vector3();
const v3_forward = new Vector3();
const v3_up = new Vector3();

const q_temp = new Quaternion();

/**
 *
 * @param {Quaternion} rotation
 * @param {Vector3} up
 * @param {number} angularLimit
 */
export function alignToVector(rotation, up, angularLimit) {
    //compute old facing direction vector
    v3_forward.copy(Vector3.forward);

    v3_forward.applyQuaternion(rotation);

    //compute perpendicular vector between old and desired alignment
    v3_temp.crossVectors(up, v3_forward);

    //compute new facing vector that is perpendicular to alignment direction
    v3_temp.crossVectors(v3_temp, up);

    matrix4.identity();

    matrix4.lookAt(v3_temp, Vector3.zero, up);

    const el = matrix4.elements;

    q_temp.__setFromRotationMatrix(
        el[0], el[4], el[8],
        el[1], el[5], el[9],
        el[2], el[6], el[10]
    );

    v3_up.copy(Vector3.up);

    v3_up.applyQuaternion(rotation);

    const angle = v3_up.angleTo(up);

    if (angle === 0) {
        //no change
        return;
    }

    const t = clamp(angularLimit / angle, 0, 1);

    rotation.lerp(q_temp, t);
}


/**
 *
 * @param {Vector3} point
 * @param {Transform} t
 * @param {Vector3} normal
 * @param {ClingToTerrain} cling
 * @param {number} timeDelta
 */
function processRaycastHit(point, t, normal, cling, timeDelta) {
    const position = t.position;

    const rotation = t.rotation;

    const hitDistance = position.distanceTo(point);

    //cache current position
    cling.__lastPosition.copy(position);
    cling.__lastRotation.copy(rotation);

    if (hitDistance > EPSILON) {
        position.setY(point.y);
    }

    const angularLimit = cling.rotationSpeed * timeDelta;

    if (cling.normalAlign) {
        alignToVector(rotation, normal, angularLimit);
    }

}

/**
 *
 * @param {{component:ClingToTerrain,transform:Transform}} el
 * @param {Terrain} terrain
 * @param {number} timeDelta
 */
function doCling(el, terrain, timeDelta) {
    /**
     * @type {ClingToTerrain}
     */
    const cling = el.component;

    /**
     *
     * @type {Transform}
     */
    const t = el.transform;

    /**
     *
     * @type {Vector3}
     */
    const position = t.position;

    const rotation = t.rotation;

    if (
        cling.__lastPosition.roughlyEquals(position, 0.001)
        && cling.__lastRotation.roughlyEquals(rotation, 0.0001)
    ) {
        //do nothing, cached position matches with existing position
        return;
    }

    function failed(e) {
        console.log("Failed terrain raycast", e);
    }


    terrain.raycastVertical(position.x, position.z, function (point, normal) {
        processRaycastHit(point, t, normal, cling, timeDelta);
    }, noop, failed);


}

export default ClingToTerrainSystem;
