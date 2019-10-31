import { BitSet } from "../../core/binary/BitSet.js";
import { assert } from "../../core/assert.js";
import Signal from "../../core/events/signal/Signal.js";
import { EventType } from "./EntityManager.js";
import { noop } from "../../core/function/Functions.js";
import { arraySetDiff } from "../../core/collection/Set.js";

/**
 *
 * @param {*} entityIndex
 * @returns {boolean}
 */
function validateEntityIndex(entityIndex) {
    return validateIndexValue(entityIndex, 'entityIndex');
}

/**
 *
 * @param {*} componentIndex
 * @returns {boolean}
 */
function validateComponentIndex(componentIndex) {
    return validateIndexValue(componentIndex, 'componentIndex');
}

/**
 *
 * @param index
 * @param {string} name
 * @returns {boolean}
 */
function validateIndexValue(index, name) {
    if (typeof index !== 'number') {
        throw new TypeError(`${name} must be a number, instead was ${typeof index}(=${index})`);
    }

    if (!Number.isInteger(index)) {
        throw new Error(`${name} must be an integer, instead was ${index}`);
    }

    if (index < 0) {
        throw new Error(`${name} must be non-negative, instead was ${index}`);
    }

    return true;
}

/**
 * Matches a supplies component mask against a larger set
 * @param {BitSet} componentOccupancy
 * @param {number} entityIndex
 * @param {number} componentTypeCount
 * @param {BitSet} mask
 * @returns {boolean} true if mask matches completely, false otherwise
 */
function matchComponentMask(componentOccupancy, entityIndex, componentTypeCount, mask) {
    const offset = entityIndex * componentTypeCount;

    let componentIndex;

    for (
        componentIndex = mask.nextSetBit(0);
        componentIndex !== -1;
        componentIndex = mask.nextSetBit(componentIndex + 1)
    ) {
        const componentPresent = componentOccupancy.get(componentIndex + offset);

        if (!componentPresent) {
            return false;
        }
    }

    return true;
}

/**
 *
 * @param entityIndex
 * @param {BitSet} mask
 * @param componentIndexMap
 * @param components
 * @param result
 */
function buildObserverCallbackArgs(entityIndex, mask, componentIndexMap, components, result) {
    for (let i = mask.nextSetBit(0); i !== -1; i = mask.nextSetBit(i + 1)) {
        const componentDataset = components[i];

        const componentInstance = componentDataset[entityIndex];

        const resultIndex = componentIndexMap[i];

        result[resultIndex] = componentInstance;
    }
}

/**
 * @class
 * @constructor
 */
function EntityComponentDataset() {
    this.entityOccupancy = new BitSet();
    this.componentOccupancy = new BitSet();

    /**
     *
     * @type {Class[]}
     */
    this.componentTypeMap = [];

    /**
     * How many component types exist for this collection. This is the same as componentMap.length
     * @type {number}
     */
    this.componentTypeCount = 0;

    this.components = [];

    this.entityCount = 0;

    this.onEntityCreated = new Signal();
    this.onEntityRemoved = new Signal();


    /**
     *
     * @type {Array}
     * @private
     */
    this.__entityEventListeners = [];

    /**
     * @private
     * @type {Array<Array<EntityObserver>>}
     */
    this.observers = [];

    /**
     *
     * @type {Function}
     */
    this.callbackComponentAdded = noop;

    /**
     *
     * @type {Function}
     */
    this.callbackComponentRemoved = noop;
}

EntityComponentDataset.prototype.isEntityComponentDataset = true;

/**
 * returns a promise of a component instance based on a given type
 * @template T, R
 * @param {int} entity
 * @param {T} componentType
 * @returns {Promise<R>}
 */
EntityComponentDataset.prototype.promiseComponent = function (entity, componentType) {

    assert.ok(this.entityExists(entity), `Entity ${entity} doesn't exist`);

    const self = this;
    return new Promise(function (resolve, reject) {
        const component = self.getComponent(entity, componentType);

        if (component !== undefined) {
            resolve(component);
            return;
        }

        function handler(event, entity) {
            const componentClass = event.klass;

            if (componentClass === componentType) {
                //found the right one

                const instance = event.instance;

                self.removeEntityEventListener(entity, EventType.ComponentAdded, handler);

                resolve(instance);
            }
        }

        function handleRemoval() {
            reject(`Entity ${entity} has been removed`);
        }

        self.addEntityEventListener(entity, EventType.ComponentAdded, handler);
        self.addEntityEventListener(entity, EventType.EntityRemoved, handleRemoval);
    });
};

/**
 *
 * @param {EntityObserver} observer
 * @param {boolean} [immediate=false] whenever pre-existing matches should be processed
 */
