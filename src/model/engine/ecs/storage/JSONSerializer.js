/**
 * Created by Alex on 12/10/2016.
 */



function JSONSerializer() {

}

/**
 *
 * @param {EntityComponentDataset} entityDataset
 * @returns {{blueprints, objects: Array}}
 */
JSONSerializer.prototype.process = function (entityDataset) {
    console.time('serializing');

    const blueprintsHash = {};
    const objects = [];

    let blueprintCount = 0;

    function computeBlueprintHash(components, componentCount) {
        let hash = "";
        let i = 0;
        for (; i < componentCount; i++) {
            const component = components[i];
            hash += component.constructor.typeName + "#";

        }
        return hash;
    }

    function createBlueprint(components, componentCount) {
        const blueprint = {};
        const blueprintComponents = [];
        let i = 0;
        for (; i < componentCount; i++) {
            const component = components[i];
            const ComponentClass = component.constructor;
            const typeName = ComponentClass.typeName;
            if (typeName === undefined) {
                console.error("typeName is not defined for component class " + ComponentClass);
            }
            blueprintComponents.push({
                type: typeName
            });
        }
        blueprint.components = blueprintComponents;
        blueprint.id = (blueprintCount++);

        return blueprint;
    }

    function obtainBlueprint(components, componentCount) {
        const blueprintId = computeBlueprintHash(components, componentCount);

        let blueprint = blueprintsHash[blueprintId];
        if (blueprint === undefined) {
            blueprint = createBlueprint(components, componentCount, blueprintId);
            blueprintsHash[blueprintId] = blueprint;
        }
        return blueprint;
    }

    function isEmptyObject(o) {
        let result = true;
        if (typeof o === 'object') {
            for (let p in o) {
                if (o.hasOwnProperty(p)) {
                    result = false;
                    break;
                }
            }
        } else {
            result = false;
        }
        return result;
    }

    const serializableComponentTypes = entityDataset.getComponentTypeMap().filter(function (componentClass) {
        return componentClass.serializable !== false;

    });


    entityDataset.traverseEntitiesCompactedFiltered(serializableComponentTypes, function (entity, components, componentCount) {
        const blueprint = obtainBlueprint(components, componentCount);

        const objectParameters = {};
        const object = {
            blueprint: blueprint.id
        };

        let i = 0;
        for (; i < componentCount; i++) {
            const component = components[i];
            if (typeof component.toJSON !== 'function') {
                console.error("toJSON is not a function", component);
                continue;
            }
            const json = component.toJSON();
            if (!isEmptyObject(json)) {
                objectParameters[component.constructor.typeName] = json;
            }
        }
        if (!isEmptyObject(objectParameters)) {
            object.parameters = objectParameters;
        }

        objects.push(object);
    });


    //rebuild blueprints into ID based structure
    const blueprints = {};
    for (let h in blueprintsHash) {
        const blueprint = blueprintsHash[h];
        blueprints[blueprint.id] = blueprint;
        //remove id
        delete blueprint.id;
    }

    console.timeEnd('serializing');
    return {
        blueprints: blueprints,
        objects: objects
    };
};

export default JSONSerializer;