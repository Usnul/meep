import Vector2 from "../../../core/geom/Vector2.js";
import { BinaryClassSerializationAdapter } from "../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { BinaryClassUpgrader } from "../../ecs/storage/binary/BinaryClassUpgrader.js";

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

    /**
     *
     * @param {GridPosition2Transform} other
     * @returns {boolean}
     */
    equals(other) {
        return this.offset.equals(other.offset);
    }

    /**
     * @returns {number}
     */
    hash() {
        return this.offset.hashCode();
    }

}

GridPosition2Transform.typeName = "GridPosition2Transform";


export class GridPosition2TransformSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = GridPosition2Transform;
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GridPosition2Transform} value
     */
    serialize(buffer, value) {
        const offsetX = value.offset.x;
        const offsetY = value.offset.y;

        let header = 3;
        if (offsetX === 0 && offsetY === 0) {
            header = 0;
        } else if (offsetX === 0) {
            header = 2;
        } else if (offsetY === 0) {
            header = 1;
        } else {
            //both coordinates are present
            header = 3;
        }

        buffer.writeUint8(header);

        if ((header & 1) !== 0) {
            //write X
            buffer.writeFloat32(offsetX);
        }

        if ((header & 2) !== 0) {
            //write Y
            buffer.writeFloat32(offsetY);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GridPosition2Transform} value
     */
    deserialize(buffer, value) {
        //read header
        const header = buffer.readUint8();


        let offsetX = 0, offsetY = 0;

        if ((header & 1) !== 0) {
            //write X
            offsetX = buffer.readFloat32();
        }

        if ((header & 2) !== 0) {
            //write Y
            offsetY = buffer.readFloat32();
        }

        value.offset.set(offsetX, offsetY);
    }
}

export class GridPosition2TransformSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        //
        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {
        const offsetX = source.readFloat64();
        const offsetY = source.readFloat64();

        let header = 3;
        if (offsetX === 0 && offsetY === 0) {
            header = 0;
        } else if (offsetX === 0) {
            header = 2;
        } else if (offsetY === 0) {
            header = 1;
        } else {
            //both coordinates are present
            header = 3;
        }

        target.writeUint8(header);

        if ((header & 1) !== 0) {
            //write X
            target.writeFloat32(offsetX);
        }

        if ((header & 2) !== 0) {
            //write Y
            target.writeFloat32(offsetY);
        }
    }
}
