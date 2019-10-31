import { emptyTask } from "../../../core/process/task/TaskUtils.js";
import Task from "../../../core/process/task/Task.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import { assert } from "../../../core/assert.js";
import { BinaryCollectionDeSerializer } from "./binary/collection/BinaryCollectionDeSerializer.js";

/**
 *
 * @param {BinarySerializationRegistry} registry
 * @constructor
 */
function BinaryBufferDeSerializer(registry) {
    assert.notEqual(registry, undefined, 'registry is undefined');

    /**
     *
     * @type {BinarySerializationRegistry}
     */
    this.registry = registry;
}

/**
 *
 * @param {number} numSerializedTypes
 * @param {BinaryBuffer} buffer
 * @param {EntityManager} entityManager
 * @param {EntityComponentDataset} dataset
 * @param {BinarySerializationRegistry} registry
 * @returns {Task}
 */
function deserializeTask(numSerializedTypes, buffer, entityManager, dataset, registry) {

    let typesDecoded = 0;

    let typesLeft = numSerializedTypes;
    let componentIndex = 0;

    const collectionDeSerializer = new BinaryCollectionDeSerializer();

    collectionDeSerializer.setBuffer(buffer);
    collectionDeSerializer.setRegistry(registry);

    let entity = 0;

    function cycleFunction() {
        while (collectionDeSerializer.getElementIndex() >= collectionDeSerializer.getElementCount()) {

            //finished current type
            if (typesLeft === 0) {
                return TaskSignal.EndSuccess;
            }

            if (typesDecoded > 0) {
                console.log(`Started deserializer for ${collectionDeSerializer.adapter.getClass().typeName} : ${collectionDeSerializer.getElementIndex()} / ${collectionDeSerializer.getElementCount()}`);
                collectionDeSerializer.finalize();
            }

            typesDecoded++;

            //start next type
            typesLeft--;

            collectionDeSerializer.initialize({
                /**
                 *
                 * @param {string} className
                 * @param {Class} klass
                 * @param {BinaryClassSerializationAdapter} adapter
                 */
                adapterOptionsSupplier(className, klass, adapter) {
                    const system = entityManager.getSystemByComponentClass(klass);

                    return [system];
                }
            });

            componentIndex = entityManager.getSystemIdByComponentClass(collectionDeSerializer.getElementClass());

            //reset last entity
            entity = 0;
        }

        const record = collectionDeSerializer.read();

        entity += record.key;


        if (!dataset.entityExists(entity)) {
            dataset.createEntitySpecific(entity);
        }

        const componentInstance = record.value;

        dataset.addComponentToEntityByIndex(entity, componentIndex, componentInstance);

        return TaskSignal.Continue;
    }

    function computeProgress() {
        if (typesLeft === numSerializedTypes) {
            return 0;
        }

        let componentProgress;

        if (collectionDeSerializer.getElementCount() === 0) {
            componentProgress = 1;
        } else {
            componentProgress = collectionDeSerializer.getElementIndex() / collectionDeSerializer.getElementCount();
        }

        assert.ok(componentProgress >= 0 && componentProgress <= 1, `Expected componentProgress to be between 0 and 1, instead was '${componentProgress}'`);


        let coarseProgress;

        const tl = typesLeft + 1;

        if (numSerializedTypes === 0) {
            coarseProgress = 0;
        } else {
            coarseProgress = 1 - (tl / numSerializedTypes);
        }

        assert.ok(coarseProgress >= 0 && coarseProgress <= 1, `Expected coarseProgress to be between 0 and 1, instead was '${coarseProgress}'`);

        const result = coarseProgress + componentProgress / numSerializedTypes;

        assert.ok(result >= 0 && result <= 1, `Expected result to be between 0 and 1, instead was '${result}'`);

        return result;
    }

    const estimatedDuration = buffer.length / 100;

    return new Task({
        name: 'Entity deserialization',
        cycleFunction,
        computeProgress,
        estimatedDuration
    });
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {EntityManager} entityManager
 * @param {EntityComponentDataset} dataset
 * @returns {Task}
 */
BinaryBufferDeSerializer.prototype.process = function (buffer, entityManager, dataset) {
    assert.notEqual(buffer, undefined, 'buffer is undefined');
    assert.notEqual(entityManager, undefined, 'entityManager is undefined');
    assert.notEqual(dataset, undefined, 'dataset is undefined');

    const numSerializedTypes = buffer.readUint32();

    let task;
    if (numSerializedTypes === 0) {
        //return NO-OP equivalent of a task
        task = emptyTask();
    } else {
        task = deserializeTask(numSerializedTypes, buffer, entityManager, dataset, this.registry);
    }

    task.on.completed.add(function () {
        console.log(`Binary Buffer De-Serialization took ${task.getExecutedCpuTime()}ms`);
    });

    return task;
};

export default BinaryBufferDeSerializer;
