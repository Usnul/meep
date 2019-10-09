/**
 * Created by Alex on 01/04/2014.
 */

import Signal from '../../core/events/signal/Signal.js';
import { System } from './System';
import { assert } from "../../core/assert.js";
import { noop } from "../../core/function/Functions.js";
import { EntityObserver } from "./EntityObserver.js";
import { computeSystemName } from "./System.js";

/**
 *
 * @enum {string}
 * @readonly
 */
const EventType = {
    EntityRemoved: "entityRemoved",
    ComponentAdded: "componentAdded",
    ComponentRemoved: "componentRemoved"
};

/**
 * @readonly
 * @enum {number}
 */
export const EntityManagerState = {
    Initial: 0,
    Starting: 1,
    Running: 2,
    Failed: 3,
    Stopping: 4,
    Stopped: 5
};

/**
 *
 * @constructor
 */
function EntityManager() {
    /**
     *
     * @type {Array.<System>}
     */
    this.systems = [];

    /**
     *
     * @type {Array<EntityObserver>}
     */
    this.systemObservers = [];

    this.on = {
        systemStarted: new Signal(),
        systemStopped: new Signal(),
        systemAdded: new Signal(),
        systemRemoved: new Signal(),
        reset: new Signal()
    };

    /**
     *
     * @type {EntityManagerState}
     */
    this.state = EntityManagerState.Initial;

    /**
     *
     * @type {EntityComponentDataset}
     */
    this.dataset = null;

    this.handlerComponentAdded = function (entityIndex, componentIndex, componentInstance, dataset) {
        // const system = systems[componentIndex];

        // system.add(componentInstance, entityIndex, dataset);
    };

    this.handlerComponentRemoved = function (entityIndex, componentIndex, componentInstance, dataset) {
        // const system = systems[componentIndex];

        // system.remove(componentInstance, entityIndex, dataset);
    };
}

EntityManager.prototype.detachDataSet = function () {
    const dataset = this.dataset;

    if (dataset === null) {
        //no dataset attached
        return;
    }

    //remove system observers
    this.systemObservers.forEach(function (observer) {
        dataset.removeObserver(observer, true);
    });

    //clear callbacks
    dataset.callbackComponentAdded = noop;
    dataset.callbackComponentRemoved = noop;

    this.dataset = null;
};

/**
 *
 * @returns {Class[]}
 */
EntityManager.prototype.getComponentTypeMap = function () {
    return this.systems.map(function (system) {
        return system.componentClass;
    });

};

/**
 *
 * @param {EntityComponentDataset} dataset
 * @throws {Error} if another dataset is attached
 * @throws {Error} if dataset is incompatible with current system set
 */
EntityManager.prototype.attachDataSet = function (dataset) {
    //check if another dataset is attached
    if (this.dataset !== null) {
        throw new Error('Illegal status, another dataset is currently attached');
    }

    const localComponentTypeMap = this.getComponentTypeMap();

    //no entities, just write local component map
    dataset.setComponentTypeMap(localComponentTypeMap);

    this.dataset = dataset;

    //patch in callbacks
    this.dataset.callbackComponentAdded = this.handlerComponentAdded;
    this.dataset.callbackComponentRemoved = this.handlerComponentRemoved;

    this.systemObservers.forEach(function (observer) {
        dataset.addObserver(observer, true);
    });
};

/**
 * @deprecated
 * @returns {number}
 */
EntityManager.prototype.createEntity = function () {
    console.warn('EntityManager.createEntity is deprecated');

    return this.dataset.createEntity();
};

/**
 * @deprecated
 * @param id
 */
EntityManager.prototype.createEntitySpecific = function (id) {
    console.warn('EntityManager.createEntitySpecific is deprecated');
    this.dataset.createEntitySpecific(id);
};


/**
 * @deprecated
 * Remove association of specified component type from entity
 * @param {Number} entityId
 * @param {Number} componentType
 */
EntityManager.prototype.removeComponentFromEntity = function (entityId, componentType) {
    console.warn('EntityManager.removeComponentFromEntity is deprecated');

    this.dataset.removeComponentFromEntityByIndex(entityId, componentType);
};

/**
 * @deprecated use dataset directly
 * Retrieves component instance associated with entity
 * @template T
 * @param {Number} entityId
 * @param {class.<T>} componentClass
 * @returns {T|null}
 * @nosideeffects
 */
