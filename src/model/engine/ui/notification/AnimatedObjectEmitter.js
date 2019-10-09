import { max2, min2 } from "../../../core/math/MathUtils.js";
import AnimationTrackPlayback from "../../animation/keyed2/AnimationTrackPlayback.js";
import { noop } from "../../../core/function/Functions.js";
import Signal from "../../../core/events/signal/Signal.js";
import { assert } from "../../../core/assert.js";

/**
 * @template T
 */
class EmitterRecord {
    /**
     *
     * @param {T} object
     */
    constructor(object) {
        /**
         *
         * @type {T}
         */
        this.object = object;
        /**
         *
         * @type {AnimationTrackPlayback}
         */
        this.playback = null;
    }
}

/**
 * @template T,O
 */
export class AnimatedObjectEmitter {
    constructor() {

        /**
         *
         * @type {AnimationTrack}
         */
        this.animation = null;
        /**
         *
         * @type {Function}
         */
        this.animationUpdater = null;

        /**
         *
         * @type {Function}
         */
        this.objectFactory = null;

        /**
         *
         * @type {Function}
         */
        this.objectInitializer = noop;

        /**
         *
         * @type {Function}
         */
        this.objectFinalizer = noop;

        /**
         *
         * @type {EmitterRecord<T>[]}
         */
        this.elements = [];

        /**
         * Maximum number of elements to be displayed simultaneously, beyond this number animation speed dialation starts
         * @type {number}
         */
        this.rushThreshold = Number.POSITIVE_INFINITY;

        /**
         * Maximum number of elements to be emitted per second
         * @type {number}
         */
        this.spawnDelay = 0;


        /**
         *
         * @type {number}
         * @private
         */
        this.__spawnTimeBudget = 0;

        /**
         *
         * @type {O[]}
         * @private
         */
        this.__spawnBuffer = [];

        this.on = {
            spanwed: new Signal(),
            removed: new Signal()
        };

        /**
         *
         * @type {number}
         */
        this.liveCount = 0;
    }

    /**
     *
     * @param {AnimationTrack} animationTrack
     * @param {function} updater
     */
    setAnimation(animationTrack, updater) {
        this.animation = animationTrack;
        this.animationUpdater = updater;
    }

    /**
     *
     * @param {function(T)} init
     */
    setInitializer(init) {
        this.objectInitializer = init;
    }

    /**
     *
     * @param {function(T)} fin
     */
    setFinalizer(fin) {
        this.objectFinalizer = fin;
    }

    /**
     * @param {O} options
     */
    spawn(options) {
        assert.notEqual(options, undefined, 'options is undefined');

        this.liveCount++;

        if (this.__spawnTimeBudget < this.spawnDelay) {
            this.__spawnBuffer.push(options);
        } else {
            this.spawnImmediate(options);
            this.__spawnTimeBudget = 0;
        }
    }

    spawnImmediate(options) {
        assert.notEqual(options, undefined, 'options is undefined');
        assert.notEqual(options, null, 'options is null');

        const object = this.objectFactory(options);

        const playback = new AnimationTrackPlayback(this.animation, this.animationUpdater, object);

        assert.notEqual(object, undefined, 'object is undefined');

        playback.reset();

        playback.update();

        this.objectInitializer(object);

        const self = this;

        playback.on.ended.add(function () {
            if (!self.remove(object)) {
                console.error('Playback ended, and object not found', object, self);
            }
        });

        const item = new EmitterRecord(object);
        item.playback = playback;

        this.elements.push(item);

        this.on.spanwed.dispatch(object);

        return item;
    }

    trySpawnDeferred() {
        const spawnBuffer = this.__spawnBuffer;
        let spawnBufferSize = spawnBuffer.length;

        if (spawnBufferSize === 0) {
            return;
        }

        const d = this.__spawnTimeBudget;

        let i = 0;

        const n = min2(
            Math.floor(d / this.spawnDelay),
            spawnBufferSize
        );

        const itemsToSpawn = spawnBuffer.splice(0, n);

        for (i = 0; i < n; i++) {
            const opt = itemsToSpawn[i];

            const item = this.spawnImmediate(opt);

            // advance animation
            item.playback.advance((n - (i + 1)) * this.spawnDelay);
        }

        this.__spawnTimeBudget %= this.spawnDelay;
    }

    /**
     *
     * @param {T} object
     */
    remove(object) {
        const elements = this.elements;

        for (let i = 0, l = elements.length; i < l; i++) {

            /**
             *
             * @type {EmitterRecord<T>}
             */
            const element = elements[i];

            if (element.object === object) {

                elements.splice(i, 1);

                this.liveCount--;

                this.objectFinalizer(object);

                return true;
            }

        }
        return false;
    }

    /**
     *
     * @param {number} timeDelta
     */
    tick(timeDelta) {
        const elements = this.elements;
        const numElements = elements.length;

        for (let i = numElements - 1; i >= 0; i--) {
            const el = elements[i];
            const playback = el.playback;

            const adjustedSpeed = max2(1, (numElements - i) / this.rushThreshold);

            const speedAdjustedDelta = adjustedSpeed * timeDelta;

            playback.advance(speedAdjustedDelta);
        }

        this.__spawnTimeBudget += timeDelta;
        this.trySpawnDeferred();
    }
}
