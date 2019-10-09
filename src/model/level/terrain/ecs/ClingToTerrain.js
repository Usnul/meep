/**
 * Created by Alex on 13/05/2016.
 */
import Vector3 from "../../../core/geom/Vector3";
import Quaternion from "../../../core/geom/Quaternion.js";
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

const ClingToTerrain = function (options) {
    if (options === undefined) {
        options = {};
    }

    /**
     * @type {boolean}
     */
    this.normalAlign = options.normalAlign !== undefined ? options.normalAlign : false;

    /**
     * Used internally for caching updates
     * @type {Vector3}
     */
    this.__lastPosition = new Vector3(0, 0, 0);
    /**
     *
     * @type {Quaternion}
     */
    this.__lastRotation = new Quaternion(0, 0, 0, 1);

    /**
     * Speed in Rad/s (Radians/second) by which rotation can change
     * @type {number}
     */
    this.rotationSpeed = 3;
};

ClingToTerrain.typeName = "ClingToTerrain";

/**
 *
 * @param json
 * @returns {ClingToTerrain}
 */
ClingToTerrain.fromJSON = function (json) {
    const r = new ClingToTerrain();

    r.fromJSON(json);

    return r;
};


ClingToTerrain.prototype.toJSON = function () {
    return {
        normalAlign: this.normalAlign,
        rotationSpeed: this.rotationSpeed
    };
};

ClingToTerrain.prototype.fromJSON = function (
    {
        normalAlign = false,
        rotationSpeed = Number.POSITIVE_INFINITY
    }
) {
    this.normalAlign = normalAlign;
    this.rotationSpeed = rotationSpeed;
};


export default ClingToTerrain;


export class ClingToTerrainSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = ClingToTerrain;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ClingToTerrain} value
     */
    serialize(buffer, value) {
        //TODO serialize rotation speed
        buffer.writeUint8(value.normalAlign ? 1 : 0);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ClingToTerrain} value
     */
    deserialize(buffer, value) {
        //TODO deserialize rotation speed
        value.normalAlign = buffer.readUint8() !== 0;
    }
}