EntityManager.prototype.getComponent = function (entityId, componentClass) {
    return this.dataset.getComponent(entityId, componentClass);
};

/**
 *
 * @param {number} entityIndex
 * @returns {boolean}
 */
EntityManager.prototype.entityExists = function (entityIndex) {
    if (this.dataset === null) {
        //no dataset - no entities
        return false;
    }
    return this.dataset.entityExists(entityIndex);
};

/**
 * same as getComponent when component exists, if component is not associated with the entity, callback will be invoked once when it is added.
 * @param {Number} entityId
 * @param {Class} componentClass
 * @param {function} callback
 */
EntityManager.prototype.getComponentAsync = function (entityId, componentClass, callback) {
    const self = this;
    const component = this.getComponent(entityId, componentClass);

    function handler(options) {
        if (options.klass === componentClass) {
            self.removeEntityEventListener(entityId, EventType.ComponentAdded, handler);
            callback(options.instance);
        }
    }

    if (component === void 0 || component === null) {
        this.addEntityEventListener(entityId, EventType.ComponentAdded, handler);
    } else {
        callback(component);
    }
};

/**
 * @deprecated Use {@link EntityManager#dataset} direction
 * @param entity
 * @returns {Array}
 */
EntityManager.prototype.getComponents = function (entity) {
    console.warn('EntityManager.getComponents is deprecated');

    return this.dataset.getAllComponents(entity);
};

/**
 * @deprecated
 * Retrieves component instance associated with entity
 * @param {Number} entityId
 * @param {Number} componentType
 * @returns {*|undefined} component of specified type or undefined if it was not found
 */
EntityManager.prototype.getComponentByType = function (entityId, componentType) {
    console.warn('EntityManager.getComponentByType is deprecated');
    return this.dataset.getComponentByIndex(entityId, componentType);
};

/**
 * @deprecated
 * Efficient mapper function from classes to type identifiers
 * @param {Array.<Class>} classes
 * @returns {Array.<Number>}
 */
EntityManager.prototype.mapComponentClassesToTypes = function (classes) {
    const types = [];
    const systems = this.systems;
    const numClasses = classes.length;
    let i, j;
    const numSystems = systems.length;
    //
    let matchedClasses = 0; //counter
    //
    for (i = 0; i < numSystems; i++) {
        const componentClass = systems[i].componentClass;
        for (j = 0; j < numClasses; j++) {
            const clazz = classes[j];
            if (clazz === componentClass) {
                types[j] = i;
                if (++matchedClasses === numClasses) {
                    //all classes mapped
                    return types;
                }
            }
        }
    }
    //figure out unmatched classes
    const unmatched = [];
    for (i = 0; i < numClasses; i++) {
        if (types[i] === void 0) {
            unmatched.push(classes[i]);
        }
    }
    const unmatchedString = unmatched.map(function (klass) {
        return klass.name;
    }).join(", ");
    throw new Error("Failed to map " + (numClasses - matchedClasses) + " types: " + unmatchedString);
};

/**
 * @deprecated
 * @param classes
 * @param callback
 * @param thisArg
 * @param state
 */
EntityManager.prototype.traverseState = function (classes, callback, thisArg, state) {
    console.warn('EntityManager.traverseState is deprecated');
    //first get types from classes
    const types = this.mapComponentClassesToTypes(classes);
    if (types === void 0) {
        //not all types were found
        return;
    }
    const numClasses = classes.length;
    const cs = new Array(numClasses + 1);
    let bailFlag = false;
    const numTypes = types.length;

    function getComponent(components, klass) {
        const l = components.length;
        for (let j = 0; j < l; j++) {
            const component = components[j];
            if (component instanceof klass) {
                return component;
            }
        }
    }

    for (let entity in state) {
        if (!state.hasOwnProperty(entity)) {
            continue;
        }
        const components = state[entity];
        for (let i = 0; i < numTypes; i++) {
            const klass = classes[i];
            const component = getComponent(components, klass);
            if (component !== void 0) {
                cs[i] = component;
            } else {
                bailFlag = true;
                break;
            }
        }
        if (!bailFlag) {
            cs[numClasses] = parseInt(entity);
            const keepGoing = callback.apply(thisArg, cs);
            if (keepGoing === false) {
                return;
            }
        } else {
            //reset bail flag
            bailFlag = false;
        }
    }
};

