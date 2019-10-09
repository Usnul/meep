/**
 * Created by Alex on 13/10/2014.
 */

import Vector2 from '../../../core/geom/Vector2';
import { BinaryClassSerializationAdapter } from "../../ecs/storage/binary/BinaryClassSerializationAdapter.js";

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

export class GridPositionSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = GridPosition;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GridPosition} value
     */
    serialize(buffer, value) {
        Vector2.prototype.toBinaryBuffer.call(value, buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GridPosition} value
     */
    deserialize(buffer, value) {
        Vector2.prototype.fromBinaryBuffer.call(value, buffer);
    }
}
