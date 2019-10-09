import { ParticleGroup } from "./ParticleGroup.js";


/**
 *
 * @constructor
 */
export function ParticleSpecification() {
    /**
     *
     * @type {Array.<ParticleAttribute>}
     */
    this.attributes = [];
}

/**
 *
 * @param {ParticleAttribute} attribute
 * @returns {ParticleSpecification}
 */
ParticleSpecification.prototype.add = function (attribute) {
    //check uniqueness of name
    if (this.attributes.some(function (a) {
        return a.name === attribute.name;
    })) {
        throw new Error(`Attribute named '${attribute.name}' already exists`);
    }

    this.attributes.push(attribute);

    //for chaining, return self
    return this;
};

/**
 *
 * @return {ParticleGroup}
 */
ParticleSpecification.prototype.build = function () {
    return new ParticleGroup(this);
};