/**
 * @deprecated
 * does traversal on a subset of entities which have only the specified components.
 * @example traverseEntitiesExact([Transform,Renderable,Tag],function(transform, renderable, tag, entity){ ... }, this);
 * @param {Array.<class>} classes
 * @param {Function} callback
 * @param {Object} [thisArg] specifies context object on which callbacks are to be called, optional
 */
EntityManager.prototype.traverseEntitiesExact = function (classes, callback, thisArg) {
    console.warn('EntityManager.traverseEntitiesExact is deprecated');
    const types = this.mapComponentClassesToTypes(classes);
    if (types === void 0) {
        //not all types were found
        return;
    }

    const otherTypes = [];

    this.systems.forEach(function (system, index) {
        if (types.indexOf(index) === -1) {
            otherTypes.push(index);
        }
    });

    const numTypes = types.length;
    const database = this.__database;

    this.traverseEntities(classes, function () {
        //entity is the argument following the components
        const entity = arguments[numTypes];

        for (let i = 0; i < otherTypes.length; i++) {
            const otherType = otherTypes[i];
            if (database[otherType][entity] !== undefined) {
                //there are other components present, ignore this entity
                return;
            }
        }

        return callback.apply(thisArg, arguments);
    }, thisArg);
};

/**
 * @deprecated
 * does traversal on a subset of entities which have specified components.
 * @example traverseEntities([Transform,Renderable,Tag],function(transform, renderable, tag, entity){ ... }, this);
 * @param {Array.<class>} classes
 * @param {Function} callback
 * @param {Object} [thisArg] specifies context object on which callbacks are to be called, optional
 */
EntityManager.prototype.traverseEntities = function (classes, callback, thisArg) {
    if (this.dataset === null) {
        //no data to traverse
        return;
    }
    this.dataset.traverseEntities(classes, callback, thisArg);
};

/**
 * @deprecated
 * @param entity
 * @param instance
 * @param componentIndex
 */
EntityManager.prototype.addComponentToEntityBySystemIdUnchecked = function (entity, instance, componentIndex) {
    console.warn('EntityManager.addComponentToEntityBySystemIdUnchecked is deprecated');

    this.dataset.addComponentToEntityByIndex(entity, componentIndex, instance);
};

/**
 * @deprecated
 * @param entity
 * @param eventName
 * @param listener
 */
EntityManager.prototype.addEntityEventListener = function (entity, eventName, listener) {
    this.dataset.addEntityEventListener(entity, eventName, listener);
};

/**
 * @deprecated
 * @param {number} entity
 * @param {string} eventName
 * @param {function} listener
 */
EntityManager.prototype.removeEntityEventListener = function (entity, eventName, listener) {
    this.dataset.removeEntityEventListener(entity, eventName, listener);
};

/**
 * @deprecated use dataset directly instead
 * @param entity
 * @param eventName
 * @param event
 */
EntityManager.prototype.sendEvent = function (entity, eventName, event) {
    this.dataset.sendEvent(entity, eventName, event);
};

/**
 * @deprecated
 * @param {Number} componentType
 * @param {function} callback
 * @param {object} [thisArg=undefined]
 */
EntityManager.prototype.traverseComponentsOfType = function (componentType, callback, thisArg) {
    if (this.dataset !== null) {
        this.dataset.traverseComponentsByIndex(componentType, callback, thisArg);
    }
};

/**
 * @deprecated
 * @param {function} klazz
 * @param {function(component: *, entity: number):boolean} callback
 * @param {*} [thisArg]
 * @deprecated
 */
EntityManager.prototype.traverseComponents = function (klazz, callback, thisArg) {
    if (this.dataset !== null) {
        this.dataset.traverseComponents(klazz, callback, thisArg);
    }
};

/**
 * @template T
 * @param {Class<T>} systemClass
 * @returns {T|null}
 */
EntityManager.prototype.getSystem = function (systemClass) {
    const systems = this.systems;
    const numSystems = systems.length;

    for (let i = 0; i < numSystems; i++) {
        const system = systems[i];

        if (system instanceof systemClass) {
            return system;
        }
    }

    //not found
    return null;
};

