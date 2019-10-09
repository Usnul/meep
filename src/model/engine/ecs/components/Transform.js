/**
 * Created by Alex on 02/04/2014.
 */

import Vector3 from "../../../core/geom/Vector3";
import Quaternion from "../../../core/geom/Quaternion";
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";

const delta = new Vector3();

class Transform {
    /**
     *
     * @param options
     * @constructor
     */
    constructor(options) {
        /**
         *
         * @type {Vector3}
         * @readonly
         */
        this.position = new Vector3(0, 0, 0);

        /**
         *
         * @type {Quaternion}
         * @readonly
         */
        this.rotation = new Quaternion(0, 0, 0, 1);

        /**
         *
         * @type {Vector3}
         * @readonly
         */
        this.scale = new Vector3(1, 1, 1);

        if (options !== void 0) {
            console.error('Transform parameters are deprecated');

            this.fromJSON(options);
        }

    }

    /**
     *
     * @param {Vector3} target
     * @param {number} [limit] Maximum angular displacement allowed towards the target, no limit by default. Useful for animating rotation towards a desired target.
     */
    lookAt(target, limit = Number.POSITIVE_INFINITY) {

        delta.copy(target);
        delta.sub(this.position);

        Transform.adjustRotation(this.rotation, delta, limit);
    }

    fromJSON(json) {
        const jp = json.position;

        if (jp !== undefined) {
            this.position.fromJSON(jp);
        } else {
            this.position.copy(Vector3.zero);
        }

        const jr = json.rotation;

        if (jr !== undefined) {
            this.rotation.fromJSON(jr);
        } else {
            this.rotation.copy(Quaternion.identity);
        }

        const js = json.scale;

        if (js !== undefined) {
            this.scale.fromJSON(js);
        } else {
            this.scale.copy(Vector3.one);
        }
    }

    toJSON() {
        return {
            position: this.position.toJSON(),
            rotation: this.rotation.toJSON(),
            scale: this.scale.toJSON()
        };
    }

    /**
     *
     * @param {Transform} other
     */
    copy(other) {
        this.position.copy(other.position);
        this.rotation.copy(other.rotation);
        this.scale.copy(other.scale);
    }

    /**
     *
     * @returns {Transform}
     */
    clone() {
        const clone = new Transform();

        clone.copy(this);

        return clone;
    }

    /**
     *
     * @param {Transform} other
     * @returns {boolean}
     */
    equals(other) {
        return other.isTransform
            && this.position.equals(other.position)
            && this.rotation.equals(other.rotation)
            && this.scale.equals(other.scale);
    }

    /**
     *
     * @param json
     * @returns {Transform}
     */
    static fromJSON(json) {
        const result = new Transform();

        result.fromJSON(json);

        return result;
    }
}

Transform.typeName = "Transform";

/**
 * @readonly
 * @type {boolean}
 */
Transform.prototype.isTransform = true;


/**
 * @param {Quaternion} sourceQuaternion
 * @param {Vector3} targetVector
 * @param {Number} limit
 */
Transform.adjustRotation = function (sourceQuaternion, targetVector, limit) {
    sourceQuaternion.lookRotation(targetVector, Vector3.up);
};

export default Transform;


export class TransformSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Transform;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Transform} value
     */
    serialize(buffer, value) {
        value.position.toBinaryBuffer(buffer);
        buffer.writeUint32(value.rotation.encodeToUint32());
        value.scale.toBinaryBufferFloat32(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Transform} value
     */
    deserialize(buffer, value) {
        value.position.fromBinaryBuffer(buffer);
        value.rotation.decodeFromUint32(buffer.readUint32());
        value.scale.fromBinaryBufferFloat32(buffer);
    }
}