EntityComponentDataset.prototype.addObserver = function (observer, immediate) {
    observer.dataset = this;

    let i;

    //build the observer
    observer.build(this.componentTypeMap);

    //add to observer stores
    const componentMask = observer.componentMask;

    for (i = componentMask.nextSetBit(0); i !== -1; i = componentMask.nextSetBit(i + 1)) {
        const observerStore = this.observers[i];
        observerStore.push(observer);
    }

    if (immediate === true) {
        //process existing matches

        const componentTypeCount = this.componentTypeCount;

        const componentOccupancy = this.componentOccupancy;

        const entityOccupancy = this.entityOccupancy;

        const components = this.components;

        const componentIndexMap = observer.componentIndexMapping;

        const args = [];

        for (i = entityOccupancy.nextSetBit(0); i !== -1; i = entityOccupancy.nextSetBit(i + 1)) {
            const match = matchComponentMask(componentOccupancy, i, componentTypeCount, componentMask);

            if (match) {
                buildObserverCallbackArgs(i, componentMask, componentIndexMap, components, args);

                //write entityIndex
                args[observer.componentTypeCount] = i;

                observer.callbackComplete.apply(observer.thisArg, args);
            }
        }
    }
};

/**
 *
 * @param {EntityObserver} observer
 * @param {boolean} [immediate=false] if flag set, matches will be broken after observer is removed
 * @returns {boolean}
 */
EntityComponentDataset.prototype.removeObserver = function (observer, immediate) {
    let i;
    let foundFlag = false;

    const componentMask = observer.componentMask;

    //remove observer from stores
    for (i = componentMask.nextSetBit(0); i !== -1; i = componentMask.nextSetBit(i + 1)) {
        const observerStore = this.observers[i];
        const index = observerStore.indexOf(observer);

        if (index === -1) {
            continue;
        }

        foundFlag = true;

        observerStore.splice(index, 1);
    }

    if (foundFlag && immediate === true) {
        //process existing matches

        const componentTypeCount = this.componentTypeCount;

        const componentOccupancy = this.componentOccupancy;

        const entityOccupancy = this.entityOccupancy;

        const components = this.components;

        const componentIndexMap = observer.componentIndexMapping;

        const args = [];

        for (i = entityOccupancy.nextSetBit(0); i !== -1; i = entityOccupancy.nextSetBit(i + 1)) {
            const match = matchComponentMask(componentOccupancy, i, componentTypeCount, componentMask);

            if (match) {
                buildObserverCallbackArgs(i, componentMask, componentIndexMap, components, args);

                //write entityIndex
                args[observer.componentTypeCount] = i;

                //break the match
                observer.callbackBroken.apply(observer.thisArg, args);
            }
        }
    }

    observer.dataset = null;

    return foundFlag;
};

/**
 *
 * @returns {number}
 */
EntityComponentDataset.prototype.getEntityCount = function () {
    return this.entityCount;
};

/**
 *
 * @returns {number}
 */
EntityComponentDataset.prototype.getComponentTypeCount = function () {
    return this.componentTypeCount;
};

/**
 * Convenience method for retrieving a collection of components for a given entity
 * @param {number} entity ID of the entity
 * @param {[]} componentClasses Classes of components to extract
 * @returns {[]}
 */
EntityComponentDataset.prototype.getComponents = function (entity, componentClasses) {
    assert.ok(this.entityExists(entity), `Entity ${entity} doesn't exist`);

    assert.notEqual(componentClasses, null, 'componentClasses is null');
    assert.notEqual(componentClasses, undefined, 'componentClasses is undefined');
    assert.ok(Array.isArray(componentClasses), 'componentClasses is not an Array');
    assert.notOk(componentClasses.some((c, i) => componentClasses.indexOf(c) !== i), 'componentClasses contains duplicates');

    const resultLength = componentClasses.length;

    const result = new Array(resultLength);

    const componentTypeCount = this.componentTypeCount;
    const occupancyStart = componentTypeCount * entity;
    const occupancyEnd = occupancyStart + componentTypeCount;

    for (let i = this.componentOccupancy.nextSetBit(occupancyStart); i < occupancyEnd && i !== -1; i = this.componentOccupancy.nextSetBit(i + 1)) {
        const componentIndex = i % componentTypeCount;

        const componentType = this.componentTypeMap[componentIndex];

        const resultIndex = componentClasses.indexOf(componentType);

        if (resultIndex === -1) {
            // not requested, skip
            continue;
        }

        result[resultIndex] = this.components[componentIndex][entity];
    }

    return result;
};

/**
 * Get all components associated with a given entity
 * @returns {Array}
 * @param {number} entityIndex
 */
EntityComponentDataset.prototype.getAllComponents = function (entityIndex) {
    assert.ok(this.entityExists(entityIndex), `Entity ${entityIndex} doesn't exist`);

    const ret = [];

    const componentTypeCount = this.componentTypeCount;
    const occupancyStart = componentTypeCount * entityIndex;
    const occupancyEnd = occupancyStart + componentTypeCount;

    for (let i = this.componentOccupancy.nextSetBit(occupancyStart); i < occupancyEnd && i !== -1; i = this.componentOccupancy.nextSetBit(i + 1)) {
        const componentIndex = i % componentTypeCount;

        ret[componentIndex] = this.components[componentIndex][entityIndex];
    }

    return ret;
};


