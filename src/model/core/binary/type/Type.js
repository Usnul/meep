/**
 * Created by Alex on 28/05/2016.
 */
import BinaryField from './Field';
import { assert } from "../../assert.js";

/**
 *
 * @param {String} name
 * @constructor
 */
function Type(name) {
    assert.equal(typeof name, "string", `Name must be of type "string", instead was "${typeof name}"`);

    /**
     *
     * @type {String}
     */
    this.name = name;
    /**
     *
     * @type {Array.<Field>}
     */
    this.fields = [];
    /**
     *
     * @type {boolean}
     */
    this.isPrimitive = false;
    /**
     *
     * @type {boolean}
     */
    this.isFixedLength = false;
}


/**
 *
 * @param {String} name
 * @returns {Field|null}
 */
Type.prototype.getFieldByName = function (name) {
    const fields = this.fields;
    let i = 0;
    const l = fields.length;
    for (; i < l; i++) {
        const field = fields[i];
        if (field.name === name) {
            return field;
        }
    }
    return null;
};

/**
 *
 * @param {String} name
 * @param {Type} type
 * @returns {Field}
 */
Type.prototype.addField = function (name, type) {
    let field = this.getFieldByName(name);
    if (field !== null) {
        throw new Error("Binary structure already contains a field named '" + name + "'");
    } else {
        field = new BinaryField(name, type);
        this.fields.push(field);
    }
    return field;
};

/**
 *
 * @returns {Type}
 */
Type.prototype.clone = function () {
    const result = new Type();
    result.fields = this.fields.slice();
    return result;
};

export default Type;