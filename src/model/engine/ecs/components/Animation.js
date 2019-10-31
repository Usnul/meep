/**
 * Created by Alex on 01/04/2014.
 */


import List from '../../../core/collection/List';
import ObservedString from "../../../core/model/ObservedString.js";
import ObservedInteger from "../../../core/model/ObservedInteger.js";
import Vector1 from "../../../core/geom/Vector1.js";
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";
import { computeHashFloat, computeHashIntegerArray } from "../../../core/math/MathUtils.js";

/**
 *
 * @enum {number}
 */
export const AnimationClipFlag = {
    ClampWhenFinished: 1
};

class AnimationClip {
    constructor() {
        this.name = new ObservedString("");
        this.repeatCount = new ObservedInteger(1);
        this.weight = new Vector1(1);
        this.timeScale = new Vector1(1);

        /**
         *
         * @type {number}
         */
        this.flags = 0;
    }

    /**
     *
     * @param {AnimationClip} other
     * @returns {boolean}
     */
    equals(other) {
        return this.name.equals(other.name)
            && this.repeatCount.equals(other.repeatCount)
            && this.weight.equals(other.weight)
            && this.timeScale.equals(other.timeScale)
            && this.flags === other.flags;
    }

    /**
     *
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            this.name.hash(),
            this.repeatCount.hash(),
            this.weight.hash(),
            this.timeScale.hash(),
            this.flags
        );
    }

    /**
     *
     * @param {number|AnimationClipFlag} v
     * @returns {boolean}
     */
    getFlag(v) {
        return (this.flags & v) !== 0;
    }

    fromJSON(json) {
        if (typeof json.name === "string") {
            this.name.fromJSON(json.name);
        }

        if (typeof json.repeatCount === "number") {
            this.repeatCount.fromJSON(json.repeatCount);
        } else {
            this.repeatCount.set(Number.POSITIVE_INFINITY);
        }

        if (typeof json.weight === "number") {
            this.weight.fromJSON(json.weight);
        } else {
            this.weight.set(1);
        }

        if (typeof json.timeScale === "number") {
            this.timeScale.fromJSON(json.timeScale);
        } else {
            this.timeScale.set(1);
        }

        if (typeof json.flags === "number") {
            this.flags = json.flags;
        } else {
            this.flags = 0;
        }
    }

    toJSON() {
        return {
            name: this.name.toJSON(),
            repeatCount: this.repeatCount.toJSON(),
            weight: this.weight.toJSON(),
            timeScale: this.timeScale.toJSON(),
            flags: this.flags
        };
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        //write flags
        buffer.writeUint8(this.flags);

        this.name.toBinaryBuffer(buffer);
        this.repeatCount.toBinaryBuffer(buffer);
        this.weight.toBinaryBuffer(buffer);
        this.timeScale.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        this.flags = buffer.readUint8();

        this.name.fromBinaryBuffer(buffer);
        this.repeatCount.fromBinaryBuffer(buffer);
        this.weight.fromBinaryBuffer(buffer);
        this.timeScale.fromBinaryBuffer(buffer);
    }
}

/**
 * @class
 */
export class Animation {
    /**
     *
     * @param options
     * @property {List.<AnimationClip>} clips
     * @constructor
     */
    constructor(options) {
        /**
         *
         * @type {List<AnimationClip>}
         */
        this.clips = new List();

        this.isPlaying = true;

        this.debtTime = 0;

        if (options !== undefined) {
            this.fromJSON(options);
        }

        /**
         * @protected
         * @type {Future|null}
         */
        this.mixer = null;
    }

    /**
     *
     * @param {Animation} other
     * @returns {boolean}
     */
    equals(other) {
        return this.clips.equals(other.clips)
            && this.debtTime === other.debtTime;
    }

    /**
     *
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            this.clips.hash(),
            computeHashFloat(this.debtTime)
        );
    }

    /**
     *
     * @param json
     * @returns {Animation}
     */
    static fromJSON(json) {
        const a = new Animation();
        a.fromJSON(json);
        return a;
    }

    fromJSON(json) {
        if (json.clips instanceof Array) {
            this.clips.fromJSON(json.clips, AnimationClip);
        } else {
            this.clips.reset();
        }

        if (typeof json.debtTime === "number") {
            this.debtTime = json.debtTime;
        } else {
            this.debtTime = 0;
        }
    }

    toJSON() {
        return {
            clips: this.clips.toJSON(),
            debtTime: this.debtTime
        };
    }


}

Animation.Clip = AnimationClip;

/**
 *
 * @param json
 * @returns {Animation}
 */
Animation.fromJSON = function (json) {
    const r = new Animation();

    r.fromJSON(json);

    return r;
};

Animation.typeName = "Animation";

export class AnimationSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Animation;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Animation} value
     */
    serialize(buffer, value) {
        value.clips.toBinaryBuffer(buffer);
        buffer.writeFloat64(value.debtTime);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Animation} value
     */
    deserialize(buffer, value) {
        value.clips.fromBinaryBuffer(buffer, AnimationClip);
        value.debtTime = buffer.readFloat64();
    }
}
