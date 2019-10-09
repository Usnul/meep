/**
 * Created by Alex on 28/05/2016.
 */


import MultiplicityType from './MultiplicityType';
import { assert } from "../../assert.js";

/**
 *
 * @param {String} name
 * @param {Type} type
 * @param {MultiplicityType} multiplicity
 * @constructor
 */
function Field(name, type, multiplicity = MultiplicityType.One) {
    assert.equal(typeof name, "string", `Name must be of type "string", instead was "${typeof name}"`);

    this.name = name;
    this.type = type;
    this.multiplicity = multiplicity;
    this.initial = null;
    this.observed = true;
}

export default Field;