/**
 * Created by Alex on 12/06/2017.
 */

import Type from './Type';

/**
 *
 * @param {string} name
 * @returns {Type}
 */
function makePrimitive(name) {
    const type = new Type(name);
    type.isPrimitive = true;
    return type;
}

/**
 * @enum {Type}
 */
const PrimitiveType = {
    "Uint8": makePrimitive("Uint8"),
    "Uint16": makePrimitive("Uint16"),
    "Uint32": makePrimitive("Uint32"),
    "Int8": makePrimitive("Int8"),
    "Int16": makePrimitive("Int16"),
    "Int32": makePrimitive("Int32"),
    "Float32": makePrimitive("Float32"),
    "Float64": makePrimitive("Float64"),

    "String": makePrimitive("String"),
    "Boolean": makePrimitive("Boolean")
};

export default PrimitiveType;