/**
 * Modify dataset component mapping. Algorithm will attempt to mutate dataset even if entities exist, however, it will not remove component classes for which instances exist in the dataset.
 * @param {Class[]} map collection of component classes
 * @throws Error when attempting to remove component classes with live instances
 */
EntityComponentDataset.prototype.setComponentTypeMap = function (map) {
    assert.notEqual(map, undefined, 'map was undefined');

    const newComponentTypeCount = map.length;

    const diff = arraySetDiff(map, this.componentTypeMap);

    const typesToAdd = diff.uniqueA;
    const typesToRemove = diff.uniqueB;

    const typesCommon = diff.common;

    const self = this;

    function existingComponentsRemovalCheck() {
        const presentComponentTypes = [];

        for (let i = 0; i < typesToRemove.length; i++) {
            const type = typesToRemove[i];

            self.traverseComponents(type, function () {
                presentComponentTypes.push(type);
                //stop traversal
                return false;
            });
        }

        if (presentComponentTypes.length > 0) {
            const sTypes = presentComponentTypes.map(t => t.typeName).join(', ');
            throw  new Error(`Component types can not be unmapped due to presence of live components: ${sTypes}`);
        }
    }

    function computeComponentIndexRemapping() {
        const indexRemapping = [];

        let i;
        let l;

        for (i = 0, l = typesCommon.length; i < l; i++) {
            const commonType = typesCommon[i];

            //get old index
            const indexOld = self.componentTypeMap.indexOf(commonType);

            const indexNew = map.indexOf(commonType);

            indexRemapping[indexOld] = indexNew;
        }

        return indexRemapping;
    }

    function updateComponentOccupancy(indexRemapping) {

        //build new component occupancy map
        const newComponentOccupancy = new BitSet();

        let i;

        const oldComponentTypeCount = self.componentTypeCount;

        for (i = self.componentOccupancy.nextSetBit(0); i !== -1; i = self.componentOccupancy.nextSetBit(i + 1)) {
            //determine component index
            const oldComponentIndex = i % oldComponentTypeCount;


            const newComponentIndex = indexRemapping[oldComponentIndex];

            if (newComponentIndex !== undefined) {
                const entity = Math.floor(i / oldComponentTypeCount);

                newComponentOccupancy.set(entity * newComponentTypeCount + newComponentIndex, true);
            }
        }

        self.componentOccupancy = newComponentOccupancy;
    }

    function updateComponentStores(indexRemapping) {
        let i;
        let l;

        const newStore = [];

        for (i = 0, l = typesToAdd.length; i < l; i++) {
            const type = typesToAdd[i];

            const newIndex = map.indexOf(type);

            //initialize component store
            newStore[newIndex] = [];
        }

        for (i = 0, l = indexRemapping.length; i < l; i++) {
            const newIndex = indexRemapping[i];

            if (newIndex === undefined) {
                continue;
            }

            newStore[newIndex] = self.components[i];
        }

        self.components = newStore;
    }

    function updateObservers(indexRemapping) {
        let i;
        let l;

        const newStore = [];

        for (i = 0, l = typesToAdd.length; i < l; i++) {
            const type = typesToAdd[i];

            const newIndex = map.indexOf(type);

            //initialize component store
            newStore[newIndex] = [];
        }


        for (i = 0, l = indexRemapping.length; i < l; i++) {
            const newIndex = indexRemapping[i];

            if (newIndex === undefined) {
                continue;
            }

            const observers = self.observers[i];

            //rebuild observers
            observers.forEach(function (observer) {
                observer.build(map);
            });

            newStore[newIndex] = observers;
        }


        self.observers = newStore;
    }

    //make sure that no components exist of type scheduled for removal
    existingComponentsRemovalCheck();

    const indexRemapping = computeComponentIndexRemapping();

    updateComponentOccupancy(indexRemapping);

    updateComponentStores(indexRemapping);

    updateObservers(indexRemapping);

    this.componentTypeMap = map;
    this.componentTypeCount = newComponentTypeCount;
};

/**
 *
 * @returns {Class[]}
 */
EntityComponentDataset.prototype.getComponentTypeMap = function () {
    return this.componentTypeMap;
};

/**
 *
 * @returns {number} entityIndex
 */
EntityComponentDataset.prototype.createEntity = function () {
    const entityIndex = this.entityOccupancy.nextClearBit(0);
    this.entityOccupancy.set(entityIndex, true);

    this.entityCount++;

    this.onEntityCreated.dispatch(entityIndex);

    return entityIndex;
};

/**
 *
 * @param {number} entityIndex
 * @throws {Error} if entity index is already in use
 */
