/**
 * Created by Alex on 03/11/2016.
 */

/**
 *
 * @param o
 * @returns {boolean}
 */
function isTypedArray(o) {
    return (
        o instanceof Int8Array ||
        o instanceof Uint8Array ||
        o instanceof Uint8ClampedArray ||
        o instanceof Int16Array ||
        o instanceof Uint16Array ||
        o instanceof Int32Array ||
        o instanceof Uint32Array ||
        o instanceof Float32Array ||
        o instanceof Float64Array
    );
}

/**
 *
 * @param {object|number|string|null|array} json
 * @param {function} addToOutput
 */
function stringifyStream(json, addToOutput) {

    /**
     *
     * @param {string} name
     * @param {object|number|string|null|array} value
     */
    function processProperty(name, value) {
        addToOutput('"' + name + '":');
        processValue(value);
    }

    function processNestedObject(o) {
        addToOutput("{");
        let count = 0;
        for (let p in o) {
            if (count++ > 0) {
                addToOutput(",");
            }
            processProperty(p, o[p]);
        }
        addToOutput("}");
    }

    function processArrayObject(o) {
        addToOutput("[");
        const l = o.length;
        if (l > 0) {
            processValue(o[0]);
            for (let i = 1; i < l; i++) {
                addToOutput(",");
                processValue(o[i]);
            }
        }
        addToOutput("]");
    }

    function processValue(o) {
        const type = typeof o;
        switch (type) {
            case "object":
                if (o === null) {
                    addToOutput("null");
                } else if (o instanceof Array || isTypedArray(o)) {
                    processArrayObject(o);
                } else {
                    processNestedObject(o);
                }
                break;
            case "number":
            case "boolean":
            case "string":
                addToOutput(JSON.stringify(o));
                break;
            case "undefined":
                processValue("null");
                break;
            case "symbol":
            case "function":
            default:
                console.error("Failed to stringify value: ", o);
                throw new Error("Can not process object of type " + type);
                break;
        }
    }

    processValue(json);
}

/**
 *
 * @param {object} object
 * @param {string} path
 * @param {function} [missingPropertyHandler] Allows custom handling of missing properties
 * @returns {*}
 * @throws {Error} if a path can not be resolved
 */
function resolvePath(object, path, missingPropertyHandler) {
    const parts = path.split("/");
    let current = object;

    if (parts.length > 0 && parts[0] === "") {
        //if the first element is empty, remove it. Case of "/a/b/c"
        parts.shift();
    }

    const l = parts.length;
    for (let i = 0; i < l; i++) {
        const part = parts[i];
        if (!current.hasOwnProperty(part)) {
            if (typeof missingPropertyHandler === "function") {
                missingPropertyHandler(current, part, i, l);
            } else {
                throw new Error('failed to resolve path ' + path + "' at part " + i + " [" + part + "]");
            }
        }
        current = current[part];
    }
    return current;
}

function stringify(json) {
    let result = '';

    function addToOutput(fragment) {
        result += fragment;
    }

    try {
        stringifyStream(json, addToOutput);
    } catch (e) {
        //log result so far and re-throw
        console.error('result so far:', result);
        throw e;
    }
    return result;
}

export {
    stringify,
    stringifyStream,
    resolvePath,
    isTypedArray
};
