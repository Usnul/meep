/**
 *
 * @param {string} name
 * @param {ParameterLookupTable} lut
 * @constructor
 */
import { ParameterLookupTable } from "./ParameterLookupTable.js";
import { computeHashIntegerArray } from "../../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../../core/strings/StringUtils.js";

function ParameterTrack(name, lut) {
    /**
     *
     * @type {string}
     */
    this.name = name;
    /**
     *
     * @type {ParameterLookupTable}
     */
    this.track = lut;
}

ParameterTrack.prototype.toJSON = function () {
    return {
        name: this.name,
        track: this.track.toJSON()
    };
};

ParameterTrack.prototype.fromJSON = function (json) {
    this.name = json.name;

    const track = new ParameterLookupTable();
    track.fromJSON(json.track);

    this.track = track
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ParameterTrack.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeUTF8String(this.name);
    this.track.toBinaryBuffer(buffer);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ParameterTrack.prototype.fromBinaryBuffer = function (buffer) {
    this.name = buffer.readUTF8String();

    this.track = new ParameterLookupTable();

    this.track.fromBinaryBuffer(buffer);
};

ParameterTrack.prototype.hash = function () {
    return computeHashIntegerArray(
        computeStringHash(this.name),
        this.track.hash()
    );
};

/**
 *
 * @param {ParameterTrack} other
 * @returns {boolean}
 */
ParameterTrack.prototype.equals = function (other) {
    return this.name === other.name && this.track.equals(other.track);
};

export { ParameterTrack };