EntityComponentDataset.prototype.createEntitySpecific = function (entityIndex) {
    if (this.entityExists(entityIndex)) {
        throw new Error(`EntityId ${entityIndex} is already in use`);
    }

    this.entityOccupancy.set(entityIndex, true);

    this.entityCount++;

    this.onEntityCreated.dispatch(entityIndex);
};

/**
 *
 * @param {number} entityIndex
 * @returns {boolean}
 */
EntityComponentDataset.prototype.entityExists = function (entityIndex) {
    assert.ok(validateEntityIndex(entityIndex));

    return this.entityOccupancy.get(entityIndex);
};

/**
 *
 * @param {number} componentIndex
 * @returns {boolean}
 */
EntityComponentDataset.prototype.componentIndexExists = function (componentIndex) {
    assert.ok(validateComponentIndex(componentIndex));

    return componentIndex >= 0 && componentIndex < this.componentTypeCount;
};

/**
 *
 * @param {number} entityIndex
 */
EntityComponentDataset.prototype.removeEntity = function (entityIndex) {
    assert.ok(this.entityExists(entityIndex), `entity ${entityIndex} does not exist`);

    const componentOccupancy = this.componentOccupancy;
    const typeCount = this.componentTypeCount;

    const occupancyStart = entityIndex * typeCount;
    const occupancyEnd = occupancyStart + typeCount;

    for (let i = componentOccupancy.nextSetBit(occupancyStart); i < occupancyEnd && i !== -1; i = componentOccupancy.nextSetBit(i + 1)) {
        const componentIndex = i % typeCount;
        this.removeComponentFromEntityByIndex_Unchecked(entityIndex, componentIndex, i);
    }

    //dispatch event
    this.sendEvent(entityIndex, EventType.EntityRemoved, entityIndex);

    //purge all event listeners
    delete this.__entityEventListeners[entityIndex];

    this.entityOccupancy.set(entityIndex, false);

    this.entityCount--;

    this.onEntityRemoved.dispatch(entityIndex);
};


/**
 * Convenience method for removal of multiple entities
 * @param {number[]} entityIndices
 */
EntityComponentDataset.prototype.removeEntities = function (entityIndices) {
    const length = entityIndices.length;
    for (let i = 0; i < length; i++) {
        const entityIndex = entityIndices[i];
        this.removeEntity(entityIndex);
    }
};

/**
 *
 * @param {number} entityIndex
 * @param {class} klass
 */
EntityComponentDataset.prototype.removeComponentFromEntity = function (entityIndex, klass) {
    const componentTypeIndex = this.componentTypeMap.indexOf(klass);

    if (componentTypeIndex === -1) {
        throw new Error(`Component class not found in this dataset`);
    }

    this.removeComponentFromEntityByIndex(entityIndex, componentTypeIndex);
};

/**
 *
 * @param {number} entityIndex
 * @param {number} componentIndex
 */
EntityComponentDataset.prototype.removeComponentFromEntityByIndex = function (entityIndex, componentIndex) {
    assert.ok(this.entityExists(entityIndex), `entity ${entityIndex} does not exist`);
    assert.ok(this.componentIndexExists(componentIndex), `componentIndex ${componentIndex} is out of bounds`);

    //check if component exists
    const componentOccupancyIndex = entityIndex * this.componentTypeCount + componentIndex;
    const exists = this.componentOccupancy.get(componentOccupancyIndex);

    if (!exists) {
        //nothing to remove
        console.warn(`Entity ${entityIndex} does't have a component with index ${componentIndex}`);
        return;
    }

    this.removeComponentFromEntityByIndex_Unchecked(entityIndex, componentIndex, componentOccupancyIndex);
};


/**
 * @private
 * @param {number} entityIndex
 * @param {number} componentIndex
 * @param {number} componentOccupancyIndex
 */
EntityComponentDataset.prototype.removeComponentFromEntityByIndex_Unchecked = function (entityIndex, componentIndex, componentOccupancyIndex) {
    this.processObservers_ComponentRemoved(entityIndex, componentIndex);

    const componentInstance = this.components[componentIndex][entityIndex];

    //remove component from record
    delete this.components[componentIndex][entityIndex];

    //clear occupancy bit
    this.componentOccupancy.clear(componentOccupancyIndex);

    //execute registered callback
    this.callbackComponentRemoved(entityIndex, componentIndex, componentInstance, this);

    //dispatch events
    const componentClass = this.componentTypeMap[componentIndex];

    //dispatch event to components
    this.sendEvent(entityIndex, EventType.ComponentRemoved, { klass: componentClass, instance: componentInstance });
};

/**
 *
 * @param klass
 * @returns {number}
 */
EntityComponentDataset.prototype.computeComponentTypeIndex = function (klass) {
    return this.componentTypeMap.indexOf(klass);
};

/**
 * @template {T}
 * @param {T} klass
 * @returns {number}
 */
