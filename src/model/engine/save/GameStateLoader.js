/**
 * Created by Alex on 26/02/2017.
 */

import BinaryBufferSerialization from "../ecs/storage/BinaryBufferSerializer.js";
import { EncodingBinaryBuffer } from "../../core/binary/EncodingBinaryBuffer.js";

class GameStateLoader {
    /**
     *
     * @param {Engine} engine
     */
    constructor(engine) {
        /**
         * @type {Engine}
         */
        this.engine = engine;
        /**
         *
         * @type {Storage}
         */
        this.storage = engine.storage;
    }

    /**
     *
     * @returns {BinaryBuffer}
     */
    extractState() {
        const em = this.engine.entityManager;
        const dataset = em.dataset;
        const serializer = new BinaryBufferSerialization(/* serialization registry goes here */);

        const state = new EncodingBinaryBuffer();

        //pre-allocate capacity to avoid buffer re-sizing
        state.ensureCapacity(1048576);

        try {
            serializer.process(state, dataset);
        } catch (e) {
            //failed to serialize game state
            console.error("Failed to serialize game state", e);
        }

        state.trim();

        return state;
    }

    save(name, resolve, reject, progress) {
        const state = this.extractState();
        if (state !== null) {
            this.storage.storeBinary(name, state.data, resolve, reject, progress);
        } else {
            reject("Failed to extract the game state");
        }
    }

    load(name, resolve, reject, progress) {
        this.storage.loadBinary(name, resolve, reject, progress);
    }

    exists(name, resolve, reject) {
        this.storage.contains(name, resolve, reject);
    }
}

export default GameStateLoader;
