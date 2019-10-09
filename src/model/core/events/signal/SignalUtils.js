import Signal from "./Signal.js";
import { passThrough } from "../../function/Functions.js";

/**
 *
 * @param {number} delay in milliseconds
 * @param {function} [transform]
 * @returns {{handler: handler, signal: Signal}}
 */
export function signalAggregateByTimeWindow(delay, transform = passThrough) {
    let bucket = [];
    let timeout = null;

    const signal = new Signal();

    function timeoutHandler() {
        timeout = null;

        signal.dispatch(bucket);

        //create a new bucket
        bucket = [];
    }

    function handler(arg) {
        if (timeout === null) {
            //create a timeout
            timeout = setTimeout(timeoutHandler, delay);
        }

        bucket.push(transform(arg));
    }

    return {
        signal,
        handler
    };
}

/**
 *
 * @param {function(*):boolean} predicate
 */
export function signalFilter(predicate) {
    const signal = new Signal();

    function handler(...args) {
        if (predicate(...args)) {

            signal.dispatch(...args);

        }
    }

    return {
        signal,
        handler
    };
}