EntityComponentDataset.prototype.computeComponentCount = function (klass) {
    let result = 0;

    this.traverseComponents(klass, function () {
        result++;
    });

    return result;
};

function stringifyComponent(c) {
    if (typeof c === "object") {
        return c.constructor.toString();
    } else {
        return c;
    }
}

/**
 *
 * Associate a component with a particular entity
 * @template C
 * @param {number} entityIndex
 * @param {C} componentInstance
 */
EntityComponentDataset.prototype.addComponentToEntity = function (entityIndex, componentInstance) {
    assert.notEqual(componentInstance, null, 'componentInstance is null');
    assert.notEqual(componentInstance, undefined, 'componentInstance is undefined');

    const klass = componentInstance.constructor;

    const componentTypeIndex = this.componentTypeMap.indexOf(klass);

    if (componentTypeIndex === -1) {


        throw new Error(`Component class not found in this dataset for componentInstance ${stringifyComponent(componentInstance)}`);
    }

    this.addComponentToEntityByIndex(entityIndex, componentTypeIndex, componentInstance);
};

/**
 * @template C
 * @param {number} entityIndex
 * @param {number} componentIndex
 * @param {C} componentInstance
 */
EntityComponentDataset.prototype.addComponentToEntityByIndex = function (entityIndex, componentIndex, componentInstance) {
    assert.ok(this.entityExists(entityIndex), `entity ${entityIndex} does not exist`);
    assert.ok(this.componentIndexExists(componentIndex), `componentIndex ${componentIndex} is out of bounds`);

    assert.notEqual(componentInstance, undefined, 'componentInstance is undefined');

    const componentOccupancyIndex = entityIndex * this.componentTypeCount + componentIndex;

    //record component occupancy
    this.componentOccupancy.set(componentOccupancyIndex, true);

    //inset component instance into component dataset
    this.components[componentIndex][entityIndex] = componentInstance;

    //Execute registered callback
    this.callbackComponentAdded(entityIndex, componentIndex, componentInstance, this);

    //process observers
    this.processObservers_ComponentAdded(entityIndex, componentIndex);

    //dispatch events
    const componentClass = this.componentTypeMap[componentIndex];

    //dispatch event to components
    this.sendEvent(entityIndex, EventType.ComponentAdded, { klass: componentClass, instance: componentInstance });
};

/**
 * @template C
 * @param {number} entityIndex
 * @param {number} componentIndex
 * @returns {C|undefined}
 */
EntityComponentDataset.prototype.getComponentByIndex = function (entityIndex, componentIndex) {
    assert.ok(this.entityExists(entityIndex), `entity ${entityIndex} does not exist`);
    assert.ok(this.componentIndexExists(componentIndex), `componentIndex ${componentIndex} is out of bounds`);

    return this.components[componentIndex][entityIndex];
};

/**
 * @template C
 * @param {number} entityIndex
 * @param {Class<C>} klass
 * @returns {C|undefined}
 */
EntityComponentDataset.prototype.getComponent = function (entityIndex, klass) {
    assert.ok(this.entityExists(entityIndex), `entity ${entityIndex} does not exist`);
    assert.notEqual(klass, undefined, 'klass is undefined');

    const componentIndex = this.computeComponentTypeIndex(klass);

    if (componentIndex === -1) {
        throw  new Error(`Component class not registered in this dataset`);
    }

    return this.getComponentByIndex(entityIndex, componentIndex);
};

/**
 *
 * @param {Array} classes
 * @param {function:boolean?} visitor Visitor can return optional "false" to terminate traversal earlier
 * @param {object} [thisArg]
 */
EntityComponentDataset.prototype.traverseEntities = function (classes, visitor, thisArg) {
    assert.ok(Array.isArray(classes), `classes parameter must be an Array, instead was something else`);
    assert.notOk(classes.some((c, i) => classes.indexOf(c) !== i), 'classes contains duplicates');
    assert.equal(typeof visitor, 'function', `visitor must be a function, instead was '${typeof visitor}'`);

    let entityIndex, i;

    //map classes to indices
    const indices = [];

    const numClasses = classes.length;
    for (i = 0; i < numClasses; i++) {
        const k = classes[i];

        const componentIndex = this.computeComponentTypeIndex(k);

        if (componentIndex === -1) {
            throw new Error(`Component (index=${i}) not found in the dataset`);
        }

        indices[i] = componentIndex;
    }

    const args = [];

    entity_loop: for (entityIndex = this.entityOccupancy.nextSetBit(0); entityIndex !== -1; entityIndex = this.entityOccupancy.nextSetBit(entityIndex + 1)) {
        const componentOccupancyAddress = entityIndex * this.componentTypeCount;
        for (i = 0; i < numClasses; i++) {
            const componentIndex = indices[i];

            const componentPresent = this.componentOccupancy.get(componentOccupancyAddress + componentIndex);

            if (!componentPresent) {
                continue entity_loop;
            }

            args[i] = this.components[componentIndex][entityIndex];
        }

        args[numClasses] = entityIndex;

        const keepGoing = visitor.apply(thisArg, args);

        if (keepGoing === false) {
            //stop traversal
            return;
        }
    }
};

