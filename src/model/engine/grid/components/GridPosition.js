/**
 * Created by Alex on 13/10/2014.
 */

import Vector2 from '../../../core/geom/Vector2';
import { BinaryClassSerializationAdapter } from "../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { BinaryClassUpgrader } from "../../ecs/storage/binary/BinaryClassUpgrader.js";

/**
 * @extends {Vector2}
 * @constructor
 */
function GridPosition() {
    Vector2.call(this);
}

GridPosition.typeName = "GridPosition";

GridPosition.prototype = Object.create(Vector2.prototype);
GridPosition.prototype.constructor = GridPosition;

/**
 *
 * @param {object} json
 * @returns {GridPosition}
 */
GridPosition.fromJSON = function (json) {
    const r = new GridPosition();

    r.fromJSON(json);

    return r;
};

GridPosition.prototype.toJSON = function () {
    return {
        x: this.x,
        y: this.y
    };
};

GridPosition.prototype.fromJSON = function (obj) {
    this.x = obj.x;
    this.y = obj.y;
};

/**
 *
 * @param {GridPosition|Vector2} other
 */
GridPosition.prototype.copy = function (other) {
    Vector2.prototype.copy.call(this, other);
    return this;
};

GridPosition.prototype.clone = function () {
    const clone = new GridPosition();

    clone.copy(this);

    return clone;
};

export default GridPosition;

export class GridPositionSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = GridPosition;
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GridPosition} value
     */
    serialize(buffer, value) {
        const x = value.x;
        const y = value.y;

        let header = 0;
        if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0) {
            header = 1;
        }

        buffer.writeUint8(header);

        if (header === 1) {
            //both components are uint
            buffer.writeUintVar(x);
            buffer.writeUintVar(y);
        } else {
            buffer.writeFloat32(x);
            buffer.writeFloat32(y);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GridPosition} value
     */
    deserialize(buffer, value) {
        const header = buffer.readUint8();

        let x = 0, y = 0;
        if (header === 1) {
            x = buffer.readUintVar();
            y = buffer.readUintVar();
        } else {
            //float
            x = buffer.readFloat32();
            y = buffer.readFloat32();
        }

        value.set(x, y);
    }
}

export class GridPositionSerializationUpdater_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__targetVersion = 1;
        this.__startVersion = 0;
    }

    upgrade(source, target) {
        const x = source.readFloat64();
        const y = source.readFloat64();

        let header = 0;
        if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0) {
            header = 1;
        }

        target.writeUint8(header);

        if (header === 1) {
            //both components are uint
            target.writeUintVar(x);
            target.writeUintVar(y);
        } else {
            target.writeFloat32(x);
            target.writeFloat32(y);
        }

    }
}
