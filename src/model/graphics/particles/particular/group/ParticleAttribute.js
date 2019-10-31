
import { assert } from "../../../../core/assert.js";

/**
 *
 * @param {string} name
 * @param {ParticleAttributeType} attributeType
 * @param {ParticleDataType} dataType
 * @constructor
 */
export function ParticleAttribute(name, attributeType, dataType) {
    assert.typeOf(name, 'string', 'name');
    assert.notEqual(attributeType, undefined, 'attributeType is undefined');
    assert.notEqual(dataType, undefined, 'dataType is undefined');

    /**
     *
     * @type {string}
     */
    this.name = name;
    /**
     *
     * @type {ParticleAttributeType}
     */
    this.type = attributeType;
    /**
     *
     * @type {ParticleDataType}
     */
    this.dataType = dataType;
}