/**
 * does traversal on a subset of entities which have only the specified components.
 * @example traverseEntitiesExact([Transform,Renderable,Tag],function(transform, renderable, tag, entity){ ... }, this);
 * @param {Array.<class>} classes
 * @param {Function} visitor
 * @param {Object} [thisArg] specifies context object on which callbacks are to be called, optional
 */
EntityComponentDataset.prototype.traverseEntitiesExact = function (classes, visitor, thisArg) {
    let entityIndex, i;

    //map classes to indices
    const indices = [];

    const numClasses = classes.length;
    for (i = 0; i < numClasses; i++) {
        const k = classes[i];

        const componentIndex = this.computeComponentTypeIndex(k);

        indices[i] = componentIndex;
    }

    const args = [];

    entity_loop: for (entityIndex = this.entityOccupancy.nextSetBit(0); entityIndex !== -1; entityIndex = this.entityOccupancy.nextSetBit(entityIndex + 1)) {
        const componentOccupancyAddress = entityIndex * this.componentTypeCount;
        const componentOccupancyEnd = componentOccupancyAddress + this.componentTypeCount;

        let matched = 0;

        for (
            i = this.componentOccupancy.nextSetBit(componentOccupancyAddress);
            i < componentOccupancyEnd && i !== -1;
            i = this.componentOccupancy.nextSetBit(i + 1)
        ) {
            const componentIndex = i - componentOccupancyAddress;

            const componentPosition = indices.indexOf(componentIndex);

            if (componentPosition === -1) {
                //undesirable component present (Extra)
                continue entity_loop;
            }

            matched++;

            args[componentPosition] = this.components[componentIndex][entityIndex];
        }

        if (matched !== numClasses) {
            //Not all components were present
            continue;
        }

        args[numClasses] = entityIndex;

        const keepGoing = visitor.apply(thisArg, args);

        if (keepGoing === false) {
            //stop traversal
            return;
        }
    }
};

/**
 * @template T
 * @param {Class<T>} klass
 * @param {function(instance:T, entity:number)} visitor
 * @param {*} [thisArg=undefined]
 */
EntityComponentDataset.prototype.traverseComponents = function (klass, visitor, thisArg) {
    const componentTypeIndex = this.computeComponentTypeIndex(klass);

    if (componentTypeIndex === -1) {
        throw new Error(`Component class is not registered in this dataset`);
    }

    this.traverseComponentsByIndex(componentTypeIndex, visitor, thisArg);
};

/**
 *
 * @param {number} componentTypeIndex
 * @param {function} visitor
 * @param {*} [thisArg]
 */
EntityComponentDataset.prototype.traverseComponentsByIndex = function (componentTypeIndex, visitor, thisArg) {
    assert.equal(typeof componentTypeIndex, 'number', `componentTypeIndex must be a number, instead was '${typeof componentTypeIndex}'`);
    assert.equal(typeof visitor, 'function', `visitor must be a function, instead was '${typeof visitor}'`);

    const componentDataset = this.components[componentTypeIndex];
    const componentTypeCount = this.componentTypeCount;

    const entityOccupancy = this.entityOccupancy;
    const componentOccupancy = this.componentOccupancy;

    for (let entityIndex = entityOccupancy.nextSetBit(0); entityIndex !== -1; entityIndex = entityOccupancy.nextSetBit(entityIndex + 1)) {

        const componentOccupancyIndex = entityIndex * componentTypeCount + componentTypeIndex;

        if (componentOccupancy.get(componentOccupancyIndex)) {

            const componentInstance = componentDataset[entityIndex];

            const continueFlag = visitor.call(thisArg, componentInstance, entityIndex);

            if (continueFlag === false) {
                //stop traversal
                return;
            }

        }
    }
};


/**
 * @private
 * @param {number} entityIndex
 * @param {number} componentIndex
 */
EntityComponentDataset.prototype.processObservers_ComponentAdded = function (entityIndex, componentIndex) {
    const observers = this.observers;

    const observersStore = observers[componentIndex];

    const numObservers = observersStore.length;

    let i;

    const args = [];

    for (i = 0; i < numObservers; i++) {
        const observer = observersStore[i];

        const match = matchComponentMask(this.componentOccupancy, entityIndex, this.componentTypeCount, observer.componentMask);

        if (match) {
            //match completing addition
            buildObserverCallbackArgs(entityIndex, observer.componentMask, observer.componentIndexMapping, this.components, args);

            //write entityId argument
            args[observer.componentTypeCount] = entityIndex;

            //invoke callback
            observer.callbackComplete.apply(observer.thisArg, args);
        }
    }
};

