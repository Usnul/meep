/**
 * Created by Alex on 17/08/2015.
 */


import Vector3 from '../../../../core/geom/Vector3';
import { assert } from "../../../../core/assert.js";
import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
//
// pass in distance in world space to move left
function panLeft(distance, object, result) {

    const panOffset = new Vector3();
    const te = object.matrix.elements;
    // get X column of matrix
    panOffset.set(te[0], te[1], te[2]);
    panOffset.multiplyScalar(-distance);

    //result.add(panOffset);
    result._sub(panOffset.x, 0, panOffset.z);

}

// pass in distance in world space to move up
function panUp(distance, object, result) {

    const panOffset = new Vector3();
    const te = object.matrix.elements;
    // get Y column of matrix
    panOffset.set(te[4], te[5], te[6]);
    panOffset.multiplyScalar(distance);

    //result.add(panOffset);
    result._sub(panOffset.x, 0, panOffset.z);
}

const deg2_in_rad = Math.PI / 360;

/**
 * main entry point; pass in Vector2 of change desired in pixel space, right and down are positive
 * @param {Vector2} delta
 * @param {Object3D} object
 * @param {Element} element
 * @param {number} targetDistance
 * @param {number} fov
 * @param {Vector3} result
 */
function pan(delta, object, element, targetDistance, fov, result) {
    assert.equal(typeof fov, "number", `fov must be of type "number", but instead was "${typeof fov}"`);

    // half of the fov is center to top of screen
    targetDistance *= Math.tan(fov * deg2_in_rad);
    // NOTE: we actually don't use screenWidth, since perspective camera is fixed to screen height
    panLeft(2 * delta.x * targetDistance / element.clientHeight, object, result);
    panUp(2 * delta.y * targetDistance / element.clientHeight, object, result);
}


class TopDownCameraController {
    constructor(options) {
        this.target = new Vector3();

        this.pitch = 0;
        this.yaw = 0;
        this.roll = 0;

        this.distance = 0;
        this.distanceMin = 1;
        this.distanceMax = 200;

        //
        if (options !== void 0) {
            this.fromJSON(options);
        }
    }

    /**
     *
     * @param {TopDownCameraController} other
     */
    copy(other) {
        this.target.copy(other.target);

        this.pitch = other.pitch;
        this.yaw = other.yaw;
        this.roll = other.roll;

        this.distance = other.distance;
        this.distanceMax = other.distanceMax;
        this.distanceMin = other.distanceMin;
    }

    toJSON() {
        return {
            target: this.target.toJSON(),

            pitch: this.pitch,
            yaw: this.yaw,
            roll: this.roll,

            distance: this.distance,
            distanceMin: this.distanceMin,
            distanceMax: this.distanceMax
        };
    }

    fromJSON(
        {
            distance = 0,
            distanceMin = 0,
            distanceMax = 0,
            pitch = 0,
            yaw = 0,
            roll = 0,
            target = Vector3.zero,
        }
    ) {

        this.distance = distance;
        this.distanceMin = distanceMin;
        this.distanceMax = distanceMax;

        this.pitch = pitch;
        this.roll = roll;
        this.yaw = yaw;

        this.target.fromJSON(target);

    }

}

TopDownCameraController.typeName = "TopDownCameraController";

TopDownCameraController.pan = pan;

export default TopDownCameraController;


export class TopDownCameraControllerSerializationAdapter extends BinaryClassSerializationAdapter {

    constructor() {
        super();

        this.klass = TopDownCameraController;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {TopDownCameraController} value
     */
    serialize(buffer, value) {
        value.target.toBinaryBuffer(buffer);

        buffer.writeFloat64(value.pitch);
        buffer.writeFloat64(value.yaw);
        //TODO serialize roll

        buffer.writeFloat64(value.distance);
        buffer.writeFloat64(value.distanceMin);
        buffer.writeFloat64(value.distanceMax);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {TopDownCameraController} value
     */
    deserialize(buffer, value) {
        value.target.fromBinaryBuffer(buffer);

        value.pitch = buffer.readFloat64();
        value.yaw = buffer.readFloat64();
        //TODO serialize roll

        value.distance = buffer.readFloat64();
        value.distanceMin = buffer.readFloat64();
        value.distanceMax = buffer.readFloat64();
    }
}
