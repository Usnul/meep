/**
 * Created by Alex on 14/01/2017.
 */


//TODO consider making more abstract and using as a ViewFactory elsewhere

import { assert } from "../../../model/core/assert.js";

/**
 *
 * @constructor
 */
function ComponentControlFactory() {
    this.controllerTypes = {};
}

/**
 *
 * @param {string} componentTypeName
 * @param {function} factory
 * @returns {ComponentControlFactory}
 */
ComponentControlFactory.prototype.register = function (componentTypeName, factory) {
    assert.equal(typeof factory, 'function');
    assert.equal(typeof componentTypeName, 'string');

    this.controllerTypes[componentTypeName] = factory;

    return this;
};

/**
 *
 * @param {string} componentTypeName
 * @returns {object} instance of a controller for given component type
 */
ComponentControlFactory.prototype.create = function (componentTypeName) {
    const factory = this.controllerTypes[componentTypeName];
    return factory();
};

ComponentControlFactory.prototype.exists = function (typeName) {
    return this.controllerTypes.hasOwnProperty(typeName);
};

export default ComponentControlFactory;

