/**
 * Created by Alex on 01/04/2014.
 */


import Vector1 from "../../../core/geom/Vector1.js";
import { BooleanVector3 } from "../../../core/model/BooleanVector3.js";
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

/**
 *
 * @enum {string}
 */
export const PathFollowerEventType = {
    EndReached: "path-end-reached"
};

function PathFollower() {
    this.rotationAlignment = new BooleanVector3(true, true, true);

    this.speed = new Vector1(1);

    this.active = true;

    this.lock = false; //path finding lock, use to prevent race queries. Don't start looking for new path until lock is freed

    /**
     * Speed at which path follower can adjust rotation in Rad/s
     * @type {Vector1}
     */
    this.rotationSpeed = new Vector1(Infinity);
}

PathFollower.typeName = "PathFollower";

/**
 *
 * @param json
 * @returns {PathFollower}
 */
PathFollower.fromJSON = function (json) {
    const r = new PathFollower();

    r.fromJSON(json);

    return r;
};

PathFollower.prototype.toJSON = function () {
    return {
        active: this.active,
        speed: this.speed.toJSON(),
        rotationAlignment: this.rotationAlignment.toJSON(),
        discretization: this.discretization.toJSON()
    };
};

PathFollower.prototype.fromJSON = function (json) {
    if (typeof json.active === "boolean") {
        this.active = json.active;
    }
    if (typeof json.speed === "number") {
        this.speed.fromJSON(json.speed);
    }
    if (json.rotationAlignment !== undefined) {
        this.rotationAlignment.fromJSON(json.rotationAlignment);
    }

    if (typeof json.rotationSpeed === "number") {
        this.rotationSpeed.fromJSON(json.rotationSpeed);
    }
};

export default PathFollower;

export class PathFollowerSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = PathFollower;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {PathFollower} value
     */
    serialize(buffer, value) {
        buffer.writeUint8(value.active ? 1 : 0);
        value.speed.toBinaryBuffer(buffer);
        value.rotationAlignment.toBinaryBuffer(buffer);
        value.rotationSpeed.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {PathFollower} value
     */
    deserialize(buffer, value) {
        value.active = buffer.readUint8() !== 0;
        value.speed.fromBinaryBuffer(buffer);
        value.rotationAlignment.fromBinaryBuffer(buffer);
        value.rotationSpeed.fromBinaryBuffer(buffer);
    }
}
