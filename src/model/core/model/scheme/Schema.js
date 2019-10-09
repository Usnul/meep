import Field from "../../binary/type/Field";
import MultiplicityType from "../../binary/type/MultiplicityType";
import { assert } from "../../assert.js";

/**
 *
 * @param {String} name
 * @constructor
 */
function Schema(name) {
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
}

/**
 *
 * @param {String} name
 * @returns {Field | undefined}
 */
Schema.prototype.getFieldByName = function (name) {
    return this.fields.find(f => f.name === name);
};

Schema.prototype.add = function (name, type, multiplicity = MultiplicityType.AtMostOne) {
    const field = new Field(name, type, multiplicity);
    this.addField(field);

    return this;
};

/**
 *
 * @param {Field} field
 */
Schema.prototype.addField = function (field) {
    const existingField = this.getFieldByName(field.name);

    if (existingField !== undefined) {
        throw  new Error(`Field "${field.name}" is already defined`);
    }


    this.fields.push(field);
};

/**
 *
 * @param {Schema} other
 */
Schema.prototype.copyFields = function (other) {
    const otherFields = other.fields;
    for (let i = 0, l = otherFields.length; i < l; i++) {
        const field = otherFields[i];

        this.addField(field);
    }
};

export default Schema;