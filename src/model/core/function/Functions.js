/**
 * Collection of useful pure function. Saves having to allocate memory for new anonymous or arrow function. They also come with useful names.
 * @author Alex Goldring
 * @copyright Alex Goldring 2018
 */

/**
 * No-operation function. Does nothing. Useful when a callback is required to avoid checks for a missing function.
 */
export function noop() {
}

/**
 * Returns boolean true value.
 * @returns {boolean} always true
 */
export function returnTrue() {
    return true;
}

/**
 * Returns boolean false value.
 * @returns {boolean} always false
 */
export function returnFalse() {
    return false;
}

/**
 *
 * @returns {number} always 0
 */
export function returnZero() {
    return 0;
}

/**
 *
 * @returns {number} always 1
 */
export function returnOne() {
    return 1;
}

/**
 * @template A
 * @param {A} a
 * @returns {A}
 */
export function passThrough(a) {
    return a;
}

/**
 * @template A
 * @param {A} a
 * @param {A} b
 * @returns {boolean}
 */
export function strictEquals(a, b) {
    return a === b;
}

/**
 *
 * @param {...function} processes
 * @returns {function(*): *}
 */
export function chainFunctions(...processes) {
    const numProcesses = processes.length;

    return function chain(v) {
        let result = v;

        for (let i = 0; i < numProcesses; i++) {
            const process = processes[i];
            result = process(result);
        }

        return result;
    }
}
