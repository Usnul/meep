/**
 * Created by Alex on 25/08/2015.
 */


function ComponentSpec(options) {
    this.componentClass = options.componentClass;
    this.defaults = options.defaults;
    this.systemId = null;
}

function EntityFactory() {
    this.isCompiled = false;
    this.components = [];
    this.dataset = null;
}

/**
 * @param {EntityComponentDataset} dataset
 */
EntityFactory.prototype.compile = function (dataset) {
    this.dataset = dataset;

    /**
     * Signature of generated function:
     * dataset, callback, ComponentClass0, ComponentClass1, ..., ComponentClassN, options0, options1, ... , optionsN
     * where options0 to optionsN is a set of options for a specific component identified by N in the same order as they appear in EntityFactory.components
     */
    const generatedFunctionParameterNames = ["dataset", "callback"]
        .concat(this.components.map(function (spec, index) {
            return varNameComponentClass(index);
        }))
        .concat(this.components.map(function (spec, index) {
            return varNameComponentOptions(index);
        }));

    //set systemIDs
    this.components.forEach(function (spec) {
        spec.systemId = dataset.computeComponentTypeIndex(spec.componentClass);
    });

    function varNameComponentInstance(index) {
        return "componentInstance" + index;
    }

    function varNameComponentClass(index) {
        return "ComponentClass" + index;
    }

    function varNameComponentOptions(index) {
        return "options" + index;
    }

    const strShallowCopyWithDefaults = [
        "function shallowCopyWithDefaults(options, defaults){",
        "       var result = {};",
        "       var propertyName;",
        "       for(propertyName in options){",
        "               if(options.hasOwnProperty(propertyName)){",
        "                       result[propertyName] = options[propertyName];",
        "               }",
        "       }",
        "       for(propertyName in defaults){",
        "               if(defaults.hasOwnProperty(propertyName) && !result.hasOwnProperty(propertyName)){",
        "                       result[propertyName] = defaults[propertyName];",
        "               }",
        "       }",
        "}"
    ].join("\n");

    //create a function that would generate and populate entity
    const snipComponentInstancing = this.components.map(function (spec, index) {
        return "var " + varNameComponentInstance(index) + " = new " + varNameComponentClass(index) + "(" + varNameComponentOptions(index) + ");"
    }).join("\n");

    //TODO see if we might get some performance boost if we sort instanciation order based on what we know about systems
    const snipComponentPopulation = this.components.map(function (spec, index) {
        return "dataset.addComponentToEntityByIndex(entity, " + spec.systemId + ", " + varNameComponentInstance(index) + ");";
    }).join("\n");

    //
    const snipComponentInvokeCallback = "if(callback !== void 0){ callback(" + this.components.map(function (spec, index) {
        return varNameComponentInstance(index);
    }).join(",") + ");}";

    const snipFunctionBody = [
        //header
        strShallowCopyWithDefaults,
        //instantiate all components with correct options
        snipComponentInstancing,
        snipComponentInvokeCallback,
        //create entity
        "var entity = dataset.createEntity();",
        //populate with components
        snipComponentPopulation,
        //finaly return entity
        "return entity;"
    ].join("\n");

    const snipFunctionParameters = generatedFunctionParameterNames.join(",");

    this.compiledFunction = new Function(snipFunctionParameters, snipFunctionBody);

    //pre-compute first part of parameters
    this.compiledFunctionParams = [dataset, null]
        .concat(this.components.map(function (spec) {
            return spec.componentClass;
        }))
        .concat(this.components.map(function (spec) {
            return spec.defaults;
        }));

    this.isCompiled = true;

    return this;
};

EntityFactory.prototype.hasComponent = function (componentClass) {
    return this.getComponentSpec(componentClass) !== void 0;
};

EntityFactory.prototype.getComponentSpec = function (componentClass) {
    let i = 0;
    const l = this.components.length;
    for (; i < l; i++) {
        const spec = this.components[i];
        if (spec.componentClass === componentClass) {
            return spec;
        }
    }
};

EntityFactory.prototype.setDefaults = function (componentClass, defaults) {
    const spec = this.getComponentSpec(componentClass);
    if (spec !== void 0) {
        spec.defaults = defaults;
    }
};

/**
 *
 * @param {function} componentClass
 * @param {*} [defaults]
 * @returns {EntityFactory}
 */
EntityFactory.prototype.add = function (componentClass, defaults) {
    let spec = this.getComponentSpec(componentClass);
    if (spec === void 0) {
        //component is not registered yet
        spec = new ComponentSpec({
            componentClass: componentClass,
            defaults: defaults
        });
        this.components.push(spec);
    } else {
        //just set the defaults
        spec.defaults = defaults;
    }
    return this;
};

/**
 *
 * @param {Object} json
 * @param {EntityComponentDataset} dataset
 */
EntityFactory.prototype.fromJSON = function (json, dataset) {
    let i = 0;
    const l = json.length;
    for (; i < l; i++) {
        const element = json[i];
        const typeName = element.type;
        const componentClass = dataset.getComponentClassByName(typeName);

        if (componentClass === null) {
            throw new Error('Failed to find class with name "' + typeName + '"');
        }

        const parameters = element.parameters;

        this.add(componentClass, parameters);
    }
};

EntityFactory.prototype.__getComponentSpecIndexByClass = function (componentClass) {
    let i = 0;
    const l = this.components.length;
    for (; i < l; i++) {
        const spec = this.components[i];
        if (spec.componentClass === componentClass) {
            return i;
        }
    }
};

/**
 * @param {callback} callback
 */
EntityFactory.prototype.create = function (callback) {
    const params = this.compiledFunctionParams;
    params[1] = callback;
    return this.compiledFunction.apply(null, params);
};

export default EntityFactory;