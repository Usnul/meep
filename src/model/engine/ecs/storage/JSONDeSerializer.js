/**
 * Created by Alex on 12/10/2016.
 */


import Blueprint from '../Blueprint';
import { countTask, emptyTask } from '../../../core/process/task/TaskUtils';
import { assert } from "../../../core/assert.js";

/**
 *
 * @param {Object<string, Blueprint>} blueprints
 * @param {Object} descriptors
 * @param {EntityManager} entityManager
 * @returns {Task}
 */
function loadEntitiesByBlueprints(blueprints, descriptors, entityManager) {
    console.time("populateEntities");

    let task;
    if (descriptors === undefined) {
        //return NO-OP equivalent of a task
        task = emptyTask();
    } else {
        task = countTask(0, descriptors.length, function (i) {
            const descriptor = descriptors[i];

            const bluePrintName = descriptor.blueprint;

            const blueprint = blueprints[bluePrintName];

            if (blueprint === undefined) {
                console.error(`Could not build build entity, blueprint '${bluePrintName}' not found. Descriptor: `, descriptor, 'skipping...');
                return;
            }

            const entity = blueprint.buildEntity(descriptor.parameters);

            //process mixins
            const mixins = descriptor.mixins;
            if (typeof mixins === "object") {
                processMixins(entity, mixins, entityManager);
            }
        });
    }

    task.on.completed.add(function () {
        console.timeEnd("populateEntities");
    });

    return task;
}

/**
 *
 * @param descriptor
 * @param {EntityManager} entityManager
 * @returns {Blueprint}
 */
function buildBluePrint(descriptor, entityManager) {
    const blueprint = new Blueprint();
    blueprint.fromJSON(descriptor, entityManager);
    blueprint.compile();
    return blueprint;
}

/**
 *
 * @param {number} entity
 * @param {Object<string,Object>} mixins
 * @param {EntityManager} entityManager
 */
function processMixins(entity, mixins, entityManager) {
    for (let componentTypeName in mixins) {
        const ComponentClass = entityManager.getComponentClassByName(componentTypeName);

        assert.notEqual(ComponentClass, null, "Component class must not be null");
        assert.notEqual(ComponentClass, undefined, "Component class must not be undefined");
        assert.equal(typeof ComponentClass, "object", `Component class must be of type "object", instead was "${typeof ComponentClass}"`);


        const component = new ComponentClass();
        const options = mixins[componentTypeName];

        component.fromJSON(options);

        entityManager.addComponentToEntity(entity, component);
    }
}

/**
 *
 * @param descriptors
 * @param {EntityManager} entityManager
 * @returns {Object<string,Blueprint>}
 */
function buildBlueprints(descriptors, entityManager) {
    assert.notEqual(descriptors, undefined, 'descriptors are undefined');
    assert.notEqual(descriptors, null, 'descriptors are null');
    assert.typeOf(descriptors, 'object', 'descriptors');

    const result = {};

    for (let name in descriptors) {
        if (descriptors.hasOwnProperty(name)) {
            const descriptor = descriptors[name];

            let blueprint;
            try {
                blueprint = buildBluePrint(descriptor, entityManager);
            } catch (e) {
                console.error("Failed to build blueprint '" + name + "'", e);
                throw e;
            }

            result[name] = blueprint;
        }
    }

    return result;
}

function JSONDeSerializer() {

}

JSONDeSerializer.buildBluePrint = buildBluePrint;

JSONDeSerializer.buildBlueprints = buildBlueprints;

JSONDeSerializer.loadEntitiesByBlueprints = loadEntitiesByBlueprints;

/**
 *
 * @param {Object} json
 * @param {EntityManager} entityManager
 * @returns {Task}
 */
JSONDeSerializer.prototype.process = function (json, entityManager) {

    const blueprints = buildBlueprints(json.blueprints, entityManager);
    const taskLoadEntities = loadEntitiesByBlueprints(blueprints, json.objects, entityManager);

    return taskLoadEntities;
};

export default JSONDeSerializer;
