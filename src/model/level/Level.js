/**
 * Created by Alex on 06/02/14.
 */


import Deserializer from '../engine/ecs/storage/JSONDeSerializer.js';
import BinaryBufferDeSerializer from "../engine/ecs/storage/BinaryBufferDeSerializer.js";
import { EncodingBinaryBuffer } from "../core/binary/EncodingBinaryBuffer.js";


const Level = function (description, type) {
    this.type = type;
    this.description = description;
    //report
    console.log("level initialized.");
};

const pixelGridScale = 2;


/**
 *
 * @param description
 * @param {EntityManager} entityManager
 * @param {BinarySerializationRegistry} registry
 * @returns {Task}
 */
Level.build = function (description, entityManager, registry) {
    let result;

    function buildFromJSON() {
        const blueprints = Deserializer.buildBlueprints(description.blueprints, entityManager);

        const taskLoadEntities = Deserializer.loadEntitiesByBlueprints(blueprints, description.objects, entityManager);
        // taskLoadEntities.dependencies.push(tTerrain);
        result = taskLoadEntities;
    }

    function buildFromBinary() {
        const deSerializer = new BinaryBufferDeSerializer(registry);
        const binaryBuffer = new EncodingBinaryBuffer();

        binaryBuffer.fromArrayBuffer(description);

        result = deSerializer.process(binaryBuffer, entityManager);
    }

    if (description instanceof ArrayBuffer) {
        buildFromBinary();
    } else {
        buildFromJSON();
    }

    return result;
};


/**
 *
 * @param {EntityManager} entityManager
 * @param {BinarySerializationRegistry} registry
 * @returns {Task}
 */
Level.prototype.build = function (entityManager, registry) {
    this.pixelGridScale = pixelGridScale;

    const result = Level.build(this.description, entityManager, registry);

    return result;
};

Level.prototype.getSize = function () {
    const size = this.description.map.size;
    return { x: size.x * pixelGridScale, y: size.y * pixelGridScale };
};

export default Level;