/**
 * @private
 * @param {number} entityIndex
 * @param {number} componentIndex
 */
EntityComponentDataset.prototype.processObservers_ComponentRemoved = function (entityIndex, componentIndex) {
    const observers = this.observers;

    const observersStore = observers[componentIndex];

    const numObservers = observersStore.length;

    let i;

    const args = [];

    for (i = 0; i < numObservers; i++) {
        const observer = observersStore[i];

        const match = matchComponentMask(this.componentOccupancy, entityIndex, this.componentTypeCount, observer.componentMask);

        if (match) {
            //match breaking removal
            buildObserverCallbackArgs(entityIndex, observer.componentMask, observer.componentIndexMapping, this.components, args);

            //write entityId argument
            args[observer.componentTypeCount] = entityIndex;

            //invoke callback
            observer.callbackBroken.apply(observer.thisArg, args);
        }
    }
};

/**
 * Registers an event listener to a specific entity and event type, specified by eventName string.
 * @param {number} entity
 * @param {string} eventName
 * @param {function} listener
 */
EntityComponentDataset.prototype.addEntityEventListener = function (entity, eventName, listener) {
    assert.typeOf(eventName, 'string', 'eventName');
    assert.typeOf(listener, 'function', 'listener');

    if (!this.entityExists(entity)) {
        throw new Error(`Entity '${entity}' does not exist`);
    }

    const evl = this.__entityEventListeners;

    let hash = evl[entity];

    if (hash === void 0) {
        hash = {};
        evl[entity] = hash;
    }

    let listeners = hash[eventName];

    if (listeners === void 0) {
        listeners = [];
        hash[eventName] = listeners;
    } else if (listeners.indexOf(listener) >= 0) {
        //listener is already in place
        return;
    }

    listeners.push(listener);
};


/**
 * Remove existing event listener associated with a specific entity. Does nothing if listener isn't registered.
 * @param {number} entity
 * @param {string} eventName
 * @param {callback} listener
 */
EntityComponentDataset.prototype.removeEntityEventListener = function (entity, eventName, listener) {
    const evl = this.__entityEventListeners;

    const hash = evl[entity];

    if (hash === void 0) {
        //no event listeners exist for this entity
        return;
    }

    const listeners = hash[eventName];

    if (listeners === void 0) {
        //no event listeners exist for this event
        return;
    }

    const indexOf = listeners.indexOf(listener);

    if (indexOf < 0) {
        //listener was not found
        return;
    }

    //remove the listener
    listeners.splice(indexOf, 1);
};


/**
 *
 * @param {Array.<Object.<string,Array.<function>>>} evl
 * @param {number} entity
 * @param {string} name
 * @param {*} event
 */
function dispatchEntityEventListeners(evl, entity, name, event) {
    const hash = evl[entity];
    if (hash === void 0) {
        return;
    }
    dispatchEventListenersByHash(hash, entity, name, event);
}

const entityListenersProxy = [];

/**
 *
 * @param {Object.<string, Array.<function>>} hash
 * @param {number} entity
 * @param {string} name
 * @param {*} event
 */
function dispatchEventListenersByHash(hash, entity, name, event) {
    const listeners = hash[name];

    if (listeners === void 0) {
        return;
    }

    const numListeners = listeners.length;

    if (numListeners === 0) {
        //no listeners, nothing to do
        return;
    }

    let i;

    //copy listeners to prevent possible modification errors
    for (i = 0; i < numListeners; i++) {
        entityListenersProxy[i] = listeners[i];
    }

    //invoke handlers
    for (let i = 0; i < numListeners; i++) {
        const handler = entityListenersProxy[i];

        handler(event, entity);
    }

    //reset proxy
    entityListenersProxy.length = 0;
}

/**
 * Notifies every component of specified entity with given event
 * @param {Number} entity
 * @param {String} name event name
 * @param {Object} [event=undefined]
 */
EntityComponentDataset.prototype.sendEvent = function (entity, name, event) {
    // console.log("sendEvent", entity, name, event);

    dispatchEntityEventListeners(this.__entityEventListeners, entity, name, event);
};

/**
 *
 * @param {number} entityIndex
 * @returns {boolean}
 */
EntityComponentDataset.prototype.isEntityUsed = function (entityIndex) {
    return this.getAllComponents(entityIndex).some(function (component) {
        return component !== void 0;
    });
};

/**
 * Remove all entities, triggers all relevant removal events for each entity/component
 */
EntityComponentDataset.prototype.clear = function () {
    const entityOccupancy = this.entityOccupancy;

    for (let i = entityOccupancy.nextSetBit(0); i !== -1; i = entityOccupancy.nextSetBit(i + 1)) {
        this.removeEntity(i);
    }
};

/**
 * Drops all data, bypassing standard workflow, no events are dispatched. Data is simply ejected.
 * This method is very efficient but is intended to be used only when associated data is no needed as it may produce unintended consequences if the data is re-used
 */
