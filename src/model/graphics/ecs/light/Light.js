/**
 * Created by Alex on 01/06/2016.
 */

import ObservedEnum from "../../../core/model/ObservedEnum.js";
import Vector1 from "../../../core/geom/Vector1.js";
import { Color } from "../../../core/color/Color.js";
import ObservedBoolean from "../../../core/model/ObservedBoolean.js";
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

/**
 *
 * @constructor
 */
function Light() {
    /**
     *
     * @type {ObservedEnum}
     */
    this.type = new ObservedEnum(LightType.DIRECTION, LightType);

    /**
     *
     * @type {Color}
     */
    this.color = new Color(1, 1, 1);

    /**
     *
     * @type {Vector1}
     */
    this.intensity = new Vector1(1);

    /**
     * Only applicable for SPOT light, controls conic angle of the light
     * @type {Vector1}
     */
    this.angle = new Vector1(Math.PI / 4);

    /**
     * Only applicable for SPOT light, controls penumbra share of the illuminated area. 1 - only penumbra and no umbra, 0 - no penumbra and only umbra
     * @type {Vector1}
     */
    this.penumbra = new Vector1(0.4);

    /**
     * Applicable for SPOT and POINT lights, controls maximum extents of influence of the light
     * @type {Vector1}
     */
    this.distance = new Vector1(10);

    /**
     *
     * @type {ObservedBoolean}
     */
    this.castShadow = new ObservedBoolean(false);

    this.__threeObject = null;
}

Light.typeName = "Light";

/**
 *
 * @enum {number}
 */
const LightType = {
    DIRECTION: 0,
    SPOT: 1,
    POINT: 2,
    AMBIENT: 3
};

Light.Type = LightType;

Light.prototype.fromJSON = function (json) {
    if (json.type !== undefined) {
        this.type.fromJSON(json.type);
    }
    if (json.color !== undefined) {
        this.color.fromUint(json.color);
    }
    if (json.intensity !== undefined) {
        this.intensity.fromJSON(json.intensity);
    }
    if (json.castShadow !== undefined) {
        this.castShadow.fromJSON(json.castShadow);
    }

    if (this.type.getValue() === LightType.SPOT) {
        if (json.angle !== undefined) {
            this.angle.fromJSON(json.angle);
        }
        if (json.penumbra !== undefined) {
            this.penumbra.fromJSON(json.penumbra);
        }
        if (json.distance !== undefined) {
            this.distance.fromJSON(json.distance);
        }
    }
    this.__threeObject = null;
};

Light.prototype.toJSON = function () {
    const result = {
        type: this.type.toJSON(),
        color: this.color.toUint(),
        intensity: this.intensity.toJSON(),
        castShadow: this.castShadow.toJSON()
    };

    if (this.type.getValue() === LightType.SPOT) {
        result.angle = this.angle.toJSON();
        result.penumbra = this.penumbra.toJSON();
        result.distance = this.distance.toJSON();
    }


    return result;
};

export { Light, LightType };

export class LightSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = Light;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Light} value
     */
    serialize(buffer, value) {

        buffer.writeUint8(value.type.getValue());
        buffer.writeUint32(value.color.toUint());
        value.intensity.toBinaryBuffer(buffer);
        value.castShadow.toBinaryBuffer(buffer);

        if (value.type.getValue() === LightType.SPOT) {
            value.angle.toBinaryBuffer(buffer);
            value.penumbra.toBinaryBuffer(buffer);
            value.distance.toBinaryBuffer(buffer);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Light} value
     */
    deserialize(buffer, value) {

        value.type.set(buffer.readUint8());
        value.color.fromUint(buffer.readUint32());
        value.intensity.fromBinaryBuffer(buffer);
        value.castShadow.fromBinaryBuffer(buffer);

        if (value.type.getValue() === LightType.SPOT) {
            value.angle.fromBinaryBuffer(buffer);
            value.penumbra.fromBinaryBuffer(buffer);
            value.distance.fromBinaryBuffer(buffer);
        }
    }
}
