/**
 * Created by Alex on 11/02/14.
 */


import Stat from "./core/model/stat/Stat.js";


/**
 *
 * @returns {number}
 */
function timeInSeconds() {
    //Use highest available resolution time source
    const source = typeof performance === "undefined" ? Date : performance;

    return source.now() / 1000;
}

/**
 *
 * @param {Clock} clock
 */
function updateElapsedTime(clock) {
    const now = timeInSeconds();
    const delta = (now - clock.__lastMeasurement) * clock.speed;
    clock.__lastMeasurement = now;
    clock.elapsedTime += delta;
}

class Clock {
    constructor() {
        /**
         *
         * @type {number}
         * @private
         */
        this.__lastMeasurement = 0;

        /**
         *
         * @type {number}
         */
        this.elapsedTime = 0;

        this.timeAtDelta = 0;

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__isRunning = false;


        /**
         * how fast clock ticks in relation to real time
         * @type {Stat}
         */
        this.speed = new Stat(1);
        this.speed.postprocess = Stat.Process.clampMin(0);
    }

    /**
     *
     * @param {number} v
     */
    set multiplier(v) {
        this.speed.base.set(v);
    }

    /**
     *
     * @returns {number}
     */
    get multiplier() {
        return this.speed.base.getValue();
    }

    start() {
        this.__lastMeasurement = timeInSeconds();
        this.timeAtDelta = this.getElapsedTime();
        this.__isRunning = true;
    }

    pause() {
        this.__isRunning = false;
        //update time
        updateElapsedTime(this);
    }

    /**
     * Elapsed time since last {@link getDelta} call
     * @returns {number}
     */
    getDelta() {
        const elapsedTime = this.getElapsedTime();
        const delta = elapsedTime - this.timeAtDelta;
        this.timeAtDelta = elapsedTime;
        return delta;
    }

    /**
     *
     * @returns {number}
     */
    getElapsedTime() {
        if (this.__isRunning) {
            updateElapsedTime(this);
        }
        return this.elapsedTime;
    }

    reset() {
        this.elapsedTime = 0;
        this.timeAtDelta = 0;
    }
}


export default Clock;
