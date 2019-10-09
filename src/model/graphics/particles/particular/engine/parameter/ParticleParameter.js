import { computeHashIntegerArray } from "../../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../../core/strings/StringUtils.js";
import { assert } from "../../../../../core/assert.js";
import { ParameterLookupTable } from "./ParameterLookupTable.js";
import List from "../../../../../core/collection/List.js";


/**
 *
 * @param {string} name
 * @param {number} itemSize
 * @constructor
 */
function ParticleParameter(name, itemSize) {
    this.name = name;
    this.itemSize = itemSize;

    /**
     *
     * @type {List.<ParameterLookupTable>}
     */
    this.tracks = new List();

    /**
     * Default lookup table value for a track
     * @type {ParameterLookupTable}
     */
    this.defaultTrackValue = new ParameterLookupTable(itemSize);

    /**
     *
     * @type {number}
     */
    this.trackCount = 0;

    this.valueMin = 0;
    this.valueMax = 0;

    /**
     *
     * @type {AtlasPatch|null}
     */
    this.patch = null;
}


ParticleParameter.prototype.toJSON = function () {
    return {
        name: this.name,
        itemSize: this.itemSize,
        defaultTrackValue: this.defaultTrackValue.toJSON()
    };
};

ParticleParameter.prototype.fromJSON = function (json) {
    this.name = json.name;
    this.itemSize = json.itemSize;

    const defaultTrackValue = json.defaultTrackValue;

    if (Array.isArray(defaultTrackValue)) {
        //legacy format
        this.defaultTrackValue.itemSize = this.itemSize;
        this.defaultTrackValue.write(defaultTrackValue);
    } else {
        this.defaultTrackValue.fromJSON(defaultTrackValue);
    }
};


/**
 *
 * @param {BinaryBuffer} buffer
 */
ParticleParameter.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeUTF8String(this.name);
    buffer.writeUint8(this.itemSize);
    this.defaultTrackValue.toBinaryBuffer(buffer);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ParticleParameter.prototype.fromBinaryBuffer = function (buffer) {
    this.name = buffer.readUTF8String();
    this.itemSize = buffer.readUint8();
    this.defaultTrackValue.fromBinaryBuffer(buffer);
};

/**
 *
 * @param {number} value
 */
ParticleParameter.prototype.setTrackCount = function (value) {
    assert.equal(typeof value, 'number', `value expected to be to a number, but instead was '${typeof value}'`);
    assert.ok(Number.isInteger(value), `value expected to be an integer, instead was ${value}`);
    assert.ok(value >= 0, `value expected to be non-negative, instead was ${value}`);

    this.trackCount = value;
};

/**
 *
 * @returns {number}
 */
ParticleParameter.prototype.getTrackCount = function () {
    return this.trackCount;
};

/**
 *
 * @param {number[]} value
 * @param {number[]} positions
 */
ParticleParameter.prototype.setDefault = function (value, positions) {
    assert.equal(value.length % this.itemSize, 0, `number(=${value.length}) of elements in the default value set was not multiple of itemSize(=${this.itemSize})`)

    this.defaultTrackValue.itemSize = this.itemSize;
    this.defaultTrackValue.write(value, positions);
};

/**
 *
 * @param {number} index
 * @param {ParameterLookupTable} lut
 */
ParticleParameter.prototype.setTrack = function (index, lut) {
    if (lut.itemSize !== this.itemSize) {
        throw new Error(`Failed to add parameter track, lut.itemSize(=${lut.itemSize}) does not match patamter.itemSize(=${this.itemSize})`);
    }

    this.tracks.set(index, lut);
};

ParticleParameter.prototype.computeStatistics = function () {
    const trackCount = this.trackCount;


    let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
    let i, track;

    //account defaults
    min = Math.min(min, this.defaultTrackValue.valueMin);
    max = Math.max(max, this.defaultTrackValue.valueMax);

    //account tracks
    for (i = 0; i < trackCount; i++) {
        track = this.tracks.get(i);

        min = Math.min(min, track.valueMin);
        max = Math.max(max, track.valueMax);
    }

    //determine common offset and value range
    this.valueMin = min;
    this.valueMax = max;
};

ParticleParameter.prototype.build = function () {
    let i, track;

    //lock default track
    this.defaultTrackValue.disableWriteMode();

    for (i = 0; i < this.trackCount; i++) {
        track = this.tracks.get(i);

        if (track === undefined) {
            //write the default track into the parameter
            this.setTrack(i, this.defaultTrackValue);
        } else {
            //lock track
            track.disableWriteMode();
        }
    }

    this.computeStatistics();
};

ParticleParameter.prototype.hash = function () {
    const tracksHash = this.tracks.hash();

    return computeHashIntegerArray(
        tracksHash,
        computeStringHash(this.name),
        this.itemSize,
        this.trackCount,
        this.defaultTrackValue.hash()
    );
};

/**
 *
 * @param {ParticleParameter} other
 * @returns {boolean}
 */
ParticleParameter.prototype.equals = function (other) {
    if (this.itemSize !== other.itemSize) {
        return false;
    }

    if (this.name !== other.name) {
        return false;
    }

    if (this.trackCount !== other.trackCount) {
        return false;
    }

    if (!this.defaultTrackValue.equals(other.defaultTrackValue)) {
        return false;
    }

    return this.tracks.equals(other.tracks);
};

export { ParticleParameter };
