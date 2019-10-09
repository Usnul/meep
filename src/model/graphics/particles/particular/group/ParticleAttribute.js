/**
 *
 * @param {string} name
 * @param {ParticleAttributeType} attributeType
 * @param {ParticleDataType} dataType
 * @constructor
 */
export function ParticleAttribute(name, attributeType, dataType) {
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