import Vector2 from "../../../core/geom/Vector2.js";
import { BinaryClassSerializationAdapter } from "../../ecs/storage/binary/BinaryClassSerializationAdapter.js";

/**
 * Created by Alex on 20/01/2015.
 */


export class GridPosition2Transform {
    constructor() {
        this.offset = new Vector2(0, 0);
    }

    toJSON() {
        return {
            offset: this.offset.toJSON()
        };
    }

    fromJSON(obj) {

        if (typeof obj.offset === "object") {
            this.offset.fromJSON(obj.transformOffset);
        } else {
            this.offset.set(0, 0);
        }

    }

    /**
     *
     * @param {GridPosition2Transform} other
     */
    copy(other) {
        this.offset.copy(other.offset);

        return this;
    }

    /**
     *
     * @returns {GridPosition2Transform}
     */
    clone() {
        const clone = new GridPosition2Transform();

        clone.copy(this);

        return clone;
    }

}

GridPosition2Transform.typeName = "GridPosition2Transform";


export class GridPosition2TransformSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = GridPosition2Transform;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GridPosition2Transform} value
     */
    serialize(buffer, value) {
        value.offset.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GridPosition2Transform} value
     */
    deserialize(buffer, value) {
        value.offset.fromBinaryBuffer(buffer);
    }
}