/**
 * @template T,C
 * @param {C} klazz
 * @returns {System|T}
 */
EntityManager.prototype.getSystemByComponentClass = function (klazz) {
    const index = this.getSystemIdByComponentClass(klazz);
    return this.systems[index];
};

/**
 *
 * @param {string} className
 * @returns {null|function}
 */
EntityManager.prototype.getComponentClassByName = function (className) {
    const systems = this.systems;
    let i = 0;
    const l = systems.length;
    for (; i < l; i++) {
        const system = systems[i];
        const componentClass = system.componentClass;
        const name = componentClass.typeName;
        if (name === className) {
            return componentClass;
        }
    }
    return null;
};

/**
 *
 * @param {function} clazz
 * @returns {number} value >= 0, representing system Id, or -1 if system was not found
 */
EntityManager.prototype.getSystemIdByComponentClass = function (clazz) {
    const systems = this.systems;
    let i = 0;
    const l = systems.length;
    for (; i < l; i++) {
        if (systems[i].componentClass === clazz) {
            return i;
        }
    }
    return -1;
};

/**
 *
 * @param {System} system
 * @param {number} timeDelta
 */
function tryUpdateSystem(system, timeDelta) {
    try {
        system.update(timeDelta);
    } catch (e) {
        console.error('Failed to update system', e);
    }
}

/**
 *
 * @param {number} timeDelta
 */
EntityManager.prototype.simulate = function (timeDelta) {
    const systems = this.systems;
    let i = 0;
    const l = systems.length;
    for (; i < l; i++) {
        const system = systems[i];
        tryUpdateSystem(system, timeDelta);
    }
};

function validateSystem(system) {
    if (system === undefined) {
        throw new Error('System is undefined');
    }

    if (system === null) {
        throw  new Error('System is null');
    }

    if (!(system instanceof System)) {
        throw new TypeError('System does not inherit from "System" class');
    }

    if (typeof system.add === 'function') {
        throw new Error(`uses deprecated 'add' method, should use 'link' instead`);
    }

    if (typeof system.remove === 'function') {
        throw new Error(`uses deprecated 'remove' method, should use 'unlink' instead`);
    }

    //validate dependencies
    const dependencies = system.dependencies;

    const numDependencies = dependencies.length;
    if (numDependencies > 0) {
        //check for duplicates
        if (dependencies.indexOf(system.componentClass) !== -1) {
            throw new Error(`declares own component class as a dependency.`);
        }

        for (let i = 0; i < numDependencies; i++) {
            const dependencyA = dependencies[i];
            for (let j = i + 1; j < numDependencies; j++) {
                if (dependencyA === dependencies[j]) {
                    throw new Error(`Detected duplicate dependency: ${dependencyA.constructor.typeName}`);
                }
            }
        }
    }

    const linkArgumentCount = numDependencies + 2;

    if (system.link !== System.prototype.link && system.link.length !== linkArgumentCount) {
        throw new Error(`'link' method declares ${system.link.length} instead of expected ${linkArgumentCount} based on it's ${numDependencies} dependencies`);
    }

    if (system.unlink !== System.prototype.unlink && system.unlink.length !== linkArgumentCount) {
        throw new Error(`'unlink' method declares ${system.unlink.length} instead of expected ${linkArgumentCount} based on it's ${numDependencies} dependencies`);
    }
}


/**
 *
 * @param {System} system
 * @return {EntityManager}
 */
EntityManager.prototype.addSystem = function (system) {
    assert.notEqual(system, undefined, "System must not be undefined");
    assert.ok(system instanceof System, `System must inherit from "System" class`);

    if (this.systems.some(s => s === system)) {
        //system already added, do nothing
        return this;
    }

    try {
        validateSystem(system);
    } catch (e) {
        console.error(`System validation failed '${computeSystemName(system)}' : `, e, system);
    }

    const systems = this.systems;
    const systemIndex = systems.length;

    systems[systemIndex] = system;


    //build observer
    const linkObserver = new EntityObserver([system.componentClass].concat(system.dependencies), system.link, system.unlink, system);
    this.systemObservers[systemIndex] = linkObserver;

    if (this.state === EntityManagerState.Running) {
        //initialize the system
        system.startup(this, noop, console.error);
    }

    if (this.dataset !== null) {
        this.dataset.setComponentTypeMap(systems.map(s => s.componentClass));

        this.dataset.addObserver(linkObserver);
    }

    this.on.systemAdded.dispatch(system);

    return this;
};

