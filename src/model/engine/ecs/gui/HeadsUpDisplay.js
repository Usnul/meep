/**
 * User: Alex Goldring
 * Date: 22/6/2014
 * Time: 22:05
 */


import Vector3 from '../../../core/geom/Vector3.js';
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";

class HeadsUpDisplay {
    /**
     *
     * @param worldOffset
     */
    constructor({
                    worldOffset = new Vector3()
                } = {}) {

        /**
         *
         * @type {Vector3}
         */
        this.worldOffset = worldOffset;

        /**
         * Whether or not world offset should be transformed using {@link Transform}
         * @type {boolean}
         */
        this.transformWorldOffset = true;
    }
}

HeadsUpDisplay.typeName = "HeadsUpDisplay";
HeadsUpDisplay.serializable = true;

export default HeadsUpDisplay;

export class HeadsUpDisplaySerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = HeadsUpDisplay;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {HeadsUpDisplay} value
     */
    serialize(buffer, value) {
        value.worldOffset.toBinaryBuffer(buffer);
        buffer.writeUint8(value.transformWorldOffset ? 1 : 0);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {HeadsUpDisplay} value
     */
    deserialize(buffer, value) {
        value.worldOffset.fromBinaryBuffer(buffer);
        value.transformWorldOffset = buffer.readUint8() !== 0;
    }
}
