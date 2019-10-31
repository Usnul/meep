/**
 * Created by Alex on 02/04/2014.
 */

import Vector3 from "../../../core/geom/Vector3";
import Quaternion from "../../../core/geom/Quaternion";
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";
import { BinaryClassUpgrader } from "../storage/binary/BinaryClassUpgrader.js";

const delta = new Vector3();

export class Transform {
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
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Transform} value
     */
    serialize(buffer, value) {

        const positionX = value.position.x;
        const positionY = value.position.y;
        const positionZ = value.position.z;

        const encodedRotation = value.rotation.encodeToUint32();

        buffer.writeFloat64(positionX);
        buffer.writeFloat64(positionY);
        buffer.writeFloat64(positionZ);

        buffer.writeUint32(encodedRotation);

        value.scale.toBinaryBufferFloat32_EqualityEncoded(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Transform} value
     */
    deserialize(buffer, value) {
        const positionX = buffer.readFloat64();
        const positionY = buffer.readFloat64();
        const positionZ = buffer.readFloat64();

        const encodedRotation = buffer.readUint32();

        value.scale.fromBinaryBufferFloat32_EqualityEncoded(buffer);

        value.position.set(positionX, positionY, positionZ);

        value.rotation.decodeFromUint32(encodedRotation);
    }
}

export class TransformSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {

        const positionX = source.readFloat64();
        const positionY = source.readFloat64();
        const positionZ = source.readFloat64();

        const encodedRotation = source.readUint32();

        const scaleX = source.readFloat32();
        const scaleY = source.readFloat32();
        const scaleZ = source.readFloat32();


        //
        target.writeFloat64(positionX);
        target.writeFloat64(positionY);
        target.writeFloat64(positionZ);

        target.writeUint32(encodedRotation);

        let scaleHeader = 0;

        if (scaleX === scaleY) {
            scaleHeader |= 1;
        }

        if (scaleY === scaleZ) {
            scaleHeader |= 2;
        }

        if (scaleX === scaleZ) {
            scaleHeader |= 4;
        }

        target.writeUint8(scaleHeader);

        if ((scaleHeader & 7) === 7) {
            //all scale components are the same
            target.writeFloat32(scaleX);
        } else if (scaleHeader === 1) {
            //X and Y are the same, Z is different
            target.writeFloat32(scaleX);
            target.writeFloat32(scaleZ);
        } else if (scaleHeader === 2) {
            //Y and Z are the same, X is different
            target.writeFloat32(scaleX);
            target.writeFloat32(scaleY);
        } else if (scaleHeader === 4) {
            //X and Z are the same, Y is different
            target.writeFloat32(scaleX);
            target.writeFloat32(scaleY);
        } else {
            //scale components are different
            target.writeFloat32(scaleX);
            target.writeFloat32(scaleY);
            target.writeFloat32(scaleZ);
        }
    }
}
