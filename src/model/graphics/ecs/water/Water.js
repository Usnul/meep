/**
 * Created by Alex on 17/02/2017.
 */


import Vector3 from "../../../core/geom/Vector3";
import Vector1 from "../../../core/geom/Vector1.js";
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

function Water(options) {
    this.level = new Vector1(0);

    if (options !== undefined) {
        this.fromJSON(options);
    }

    this.color = new Vector3(0, 0.3, 0.5);
}

Water.typeName = "Water";

Water.prototype.fromJSON = function (json) {
    if (typeof json.level === 'number') {
        this.level.fromJSON(json.level);
    }
    if (typeof json.color === 'object') {
        this.color.fromJSON(json.color);
    }
};

Water.prototype.toJSON = function () {
    return {
        level: this.level.toJSON(),
        color: this.color.toJSON()
    };
};

export default Water;

export class WaterSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Water;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Water} value
     */
    serialize(buffer, value) {
        value.level.toBinaryBuffer(buffer);

        value.color.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Water} value
     */
    deserialize(buffer, value) {
        value.level.fromBinaryBuffer(buffer);

        value.color.fromBinaryBuffer(buffer);
    }
}
