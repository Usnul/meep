/**
 * Created by Alex on 30/04/2014.
 */


import EntityFactory from './EntityFactory';

function Blueprint() {
    this.element = [];
    /**
     *
     * @type {EntityFactory|null}
     */
    this.factory = null;
    this.buildCallback = null;
}

/**
 *
 * @param settings
 * @param {function(problem:string)} problemCallback
 */
Blueprint.prototype.verifyBuildSettings = function (settings, problemCallback) {
    const factoryComponents = this.factory.components;

    for (const typeName of Object.keys(settings)) {
        const matchFound = factoryComponents.find(function (spec) {
            return spec.componentClass.typeName === typeName;
        });

        if (!matchFound) {
            problemCallback(`factory has no component '${typeName}', found in the settings`);
        }
    }
};

Blueprint.prototype.compile = function () {

};

/**
 *
 * @param {Object} settings
 * @returns {Number}
 */
Blueprint.prototype.buildEntity = function (settings) {
    return this.factory.create(this.buildCallback(settings, this.systemMap));
};

/**
 *
 * @param {EntityManager} entityManager
 * @returns {object}
 */
function buildSystemMap(entityManager) {
    const result = {};

    const systems = entityManager.systems;
    for (let i = 0, l = systems.length; i < l; i++) {
        const system = systems[i];
        const componentClass = system.componentClass;

        const typeName = componentClass.typeName;

        if (typeName === undefined) {
            console.error("Component class has no type name: ", componentClass);
            continue;
        }

        if (result.hasOwnProperty(typeName)) {
            console.error("Duplicate component class name: ", componentClass, result[typeName]);
            continue;
        }

        result[typeName] = system;
    }

    return result;
}

/**
 *
 * @param {object} json
 * @param {EntityManager} entityManager
 */
Blueprint.prototype.fromJSON = function (json, entityManager) {
    this.factory = new EntityFactory();

    const dataset = entityManager.dataset;

    this.factory.fromJSON(json.components, dataset);
    this.factory.compile(dataset);

    this.systemMap = buildSystemMap(entityManager);

    //get setup function
    const setupFunctionBody = json.setup !== undefined ? json.setup : "";


    //make build callback
    const buildCallbackParameters = this.factory.components.map(function (spec) {
        return spec.componentClass.typeName;
    });

    let buildCallbackBody = this.factory.components.map(function (spec) {
        const name = spec.componentClass.typeName;
        const settingsVar = "$settings." + name;
        const systemVar = "$systems." + name;

        return "if(" + settingsVar + " !== undefined){ " + name + ".fromJSON(" + settingsVar + ", " + systemVar + ");}";
    }).concat(setupFunctionBody).join('\n');

    buildCallbackBody = "return function(" + buildCallbackParameters.join(', ') + "){\n" + buildCallbackBody + "\n};";

    this.buildCallback = new Function(['$settings', '$systems'], buildCallbackBody);
};

export default Blueprint;
