import { assert } from "../../../core/assert.js";
import { isTypedArray } from "../../../core/json/JsonUtils.js";

/**
 *
 * @param {String[]} properties
 * @constructor
 */
function AnimationTrack(properties) {
    /**
     *
     * @type {String[]}
     */
    this.properties = properties;

    /**
     *
     * @type {number}
     */
    this.propertyCount = properties.length;

    this.keyValues = [];
    this.keyTimes = [];

    this.timeStart = Number.POSITIVE_INFINITY;
    this.timeEnd = Number.NEGATIVE_INFINITY;

    this.transitionKeys = [];
    this.transitionFunctions = [];
}

AnimationTrack.prototype.initialize = function () {
    const keysTyped = new Float64Array(this.keyValues.length);

    //transfer original keys into typed array
    keysTyped.set(this.keyValues, 0);

    //overwrite the original array
    this.keyValues = keysTyped;

    const keyTimesTyped = new Float32Array(this.keyTimes.length);
    keyTimesTyped.set(this.keyTimes, 0);

    this.keyTimes = keyTimesTyped;
};

/**
 *
 * @param {number} keyTime
 * @param {number[]} values
 */
AnimationTrack.prototype.addKey = function (keyTime, values) {
    if (values.length !== this.propertyCount) {
        throw new Error("Number of supplied values(" + values.length + ") does not match number of track properties(" + this.propertyCount + ")");
    }

    const keyCount = this.keyTimes.length;

    if (keyCount === 0) {
        //this is the very first key
        this.timeStart = keyTime;
    } else if (keyTime < this.timeEnd) {
        //TODO we can do some sorting here. Have to account for possible existing transitions
        throw new Error("Attempted to insert key in the past. Keys must be sequential");
    } else if (keyTime === this.timeEnd) {
        throw  new Error("Attempted to insert key at the same time as already existing key");
    }

    //update end time of the track
    this.timeEnd = keyTime;

    Array.prototype.push.apply(this.keyValues, values);
    this.keyTimes.push(keyTime);
};

/**
 *
 * @param {number} startKeyIndex
 * @param {function(number):number} transitionFunction
 */
AnimationTrack.prototype.addTransition = function (startKeyIndex, transitionFunction) {
    this.transitionKeys.push(startKeyIndex);
    this.transitionFunctions.push(transitionFunction);
};

/**
 *
 * @param {number} time
 * @returns {number}
 */
AnimationTrack.prototype.keyLowerBoundIndexAt = function (time) {
    const keyTimes = this.keyTimes;
    const keyCount = keyTimes.length;


    for (let i = 0, l = keyCount; i < l; i++) {
        const keyTime = keyTimes[i];
        if (keyTime > time) {
            return i - 1;
        }
    }

    //nothing found, return index of very last key (if no keys exist it will be -1)
    return keyCount - 1;
};

/**
 *
 * @param {number} time
 * @returns {number}
 */
AnimationTrack.prototype.transitionIndexAt = function (time) {
    const transitionKeys = this.transitionKeys;
    const numTransitions = transitionKeys.length;

    const keyTimes = this.keyTimes;

    for (let i = 0, l = numTransitions; i < l; i++) {
        const startKeyIndex = transitionKeys[i];

        const endTime = keyTimes[startKeyIndex + 1];

        if (endTime < time) {
            //transition ends before time in question
            continue;
        }

        const startTime = keyTimes[startKeyIndex];
        if (startTime <= time) {
            //match
            return i;
        } else {
            //went too far, there is no transition that covers this time
            return -1;
        }
    }

    //no transitions exist, return -1
    return -1;
};

/**
 *
 * @param {number} keyIndex
 * @param {number[]} result
 */
AnimationTrack.prototype.readKeyValues = function (keyIndex, result) {
    assert.equal(typeof keyIndex, 'number', `keyIndex must be a number, instead was '${typeof keyIndex}'`);
    assert.ok(Number.isInteger(keyIndex), `keyIndex must be an integer, instead was ${keyIndex}`);
    assert.ok(keyIndex >= 0, `keyIndex must be non-negative, was ${keyIndex}`);

    assert.equal(typeof result, 'object', `result argument must be an object, instead was '${typeof result}'`);
    assert.ok(Array.isArray(result) || isTypedArray(result), `result argument must be an array, instead was something else (${result})`);

    const propertyCount = this.propertyCount;
    const offset = propertyCount * keyIndex;

    const keyValues = this.keyValues;

    for (let i = 0; i < propertyCount; i++) {
        result[i] = keyValues[i + offset];
    }
};

export default AnimationTrack;
