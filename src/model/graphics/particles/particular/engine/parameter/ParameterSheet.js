/**
 * Collection of parameters, serves as an accelerated data structure and is also responsible for maintaining parameter lookup texture
 * @constructor
 */
import { TextureAtlas } from "../../../../texture/atlas/TextureAtlas.js";
import List from "../../../../../core/collection/List.js";
import { Sampler2D } from "../../../../texture/sampler/Sampler2D.js";
import { assert } from "../../../../../core/assert.js";

/**
 *
 * @param {number} itemSize
 * @returns {function(sampleValue:number[], min:number, max:number, encodedValue: number[])}
 */
function computeParameterValueEncoder(itemSize) {
    assert.equal(typeof itemSize, 'number', `itemSize must be a number, instead was '${typeof itemSize}'`);

    if (itemSize === 1) {
        return encodeParameterValueScalar;
    } else if (itemSize === 2) {
        return encodeParameterValueVector2;
    } else if (itemSize === 3) {
        return encodeParameterValueVector3;
    } else if (itemSize === 4) {
        return encodeParameterValueVector4;
    } else {
        throw new Error(`Unsupported item size ${itemSize}`);
    }
}

/**
 *
 * @param {number[]} sampleValue
 * @param {number} min
 * @param {number} max
 * @param {number[]} result
 */
function encodeParameterValueScalar(sampleValue, min, max, result) {
    const range = max - min;

    const normalizedValue = (sampleValue[0] - min) / range;

    const scaledValue = normalizedValue * 4294967295;

    result[0] = scaledValue & (0xFF);
    result[1] = scaledValue >> 8 & (0xFF);
    result[2] = scaledValue >> 16 & (0xFF);
    result[3] = scaledValue >> 24 & (0xFF);
}

/**
 *
 * @param {number[]} sampleValue
 * @param {number} min
 * @param {number} max
 * @param {number[]} result
 */
function encodeParameterValueVector2(sampleValue, min, max, result) {
    const range = max - min;

    const nX = (sampleValue[0] - min) / range;
    const nY = (sampleValue[1] - min) / range;

    const sX = nX * 65535;
    const sY = nY * 65535;

    result[0] = sX & 0xFF;
    result[1] = sX >> 8 & 0xFF;

    result[2] = sY & 0xFF;
    result[3] = sY >> 8 & 0xFF;
}

/**
 *
 * @param {number[]} sampleValue
 * @param {number} min
 * @param {number} max
 * @param {number[]} result
 */
function encodeParameterValueVector3(sampleValue, min, max, result) {
    const range = max - min;

    const nX = (sampleValue[0] - min) / range;
    const nY = (sampleValue[1] - min) / range;
    const nZ = (sampleValue[2] - min) / range;

    const sX = nX * 255;
    const sY = nY * 255;
    const sZ = nZ * 255;

    result[0] = sX;
    result[1] = sY;
    result[2] = sZ;
    result[3] = 255;
}

/**
 *
 * @param {number[]} sampleValue
 * @param {number} min
 * @param {number} max
 * @param {number[]} result
 */
function encodeParameterValueVector4(sampleValue, min, max, result) {
    const range = max - min;

    const nX = (sampleValue[0] - min) / range;
    const nY = (sampleValue[1] - min) / range;
    const nZ = (sampleValue[2] - min) / range;
    const nW = (sampleValue[3] - min) / range;

    const sX = nX * 255;
    const sY = nY * 255;
    const sZ = nZ * 255;
    const sW = nW * 255;

    result[0] = sX;
    result[1] = sY;
    result[2] = sZ;
    result[3] = sW;
}

/**
 *
 * @param {ParticleParameter} parameter
 * @param {number} length number of pixels to be used for each track, more - higher accuracy and smoother transitions
 * @returns {Sampler2D}
 */
function buildParameterSampler(parameter, length) {
    assert.equal(typeof length, 'number', `Parameter length must be a number, instead was '${typeof length}'`);

    const trackThickness = 2;

    const trackCount = parameter.getTrackCount();

    assert.equal(trackCount, parameter.tracks.length, `parameter.trackCount(=${trackCount}) is not equal to parameter.tracks.length(=${parameter.tracks.length})`);

    const itemSize = parameter.itemSize;

    const sampler2D = Sampler2D.uint8(4, length, trackCount * trackThickness);

    const uDivisor = Math.max(1, length - 1);

    const sampleValue = new Array(itemSize);

    const valueMin = parameter.valueMin;
    const valueMax = parameter.valueMax;

    const encodedValue = new Array(4);

    const encoder = computeParameterValueEncoder(itemSize);

    let i, j, k;

    //encode values
    for (i = 0; i < trackCount; i++) {
        const track = parameter.tracks.get(i);

        assert.notEqual(track, undefined, 'track is undefined');
        assert.notEqual(track, null, 'track is null');

        for (j = 0; j < length; j++) {

            const u = j / uDivisor;

            //sample value from the track
            track.sample(u, sampleValue);

            //encode values
            encoder(sampleValue, valueMin, valueMax, encodedValue);

            for (k = 0; k < trackThickness; k++) {
                //write sampled value to the sampler
                sampler2D.set(j, i * trackThickness + k, encodedValue);
            }
        }
    }

    return sampler2D;
}

/**
 *
 * @param {number} hash
 * @param {number} count
 * @param {AtlasPatch} patch
 * @constructor
 */
function MapEntry(hash, count, patch) {
    this.hash = hash;
    this.count = count;
    this.patch = patch;
}

function ParameterSheet() {
    this.atlas = new TextureAtlas();

    this.tables = new List();

    /**
     *
     * @type {Map<int, MapEntry>}
     */
    this.tableMap = new Map();

    this.__atlasNeedsUpdate = false;

    this.paramterResolution = 32;
}

ParameterSheet.prototype.update = function () {
    if (this.__atlasNeedsUpdate) {
        this.atlas.update();

        this.__atlasNeedsUpdate = false;
    }
};

/**
 *
 * @param {ParticleParameter} parameter
 */
ParameterSheet.prototype.add = function (parameter) {
    this.tables.add(parameter);

    const hash = parameter.hash();

    let entry;

    if (this.tableMap.has(hash)) {
        entry = this.tableMap.get(hash);
        entry.count++;
    } else {
        //create a sampler from lut
        const sampler = buildParameterSampler(parameter, this.paramterResolution);

        //create patch
        const patch = this.atlas.add(sampler, 0);

        //mark atlas for update
        this.__atlasNeedsUpdate = true;

        entry = new MapEntry(hash, 1, patch);

        this.tableMap.set(hash, entry);
    }

    parameter.patch = entry.patch;
};

/**
 * @param {ParticleParameter} parameter
 */
ParameterSheet.prototype.remove = function (parameter) {
    this.tables.removeOneOf(parameter);

    const hash = parameter.hash();

    const entry = this.tableMap.get(hash);

    entry.count--;

    if (entry <= 0) {
        //last usage removed
        this.tableMap.delete(hash);
        //clear from the atlas
        this.atlas.remove(entry.patch);
    }
};

export { ParameterSheet };


