/**
 * User: Alex Goldring
 * Date: 11/6/2014
 * Time: 21:44
 */
import { BinaryClassSerializationAdapter } from "../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";


function SoundListener() {
    this.prevPosition = { x: 0, y: 0, z: 0 };
    this.nodes = {
        listener: null
    };
}

SoundListener.typeName = "SoundListener";


SoundListener.prototype.toJSON = function () {
    return {};
};

SoundListener.prototype.fromJSON = function (json) {

};

/**
 *
 * @param {BinaryBuffer} buffer
 */
SoundListener.prototype.toBinaryBuffer = function (buffer) {
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
SoundListener.prototype.fromBinaryBuffer = function (buffer) {
};

export default SoundListener;


export class SoundListenerSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = SoundListener;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SoundListener} value
     */
    serialize(buffer, value) {
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SoundListener} value
     */
    deserialize(buffer, value) {
    }
}
