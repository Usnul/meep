import Signal from "../../../core/events/signal/Signal.js";
import { min2 } from "../../../core/math/MathUtils.js";

/**
 *
 * @param {AnimationTrack} track
 * @param updateCallback
 * @param {Object} [updateTarget]
 * @constructor
 * @property {AnimationTrack} track
 * @property {number} position Current playback time
 */
function AnimationTrackPlayback(track, updateCallback, updateTarget) {
    this.track = track;
    this.position = track.timeStart;

    this.updateCallback = updateCallback;
    this.updateTraget = updateTarget;

    this.__lastKeyIndex = 0;
    this.__lastTransitionIndex = 0;

    this.__nextKeyIndex = 0;
    this.__nextKeyTime = 0;

    this.__loop = false;

    this.__valueBuffer = new Float64Array(track.propertyCount);


    this.on = {
        ended: new Signal()
    };

    this.setPosition(0);
}

/**
 *
 * @param {boolean} v
 */
AnimationTrackPlayback.prototype.setLoop = function (v) {
    this.__loop = v;
};

AnimationTrackPlayback.prototype.reset = function () {
    this.setPosition(this.track.timeStart);
};

/**
 *
 * @param {number} time
 */
AnimationTrackPlayback.prototype.setPosition = function (time) {
    this.position = time;

    const track = this.track;
    const transitionIndex = track.transitionIndexAt(time);

    this.__lastTransitionIndex = transitionIndex;

    if (transitionIndex !== -1) {
        //found a transition, read out start key index
        this.__lastKeyIndex = track.transitionKeys[transitionIndex];
    } else {
        //no transition found, lets find last key at least
        this.__lastKeyIndex = track.keyLowerBoundIndexAt(time);
    }

    //figure out next key time
    const trackKeyCount = track.keyTimes.length;
    if (trackKeyCount > 1) {
        this.__nextKeyIndex = min2(this.__lastKeyIndex + 1, trackKeyCount - 1);
    } else {
        this.__nextKeyIndex = this.__lastKeyIndex;
    }

    this.__nextKeyTime = track.keyTimes[this.__nextKeyIndex];
};

/**
 *
 * @returns {boolean} Indicated whenever or not a key was advanced, no advancement is possible past end of the sequence
 */
AnimationTrackPlayback.prototype.advanceKey = function () {

    const track = this.track;
    const keyCount = track.keyTimes.length;
    if (this.__lastKeyIndex === keyCount - 1) {
        //we were on the last key
        if (this.__loop) {
            //loop back
            this.__lastKeyIndex = -1;
        } else {
            //we're at the end of the track, no sense in using transition as we are directly on a key
            this.__lastTransitionIndex = -1;

            this.on.ended.dispatch();

            //can't advance further
            return false;
        }
    }

    this.__lastKeyIndex = this.__lastKeyIndex + 1;

    this.__nextKeyTime = track.keyTimes[Math.min(this.__lastKeyIndex + 1, keyCount - 1)];

    //fetch transition if one exists
    const transitionKeys = track.transitionKeys;
    const transitionCount = transitionKeys.length;
    for (let i = this.__lastTransitionIndex + 1; i < transitionCount; i++) {
        const startKeyIndex = transitionKeys[i];
        if (startKeyIndex === this.__lastKeyIndex) {
            //we found a match
            this.__lastTransitionIndex = i;
            break;
        } else if (startKeyIndex > this.__lastKeyIndex) {
            //we went too far, it appears there is no transition for current key
            this.__lastTransitionIndex = -1;
            break;
        }
    }

    return true;
};

/**
 * Advance animation by given time delta
 * @param {number} timeDelta
 */
AnimationTrackPlayback.prototype.advance = function (timeDelta) {

    let newPosition = this.position + timeDelta;

    if (timeDelta < 0) {
        //negative delta, going back in time
        this.setPosition(newPosition);
    } else if (newPosition > this.__nextKeyTime) {

        if (newPosition >= this.track.timeEnd) {
            if (this.__loop) {
                //loop back
                newPosition %= this.track.timeEnd;
            } else {
                this.on.ended.dispatch();
            }
        }

        this.setPosition(newPosition);

    } else {

        this.position = newPosition;

    }

    this.update();
};

AnimationTrackPlayback.prototype.update = function () {

    this.readCurrentValues(this.__valueBuffer);

    this.updateCallback.apply(this.updateTraget, this.__valueBuffer);

    // console.log("values: ", this.__valueBuffer);
};

/**
 *
 * @param {number[]} result
 */
AnimationTrackPlayback.prototype.readCurrentValues = function (result) {
    const track = this.track;

    const startKeyIndex = this.__lastKeyIndex;

    if (this.__lastTransitionIndex !== -1) {
        //we're in a middle of a transition

        const time1 = this.__nextKeyTime;
        const time0 = track.keyTimes[startKeyIndex];

        const timeDelta = time1 - time0;
        const relativeTime = (this.position - time0);

        const normalizedTime = relativeTime / timeDelta;

        const transitionFunction = track.transitionFunctions[this.__lastTransitionIndex];

        const transitionValue = transitionFunction(normalizedTime);

        const propCount = track.propertyCount;

        const keyValues = track.keyValues;

        const offset0 = startKeyIndex * propCount;
        const offset1 = offset0 + propCount;

        for (let i = 0; i < propCount; i++) {
            const v0 = keyValues[i + offset0];
            const v1 = keyValues[i + offset1];

            const valueDelta = v1 - v0;

            const value = transitionValue * valueDelta + v0;

            result[i] = value;
        }
    } else {
        //we're not in a transition, can re-use old key
        track.readKeyValues(startKeyIndex, result);
    }
};

export default AnimationTrackPlayback;
