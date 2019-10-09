import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";

export const SerializationFlags = {
    Transient: 1
};

export class SerializationMetadata {
    constructor() {
        this.flags = 0;
    }


    /**
     *
     * @param {number|SerializationFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|SerializationFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|SerializationFlags} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|SerializationFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }
}

const transient = new SerializationMetadata();
transient.setFlag(SerializationFlags.Transient);

SerializationMetadata.Transient = Object.freeze(transient);

SerializationMetadata.typeName = "SerializationMetadata";


export class SerializationMetadataSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = SerializationMetadata;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SerializationMetadata} value
     */
    serialize(buffer, value) {
        buffer.writeUint8(value.flags);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SerializationMetadata} value
     */
    deserialize(buffer, value) {
        value.flags = buffer.readUint8();
    }
}
