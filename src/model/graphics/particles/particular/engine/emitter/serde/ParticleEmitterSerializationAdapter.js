import { BinaryClassSerializationAdapter } from "../../../../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { ParticleEmitter } from "../ParticleEmitter.js";
import { ParticleLayer } from "../ParticleLayer.js";
import { ParticleEmitterFlag } from "../ParticleEmitterFlag.js";

export class ParticleEmitterSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = ParticleEmitter;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ParticleEmitter} value
     */
    serialize(buffer, value) {
        value.parameters.toBinaryBuffer(buffer);

        //pack flags
        buffer.writeUint32(value.flags & ParticleEmitter.SERIALIZABLE_FLAGS);

        buffer.writeUint8(value.blendingMode);
        value.layers.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ParticleEmitter} value
     */
    deserialize(buffer, value) {
        value.parameters.fromBinaryBuffer(buffer);

        //read flags
        const serializedFlags = buffer.readUint32();

        //clear serializable flags
        value.flags &= (~ParticleEmitter.SERIALIZABLE_FLAGS);

        //write serialized flags
        value.flags |= serializedFlags;

        value.blendingMode = buffer.readUint8();
        value.layers.fromBinaryBuffer(buffer, ParticleLayer);


        value.writeFlag(ParticleEmitterFlag.Built, false);
        value.setFlag(ParticleEmitterFlag.Emitting);

        //register loaded layers
        value.registerLayerParameters();
    }
}
