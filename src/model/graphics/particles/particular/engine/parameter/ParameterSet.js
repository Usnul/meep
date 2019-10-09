import List from "../../../../../core/collection/List.js";
import { ParticleParameter } from "./ParticleParameter.js";

function ParameterSet() {
    /**
     * @private
     * @type {List.<ParticleParameter>}
     */
    this.parameters = new List();
}

/**
 *
 * @param {ParticleParameter} parameter
 */
ParameterSet.prototype.add = function (parameter) {
    //ensure that no parameter with the same name exists
    const existingParameter = this.getParameterByName(parameter.name);

    if (existingParameter !== undefined) {
        throw new Error(`Parameter with name '${parameter.name}' already exists`);
    }

    this.parameters.add(parameter);
};

/**
 *
 * @param {string} name
 * @returns {ParticleParameter|undefined}
 */
ParameterSet.prototype.getParameterByName = function (name) {
    return this.parameters.find(function (p) {
        return p.name === name;
    });
};

ParameterSet.prototype.build = function () {
    this.parameters.forEach(function (param) {
        param.build();
    });
};

/**
 *
 * @returns {Array<ParticleParameter>}
 */
ParameterSet.prototype.asArray = function () {
    return this.parameters.asArray();
};

/**
 *
 * @returns {number}
 */
ParameterSet.prototype.hash = function () {
    return this.parameters.hash();
};

/**
 *
 * @param {ParameterSet} other
 * @returns {boolean}
 */
ParameterSet.prototype.equals = function (other) {
    return this.parameters.equals(other.parameters);
};

/**
 *
 * @param {number} count
 */
ParameterSet.prototype.setTrackCount = function (count) {
    this.parameters.forEach(p => p.setTrackCount(count));
};

/**
 *
 * @param {number} index
 * @param {ParameterTrackSet} trackSet
 */
ParameterSet.prototype.setTracks = function (index, trackSet) {
    const self = this;

    trackSet.forEach(function (track) {
        const name = track.name;

        const parameter = self.getParameterByName(name);

        if (parameter === undefined) {
            throw new Error(`Failed to add track with name '${name}', no parameter exists with that name`);
        }

        parameter.setTrack(index, track.track);
    });
};

ParameterSet.prototype.toJSON = function () {
    return this.parameters.toJSON();
};

ParameterSet.prototype.fromJSON = function (json) {
    this.parameters.fromJSON(json, ParticleParameter);
};


/**
 *
 * @param {BinaryBuffer} buffer
 */
ParameterSet.prototype.toBinaryBuffer = function (buffer) {
    this.parameters.toBinaryBuffer(buffer);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ParameterSet.prototype.fromBinaryBuffer = function (buffer) {
    this.parameters.fromBinaryBuffer(buffer, ParticleParameter);
};

export { ParameterSet };