EntityComponentDataset.prototype.dropData = function () {
    //drop components
    for (let i = 0; i < this.componentTypeCount; i++) {
        this.components[i] = [];
    }

    this.componentOccupancy.reset();
    this.entityOccupancy.reset();

    this.entityCount = 0;

    this.__entityEventListeners = [];
};

/**
 *
 * @param {string} className
 * @returns {null|function}
 */
EntityComponentDataset.prototype.getComponentClassByName = function (className) {
    let i = 0;
    for (; i < this.componentTypeCount; i++) {
        const componentClass = this.componentTypeMap[i];
        const name = componentClass.typeName;
        if (name === className) {
            return componentClass;
        }
    }
    return null;
};

/**
 *
 * @param {Array} componentClasses
 * @param {EntityComponentDataset} source
 */
EntityComponentDataset.prototype.maskedCopy = function (source, componentClasses) {

    let i;

    const componentCount = componentClasses.length;

    const sourceComponentIndices = [];
    const thisComponentIndices = [];

    for (i = 0; i < componentCount; i++) {
        const componentClass = componentClasses[i];

        const sourceComponentIndex = source.computeComponentTypeIndex(componentClass);

        if (sourceComponentIndex === -1) {
            //source doesn't have this class, this just means there's nothing to copy. skip
            continue;
        }

        const thisComponentIndex = this.computeComponentTypeIndex(componentClass);

        if (thisComponentIndex === -1) {
            //this dataset doesn't have component class registered
            throw new Error(`This dataset does not have component class registered`);
        }

        sourceComponentIndices.push(sourceComponentIndex);
        thisComponentIndices.push(thisComponentIndex);
    }

    const copyingComponentClassCount = sourceComponentIndices.length;

    const sourceEntityOccupancy = source.entityOccupancy;
    const sourceComponentOccupancy = source.componentOccupancy;
    const sourceComponentTypeCount = source.componentTypeCount;

    let entityIndex;

    for (entityIndex = sourceEntityOccupancy.nextSetBit(0); entityIndex !== -1; entityIndex = sourceEntityOccupancy.nextSetBit(entityIndex + 1)) {

        this.createEntitySpecific(entityIndex);

        for (i = 0; i < copyingComponentClassCount; i++) {

            const sourceComponentIndex = sourceComponentIndices[i];

            const componentExists = sourceComponentOccupancy.get(sourceComponentTypeCount * entityIndex + sourceComponentIndex);

            if (componentExists) {

                const thisComponentIndex = thisComponentIndices[i];

                const componentInstance = source.getComponentByIndex(entityIndex, sourceComponentIndex);

                this.addComponentToEntityByIndex(entityIndex, thisComponentIndex, componentInstance);

            }
        }
    }
};

/**
 * Main utility of this method is to facilitate serialization.
 * @param {Array} componentClasses
 * @param {function} visitor
 */
EntityComponentDataset.prototype.traverseEntitiesCompactedFiltered = function (componentClasses, visitor) {

    const inputClassCount = componentClasses.length;

    const componentIndices = new Array(inputClassCount);

    //map component classes to indices

    let i, j;

    for (i = 0; i < inputClassCount; i++) {
        const componentClass = componentClasses[i];
        const componentIndex = this.computeComponentTypeIndex(componentClass);
        componentIndices[i] = componentIndex;
    }

    //sort component indices array for faster traversal
    componentIndices.sort();

    const entityOccupancy = this.entityOccupancy;
    const componentOccupancy = this.componentOccupancy;

    const componentTypeCount = this.componentTypeCount;

    const components = [];
    let componentCount;

    for (i = entityOccupancy.nextSetBit(0); i !== -1; i = entityOccupancy.nextSetBit(i + 1)) {

        const entityOccupancyAddress = i * componentTypeCount;

        componentCount = 0;

        for (j = 0; j < inputClassCount; j++) {

            const componentIndex = componentIndices[j];
            if (componentOccupancy.get(entityOccupancyAddress + componentIndex)) {
                //component exists
                const componentInstance = this.components[componentIndex][i];

                components[componentCount] = componentInstance;

                componentCount++;
            }

        }

        visitor(i, components, componentCount);
    }
};

/**
 * Tells whether or not dataset has any entities
 * @returns {boolean}
 */
EntityComponentDataset.prototype.isEmpty = function () {
    return this.entityCount === 0;
};

/**
 *
 * @param {function(entityIndex:number)} visitor
 */
EntityComponentDataset.prototype.traverseEntityIndices = function (visitor) {
    let entityIndex;

    const occupancy = this.entityOccupancy;

    for (entityIndex = occupancy.nextSetBit(0); entityIndex !== -1; entityIndex = occupancy.nextSetBit(entityIndex + 1)) {
        visitor(entityIndex);
    }
};

export { EntityComponentDataset };
