/**
 * Created by Alex on 01/04/2014.
 */


import ObservedValue from '../../core/model/ObservedValue';

/**
 *
 * @template C
 */
class System {
    constructor() {
        /**
         *
         * @type {Class<C>}
         */
        this.componentClass = null;

        /**
         *
         * @type {EntityManager}
         */
        this.entityManager = null;

        /**
         *
         * @type {ObservedValue.<System.State>}
         */
        this.state = new ObservedValue(System.State.INITIAL);

        /**
         * Other components which have to be present before the system links component
         * @type {Array}
         */
        this.dependencies = [];
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;
        readyCallback();
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        readyCallback();
    }

    reset() {
        this.removeAll();
    }

    link(component, entity) {

    }

    unlink(component, entity) {

    }

    removeAll() {
        const self = this;
        const componentClass = this.componentClass;
        this.entityManager.traverseEntities([componentClass], function (c, entity) {
            self.remove(c, entity);
        });
    }

    /**
     *
     * @param {number} timeDelta Time in seconds
     */
    update(timeDelta) {

    }
}

/**
 * @readonly
 * @enum {number}
 */
System.State = {
    INITIAL: 0,
    STARTING: 1,
    RUNNING: 2,
    STOPPING: 3,
    STOPPED: 4
};

/**
 *
 * @param {System} system
 * @returns {string}
 */
function computeSystemName(system) {
    let componentName = "$Unknown$";
    try {
        componentName = system.componentClass.typeName;
    } catch (e) {
        //just ignore
    }

    let result = componentName + "System";

    if (componentName === undefined) {
        result = system.constructor.name;
    }

    return result;
}

export { System, computeSystemName };
