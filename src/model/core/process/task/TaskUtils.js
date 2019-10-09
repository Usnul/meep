/**
 * Created by Alex on 22/05/2016.
 */
import Task from './Task';
import TaskSignal from './TaskSignal';
import { clamp } from "../../math/MathUtils.js";

/**
 *
 * @param {int} initial
 * @param {int} limit
 * @param {function(index:int)} callback
 * @returns {Task}
 */
export function countTask(initial, limit, callback) {
    let i = initial;
    const l = limit;

    function cycle() {
        if (i >= l) {
            return TaskSignal.EndSuccess;
        }
        callback(i);
        i++;

        return TaskSignal.Continue;
    }

    return new Task({
        name: "count (from " + initial + " to " + limit + ")",
        cycleFunction: cycle,
        computeProgress: function () {
            return (i - initial) / (limit - initial);
        }
    });
}

/**
 *
 * @param {number} delay in milliseconds
 * @param {string} [name]
 * @returns {Task}
 */
export function delayTask(delay, name = "unnamed") {
    let startTime = -1;

    const estimatedDuration = delay / 1000;
    return new Task({
        name: `delay (${delay}ms): ${name}`,
        initializer() {
            startTime = Date.now();
        },
        cycleFunction() {
            if (Date.now() >= startTime + delay) {
                return TaskSignal.EndSuccess;
            } else {
                return TaskSignal.Yield;
            }
        },
        computeProgress() {
            if (startTime === -1) {
                return 0;
            }

            const currentTime = Date.now();
            const remainingTime = currentTime - startTime;

            let fraction = remainingTime / delay;

            if (Number.isNaN(fraction)) {
                fraction = 0;
            }

            return clamp(fraction, 0, 1);
        },
        estimatedDuration
    });
}

/**
 *
 * @param {string} [name="no-operation"]
 * @returns {Task}
 */
export function emptyTask(name = "no-operation") {
    return new Task({
        name,
        cycleFunction: function () {
            return TaskSignal.EndSuccess;
        },
        computeProgress: function () {
            return 1;
        }
    });
}

/**
 *
 * @param e value to be thrown
 */
export function failingTask(e) {
    return new Task({
        name: "Failing Task",
        cycleFunction: function () {
            throw e;
        },
        computeProgress: function () {
            return 0;
        }
    });
}

/**
 *
 * @param {Future} future
 * @param {String} name
 * @returns {Task}
 */
export function futureTask(future, name) {
    if (typeof future.resolve !== 'function') {
        // Not a future
        throw new Error("No resolve function on the supplied object");
    }

    let resolved = false;
    let rejected = false;
    let error = null;

    future.then(function () {
        resolved = true;
    }, function (e) {
        rejected = true;
        error = e;
    });

    function cycle() {
        future.resolve();
        if (resolved) {
            return TaskSignal.EndSuccess;
        } else if (rejected) {
            throw error;
        } else {
            //give up CPU share
            return TaskSignal.Yield;
        }
    }

    function progress() {
        return resolved ? 1 : 0;
    }

    return new Task({
        name: name,
        cycleFunction: cycle,
        computeProgress: progress
    });
}

/**
 *
 * @param {Promise} promise
 * @param {string} name
 * @returns {Task}
 */
export function promiseTask(promise, name) {
    let resolved = false;
    let rejected = false;
    let error = null;

    promise.then(function () {
        resolved = true;
    }, function (e) {
        rejected = true;
        error = e;
    });

    function cycle() {
        if (resolved) {
            return TaskSignal.EndSuccess;
        } else if (rejected) {
            throw error;
        } else {
            //give up CPU share
            return TaskSignal.Yield;
        }
    }

    function progress() {
        return resolved ? 1 : 0;
    }

    return new Task({
        name: name,
        cycleFunction: cycle,
        computeProgress: progress
    });
}