/**
 *
 * @param {System} system
 * @returns {boolean}
 */
EntityManager.prototype.removeSystem = function (system) {
    assert.notEqual(system, undefined, "System must not be undefined");
    assert.ok(system instanceof System, `System must inherit from "System" class`);


    const systemIndex = this.systems.indexOf(system);

    if (systemIndex === -1) {
        //system not found
        return false;
    }

    //check if there are any live components
    let liveComponentsExist = false;
    this.dataset.traverseComponents(system.componentClass, function (component, entity) {
        liveComponentsExist = true;
        //stop traversal
        return false;
    });

    if (liveComponentsExist) {
        throw new Error(`Can not remove ${computeSystemName(system)}, live components exist`);
    }

    //unlink system observer
    const systemObserver = this.systemObservers[systemIndex];
    this.systemObservers.splice(systemIndex, 1);

    assert.notEqual(systemObserver, undefined, 'System observer is undefined, it was possibly removed illegally or was not created');

    if (this.dataset !== null) {

        this.dataset.removeObserver(systemObserver);

        this.dataset.setComponentTypeMap(this.systems.map(s => s.componentClass));
    }

    //shutdown system
    function shutdownSuccessful() {

    }

    function shutdownFailed(reason) {
        console.error(`system ${computeSystemName(system)} shutdown failed:`, reason);
    }

    this.stopSystem(system, shutdownSuccessful, shutdownFailed);

    this.systems.splice(systemIndex, 1);

    this.on.systemRemoved.dispatch(system);
};


/**
 *
 * @param {System} system
 * @param {function(system: System)} successCallback
 * @param {function(reason:*)} errorCallback
 */
EntityManager.prototype.stopSystem = function (system, successCallback, errorCallback) {
    const self = this;

    try {
        system.state.set(System.State.STOPPING);
    } catch (e) {
        console.error(`Failed to set system state to STOPPING`, e);
        errorCallback(e);
        return;
    }

    function systemReady() {
        system.state.set(System.State.STOPPED);

        self.on.systemStopped.dispatch(system);

        successCallback(system);
    }

    function systemFailed(reason) {
        errorCallback(reason);
    }

    try {
        system.shutdown(self, systemReady, systemFailed);
    } catch (e) {
        console.error(`Failed to execute system shutdown`, e);
        errorCallback(e);
    }
};

/**
 *
 * @param {System} system
 * @param {function(system: System)} successCallback
 * @param {function(reason:*)} errorCallback
 */
EntityManager.prototype.startSystem = function (system, successCallback, errorCallback) {
    assert.equal(typeof system.state, "object", `System(${computeSystemName(system)}) state must be object, was "${typeof system.state}" instead`);
    assert.equal(typeof system.state.set, "function", `System(${computeSystemName(system)}) state doesn't have 'set' method`);

    const self = this;

    try {
        system.state.set(System.State.STARTING);
    } catch (e) {
        console.error(`Failed to set system state to STARTING`, e);
        errorCallback(e);
        return;
    }

    function systemReady() {
        system.state.set(System.State.RUNNING);

        self.on.systemStarted.dispatch(system);

        successCallback(system);
    }

    function systemFailed(reason) {
        errorCallback(reason);
    }

    try {
        system.startup(self, systemReady, systemFailed);
    } catch (e) {
        console.error(`Failed to execute system startup`, e);
        systemFailed(e);
    }
};

/**
 *
 * @param {function} readyCallback executed once entity manager successfully completes startup
 * @param {function} errorCallback executed if entity manager encounters an error during startup
 */
