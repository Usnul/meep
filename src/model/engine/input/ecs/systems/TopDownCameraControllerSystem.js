/**
 * Created by Alex on 01/07/2015.
 */


import Vector3 from "../../../../core/geom/Vector3";
import ObservedValue from "../../../../core/model/ObservedValue";
import Transform from '../../../ecs/components/Transform';
import { System } from '../../../ecs/System';


import { clamp } from '../../../../core/math/MathUtils';

import TopDownCameraController from '../components/TopDownCameraController';

import { Euler as ThreeEuler } from 'three';
import Quaternion from "../../../../core/geom/Quaternion.js";

class TopDownCameraControllerSystem extends System {
    constructor() {
        super();

        this.enabled = new ObservedValue(true);
        this.componentClass = TopDownCameraController;

    }

    update(timeDelta) {
        const em = this.entityManager;
        //position
        const position = new Vector3();

        const dataset = em.dataset;

        if (this.enabled.get() && dataset !== null) {
            dataset.traverseEntities([TopDownCameraController, Transform], function (control, transform, entity) {

                //clamp the distance
                control.distance = clamp(control.distance, control.distanceMin, control.distanceMax);

                const distance = control.distance;
                const target = control.target;
                const rotationAngle = control.yaw;
                const tiltAngle = control.pitch;

                computeCameraFacingVector(control.yaw, control.pitch, control.roll, position);

                position.multiplyScalar(distance);
                position.add(target);

                transform.position.copy(position);
                euler.set(tiltAngle, rotationAngle, control.roll);
                transform.rotation.__setFromEuler(euler.x, euler.y, euler.z, euler.order);
            });
        }

    }
}

/// </summary>
/// <param name="sourcePoint">Coordinates of source point</param>
/// <param name="destPoint">Coordinates of destionation point</param>
/// <returns></returns>

const lookAt = (function () {
    // just in case you need that function also
    function CreateFromAxisAngle(axis, angle, result) {
        const halfAngle = angle * .5;
        const halfSin = Math.sin(halfAngle);
        const halfCos = Math.cos(halfAngle);
        result.set(axis.x * halfSin, axis.y * halfSin, axis.z * halfSin, halfCos);
    }

    const forwardVector = new Vector3();
    const __forwardVector = new Vector3(0, 0, 1);
    const __upVector = new Vector3(0, 1, 0);
    const rotAxis = new Vector3();

    function lookAt(sourcePoint, destPoint, result) {
        forwardVector.copy(destPoint).sub(sourcePoint).normalize();
        const dot = __forwardVector.dot(forwardVector);
        if (Math.abs(dot - (-1.0)) < 0.000001) {
            return result.set(__upVector.x, __upVector.y, __upVector.z, 3.1415926535897932);
        }
        if (Math.abs(dot - (1.0)) < 0.000001) {
            return result.set(0, 0, 0, 1);
        }

        const rotAngle = Math.acos(dot);
        rotAxis.copy(__forwardVector);
        rotAxis.cross(forwardVector);
        rotAxis.normalize();
        return CreateFromAxisAngle(rotAxis, rotAngle, result);
    }

    return lookAt;
})();


/**
 *
 * @type {Euler}
 */
const euler = new ThreeEuler(0, 0, 0, "YXZ");
const q = new Quaternion();

/**
 *
 * @param {number} yaw
 * @param {number} pitch
 * @param roll
 * @param {Vector3} result
 */
export function computeCameraFacingVector(yaw, pitch, roll, result) {

    q.fromEulerAngles(pitch, yaw, roll);
    q.normalize();

    result.copy(Vector3.forward);
    result.applyQuaternion(q);
    result.normalize();

}

/**
 *
 * @param {Transform} transform
 * @param {TopDownCameraController} controller
 */
export function setCameraControllerFromTransform(transform, controller) {
    //set camera controller
    const euler = new ThreeEuler();

    transform.rotation.__setThreeEuler(euler);

    controller.yaw = euler.y;

    const pitch = euler.x;

    controller.pitch = pitch;

    controller.roll = euler.z;

    //compute direction
    const direction = new Vector3();

    computeCameraFacingVector(controller.yaw, controller.pitch, controller.roll, direction);

    direction.normalize();

    controller.distance = 20;

    const targetOffset = direction.clone()
        .multiplyScalar(controller.distance);

    const target = transform.position.clone()
        .sub(targetOffset);

    controller.target.copy(target)
}

export default TopDownCameraControllerSystem;
