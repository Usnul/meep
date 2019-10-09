/**
 * Created by Alex on 09/10/2015.
 */


import { System } from '../../../ecs/System';
import InputController from '../components/InputController';
import ObservedValue from '../../../../core/model/ObservedValue';
import { resolvePath } from '../../../../core/json/JsonUtils';
import { assert } from "../../../../core/assert.js";

/**
 *
 * @param {Object} object
 * @param {String} propertyName
 * @param {function} constructor
 * @returns {*}
 */
function getOrCreateProperty(object, propertyName, constructor) {
    assert.notEqual(object, undefined, `object must not be undefined, can't resolve property '${propertyName}`);
    assert.equal(typeof propertyName, "string", `propertyName must be of type 'string', instead was '${typeof propertyName}'`);
    assert.equal(typeof constructor, "function", `constructor must be of type 'function', instead was '${typeof constructor}'`);

    if (object.hasOwnProperty(propertyName)) {
        return object[propertyName];
    } else {
        let value = constructor();
        object[propertyName] = value;
        return value;
    }
}

/**
 *
 * @param {Object} proxies
 * @param {String} path
 * @param {Signal} signal
 * @returns {Proxy}
 */
function getOrCreateProxy(proxies, path, signal) {
    /**
     *
     * @param {Signal} signal
     * @constructor
     */
    function Proxy(signal) {

        const self = this;

        /**
         * @type {Signal}
         */
        this.signal = signal;

        this.running = false;

        this.deferred = [];

        /**
         *
         * @type {InputControllerBinding[]}
         */
        const bindings = this.bindings = [];


        this.handler = function () {
            const l = bindings.length;
            for (let i = 0; i < l; i++) {
                /**
                 *
                 * @type {InputControllerBinding}
                 */
                const binding = bindings[i];
                const listener = binding.listener;
                listener.apply(undefined, arguments);
                if (binding.exclusive) {
                    break;
                }
            }
            self.__processDeferred();
        };
    }

    Proxy.prototype.__processDeferred = function () {
        const deferred = this.deferred;
        const dl = deferred.length;
        for (let i = 0; i < dl; i++) {
            const binding = deferred[i];
            this.registerBinding(binding);
        }

        this.deferred = [];
    };

    /**
     *
     * @param {InputControllerBinding} binding
     */
    Proxy.prototype.registerBinding = function (binding) {
        this.bindings.push(binding);
        this.bindings.sort((a, b) => {
            if (a.exclusive && !b.exclusive) {
                return -1;
            } else if (!a.exclusive && b.exclusive) {
                return 1;
            } else {
                return b.priotity - a.priority;
            }
        });
    };

    Proxy.prototype.start = function () {
        this.signal.add(this.handler);
    };

    Proxy.prototype.stop = function () {
        this.signal.remove(this.handler);
    };

    /**
     *
     * @param {InputControllerBinding} binding
     */
    Proxy.prototype.add = function (binding) {
        if (this.signal.isDispatching()) {
            // handler is currently running, adding the binding could trigger it immediately. Deferring the registration allows us to avoid this
            this.deferred.push(binding);
        } else {
            this.registerBinding(binding);
        }
    };

    /**
     *
     * @param {InputControllerBinding} binding
     */
    Proxy.prototype.remove = function (binding) {
        this.bindings.splice(this.bindings.indexOf(binding), 1);
    };

    return getOrCreateProperty(proxies, path, function () {
        const proxy = new Proxy(signal);
        proxy.start();
        return proxy;
    });
}

/**
 *
 * @param {List.<InputControllerBinding>} mapping
 * @param devices
 * @param proxies
 */
function applyBindings(mapping, devices, proxies) {
    mapping.forEach(function (binding) {
        const path = binding.path;
        const signal = resolvePath(devices, path);
        const proxy = getOrCreateProxy(proxies, path, signal);
        proxy.add(binding);
    });
}

/**
 *
 * @param {List.<InputControllerBinding>} mapping
 * @param devices
 * @param proxies
 */
function removeBindings(mapping, devices, proxies) {
    mapping.forEach(function (binding) {
        const path = binding.path;
        const signal = resolvePath(devices, path);
        const proxy = getOrCreateProxy(proxies, path, signal);
        proxy.remove(binding);
    });
}

/**
 * @deprecated Use {@link InputSystem} instead
 */
class InputControllerSystem extends System {
    constructor(devices) {
        super();
        this.enabled = new ObservedValue(true);
        this.componentClass = InputController;
        this.devices = devices;

        console.log('Input Controller System started. Devices: ', devices);

        const self = this;

        this.enabled.onChanged.add(function (v) {
            const entityManager = self.entityManager;
            const dataset = entityManager.dataset;

            if (dataset === null) {
                // do nothing
                return;
            }

            if (v) {
                dataset.traverseComponents(InputController, function (c) {
                    applyBindings(c.mapping, self.devices, self.proxies);
                });
            } else {
                dataset.traverseComponents(InputController, function (c) {
                    removeBindings(c.mapping, self.devices, self.proxies);
                });
            }
        });
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;
        this.proxies = {};
        readyCallback();
    }

    /**
     *
     * @param {InputController} component
     * @param entity
     */
    link(component, entity) {
        const mapping = component.mapping;
        const devices = this.devices;
        applyBindings(mapping, devices, this.proxies);
    }

    /**
     *
     * @param {InputController} component
     * @param entity
     */
    unlink(component, entity) {
        const mapping = component.mapping;
        const devices = this.devices;
        removeBindings(mapping, devices, this.proxies);
    }
}


export default InputControllerSystem;