EntityManager.prototype.startup = function (readyCallback, errorCallback) {
    assert.equal(typeof readyCallback, "function", `readyCallback must be a function, instead was '${typeof readyCallback}'`);
    assert.equal(typeof errorCallback, "function", `errorCallback must be a function, instead was '${typeof readyCallback}'`);

    this.state = EntityManagerState.Starting;

    const self = this;
    const systems = this.systems;
    let readyCount = 0;
    const expectedReadyCount = systems.length;

    console.log(`EntityManager startup initialized, starting ${expectedReadyCount} systems.`);

    function finalizeStartup() {
        self.state = EntityManagerState.Running;

        console.log(`EntityManager startup finished, all systems started`);
        try {
            readyCallback();
        } catch (e) {
            console.error("All systems were started OK, but readyCallback failed.", e);
        }
    }

    function systemReady() {
        //startup all systems
        readyCount++;

        if (readyCount === expectedReadyCount) {
            finalizeStartup();
        }
    }

    let firstFailure = true;

    function systemError(system, error) {
        console.error("Failed to start system", system);

        if (firstFailure) {
            firstFailure = false;

            self.state = EntityManagerState.Failed;

            errorCallback(error);
        }
    }

    if (expectedReadyCount === 0) {
        //no systems registered, we're done
        finalizeStartup();
        return;
    }

    systems.forEach(function (system) {
        //ensure eventManager are there
        //start the system
        const cbOK = systemReady.bind(null, system);
        const cbError = systemError.bind(null, system);

        self.startSystem(system, cbOK, cbError);

    });
};

/**
 *
 * @param {class} componentClass
 * @returns {Promise.<System>}
 */
EntityManager.prototype.promiseSystem = function (componentClass) {
    /**
     *
     * @type {EntityManager}
     */
    const em = this;

    return new Promise(function (resolve, reject) {

        function systemAdded(s) {
            if (s.componentClass === componentClass) {
                //unregister listener
                em.on.systemAdded.remove(systemAdded);
                resolve(s);
            }
        }

        const system = em.getSystemByComponentClass(componentClass);
        if (system !== null) {
            resolve(system);
        } else {
            em.on.systemAdded.add(systemAdded);
        }
    });
};

/**
 *
 * @param {class} componentClass
 * @param {System.State} state
 * @returns {Promise.<System>}
 */
EntityManager.prototype.promiseSystemInState = function (componentClass, state) {
    const em = this;

    return new Promise(function (resolve, reject) {

        const pSystem = em.promiseSystem(componentClass);

        pSystem.then(function (system) {
            function tryProcessSystem() {
                if (system.state.get() !== state) {
                    system.state.onChanged.addOne(tryProcessSystem);
                } else {
                    resolve(system);
                }
            }

            tryProcessSystem();
        }, reject);

    });
};

/**
 *
 * @param {function} readyCallback
 * @param {function} errorCallback
 */
EntityManager.prototype.shutdown = function (readyCallback, errorCallback) {
    this.state = EntityManagerState.Stopping;

    const self = this;
    const systems = this.systems;
    let readyCount = 0;
    const expectedReadyCount = systems.length;

    function finalizeShutdown() {
        self.state = EntityManagerState.Stopped;

        try {
            readyCallback();
        } catch (e) {
            console.error("All systems were shutdown OK, but readyCallback failed.", e);
        }
    }

    function systemReady(system) {
        //startup all systems
        readyCount++;

        system.state.set(System.State.STOPPED);

        self.on.systemStopped.dispatch(system);
        if (readyCount === expectedReadyCount) {
            finalizeShutdown();
        }
    }

    let firstFailure = true;

    function systemError(system) {
        console.error("Failed to shutdown system", system);

        if (firstFailure) {
            firstFailure = false;

            self.state = EntityManagerState.Failed;

            errorCallback();
        }
    }

    if (expectedReadyCount === 0) {
        //no systems registered, we're done
        finalizeShutdown();
    }

    systems.forEach(function (system) {
        system.state.set(System.State.STOPPING);
        //start the system
        const cbOK = systemReady.bind(null, system);
        const cbError = systemError.bind(null, system);
        try {
            system.shutdown(self, cbOK, cbError);
        } catch (e) {
            //failure in shutdown function
            cbError(e);
        }
    });
};

/**
 * TODO re-work functionality
 */
EntityManager.prototype.reset = function () {
    console.warn('EntityManager.reset should no longer be used, reset dataset instead');

    this.dataset.clear();

    this.idPool.reset();

    //reset counters
    this.numComponents = 0;

    this.numEntities = 0;

    this.on.reset.dispatch();

    console.log("Entity Manager completed reset");
};

export {
    EventType,
    EntityManager
};
