import Signal from "../../core/events/signal/Signal.js";
import { assert } from "../../core/assert.js";

/**
 *
 * @enum
 */
export const EntityBuilderFlags = {
    Built: 1
};

/**
 *
 * @constructor
 * @property {Number} entity
 * @property {Array.<object>} element components
 */
const EntityBuilder = function () {
    this.entity = void 0;
    this.element = [];
    this.deferredListeners = [];

    /**
     *
     * @type {EntityComponentDataset}
     */
    this.dataset = null;

    this.flags = 0;

    /**
     *
     * @type {Object}
     */
    this.properties = {};

    this.on = {
        built: new Signal()
    };

};

/**
 *
 * @param {number|EntityBuilderFlags} value
 */
EntityBuilder.prototype.setFlag = function (value) {
    this.flags |= value;
};


/**
 *
 * @param {number|EntityBuilderFlags} flag
 * @returns {boolean}
 */
EntityBuilder.prototype.getFlag = function (flag) {
    return (this.flags & flag) !== 0;
};

/**
 *
 * @param {number|EntityBuilderFlags} flag
 */
EntityBuilder.prototype.clearFlag = function (flag) {
    this.flags &= ~flag;
};

/**
 * @template T
 * @param {T} componentInstance
 * @returns {EntityBuilder}
 */
EntityBuilder.prototype.add = function (componentInstance) {
    if (componentInstance === undefined) {
        throw new Error("Can not add " + componentInstance + " to EntityBuilder");
    }

    assert.notOk(this.element.some(c => c.__proto__ === componentInstance.__proto__), `Component of this type already exists`);

    this.element.push(componentInstance);
    if (this.entity !== void 0) {
        //already built, add component to entity
        this.dataset.addComponentToEntity(this.entity, componentInstance);
    }
    return this;
};

/**
 * @template T
 * @param {class<T>} klass
 * @returns {T|null} component of specified class
 */
EntityBuilder.prototype.getComponent = function (klass) {
    for (let i = 0; i < this.element.length; i++) {
        const component = this.element[i];
        if (component instanceof klass) {
            return component;
        }
    }
    return null;
};

/**
 *
 * @param {class} klass
 * @returns {*|null}
 */
EntityBuilder.prototype.removeComponent = function (klass) {
    for (let i = 0; i < this.element.length; i++) {
        const component = this.element[i];
        if (component instanceof klass) {
            this.element.splice(i, 1);
            //see if entity is built
            if (this.entity !== void 0) {
                this.dataset.removeComponentFromEntity(this.entity, klass);
            }
            return component;
        }
    }
    return null;
};

/**
 *
 * @param {string} eventName
 * @param {*} event
 */
EntityBuilder.prototype.sendEvent = function (eventName, event) {
    if (this.entity !== void 0) {
        this.dataset.sendEvent(this.entity, eventName, event);
    } else {
        console.warn("Entity doesn't exist. Event " + eventName + ":" + event + " was not sent.")
    }
};

/**
 *
 * @param {string} eventName
 * @param {function} listener
 * @returns {EntityBuilder}
 */
EntityBuilder.prototype.addEventListener = function (eventName, listener) {
    if (this.entity !== void 0) {
        this.dataset.addEntityEventListener(this.entity, eventName, listener);
    } else {
        this.deferredListeners.push({
            name: eventName,
            listener: listener
        });
    }
    return this;
};

/**
 *
 * @param {string} eventName
 * @param {function} listener
 * @returns {EntityBuilder}
 */
EntityBuilder.prototype.removeEventListener = function (eventName, listener) {
    if (this.entity !== void 0) {
        this.dataset.removeEntityEventListener(this.entity, eventName, listener);
    } else {
        const listeners = this.deferredListeners;

        for (let i = 0, numListeners = listeners.length; i < numListeners; i++) {
            const deferredDescriptor = listeners[i];

            if (deferredDescriptor.name === eventName && deferredDescriptor.listener === listener) {
                listeners.splice(i, 1);

                i--;
                numListeners--;
            }
        }
    }
    return this;
};

/**
 * Removes built entity from the EntityManger
 * @returns {boolean}
 */
EntityBuilder.prototype.destroy = function () {
    if (this.getFlag(EntityBuilderFlags.Built)) {

        const dataset = this.dataset;
        const entity = this.entity;

        //check that the entity is the same as what we have built
        assert.ok(checkExistingComponents(entity, this.element, dataset), `Signature of EntityBuilder does not match existing entity(id=${entity})`);

        dataset.removeEntity(entity);
        this.entity = void 0;

        this.clearFlag(EntityBuilderFlags.Built);

        return true;
    } else {
        return false;
    }
};

/**
 *
 * @param {int} entity
 * @param {Array} components
 * @param {EntityComponentDataset} dataset
 */
function checkExistingComponents(entity, components, dataset) {
    if (!dataset.entityExists(entity)) {
        return false;
    }

    const numComponents = components.length;

    for (let i = 0; i < numComponents; i++) {
        const component = components[i];

        const actual = dataset.getComponent(entity, component.constructor);

        if (actual !== component) {
            return false;
        }
    }

    return true;
}

/**
 *
 * @returns {Number} entity
 * @param {EntityComponentDataset} dataset
 */
EntityBuilder.prototype.build = function (dataset) {
    assert.notEqual(dataset, undefined, 'dataset is undefined');
    assert.notEqual(dataset, null, 'dataset is null');

    if (this.entity !== undefined && checkExistingComponents(this.entity, this.element, dataset)) {
        //already built
        return this.entity;
    }

    const entity = this.entity = dataset.createEntity();
    this.dataset = dataset;

    let i, l;

    const listeners = this.deferredListeners;

    for (i = 0, l = listeners.length; i < l; i++) {
        const subscription = listeners[i];
        dataset.addEntityEventListener(entity, subscription.name, subscription.listener);
    }

    const element = this.element;

    for (i = 0, l = element.length; i < l; i++) {
        const component = element[i];
        dataset.addComponentToEntity(entity, component);
    }

    this.setFlag(EntityBuilderFlags.Built);

    this.on.built.dispatch(entity, dataset);
    return entity;
};
export default EntityBuilder;
