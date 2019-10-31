import ObservedString from "../../../model/core/model/ObservedString.js";
import Vector2 from "../../../model/core/geom/Vector2.js";
import { BinaryClassSerializationAdapter } from "../../../model/engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { computeHashIntegerArray } from "../../../model/core/math/MathUtils.js";

export class MinimapMarker {
    constructor() {
        /**
         *
         * @type {ObservedString}
         */
        this.iconURL = new ObservedString("");
        /**
         *
         * @type {Vector2}
         */
        this.size = new Vector2(10, 10);
    }

    toJSON() {
        return {
            iconURL: this.iconURL.toJSON(),
            size: this.size.toJSON()
        };
    }

    fromJSON(obj) {
        this.iconURL.fromJSON(obj.iconURL);

        if (obj.size !== undefined) {
            this.size.fromJSON(obj.size);
        } else {
            this.size.set(10, 10);
        }
    }

    hash() {
        return computeHashIntegerArray(
            this.iconURL.hash(),
            this.size.hashCode()
        );
    }

    /**
     *
     * @param {MinimapMarker} other
     */
    equals(other) {
        return this.iconURL.equals(other.iconURL) && this.size.equals(other.size);
    }

    /**
     *
     * @param json
     * @returns {MinimapMarker}
     */
    static fromJSON(json) {
        const r = new MinimapMarker();

        r.fromJSON(json);

        return r;
    }
}

MinimapMarker.typeName = "MinimapMarker";


export class MinimapMarkerSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = MinimapMarker;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {MinimapMarker} value
     */
    serialize(buffer, value) {
        value.iconURL.toBinaryBuffer(buffer);
        value.size.toBinaryBufferFloat32(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {MinimapMarker} value
     */
    deserialize(buffer, value) {
        value.iconURL.fromBinaryBuffer(buffer);
        value.size.fromBinaryBufferFloat32(buffer);
    }
}
