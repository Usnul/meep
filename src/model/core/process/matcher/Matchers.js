/**
 * @author Alex Goldring
 * @copyright Alex Goldring 2017
 */

import { assert } from "../../assert";

/**
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isNull(value) {
    return value === null;
}

/**
 * performs instanceof match
 * @param {class} type
 * @returns {function(*): boolean}
 */
export function isInstanceOf(type) {
    return function (m) {
        return m instanceof type;
    }
}

/**
 * performs typeof match
 * @param {string} type
 * @returns {function(*): boolean}
 */
export function isTypeOf(type) {
    assert.notEqual(['number', 'boolean', 'string', 'function', 'object', 'undefined'].indexOf(type), -1, `type must be one of [number, boolean, string, function, object, undefined], instead was '${type}'`);

    return function (m) {
        return typeof m === type;
    }
}

/**
 *
 * @param {number} value
 * @returns {function(*): boolean}
 */
export function isGreaterThan(value) {
    return function (x) {
        return x > value;
    }
}

/**
 *
 * @param {number} value
 * @returns {function(*): boolean}
 */
export function isGreaterThanOrEqualTo(value) {
    return function (x) {
        return x >= value;
    }
}

/**
 *
 * @param {number} value
 * @returns {function(*): boolean}
 */
export function isLessThan(value) {
    return function (x) {
        return x < value;
    }
}

/**
 *
 * @param {number} value
 * @returns {function(*): boolean}
 */
export function isLessThanOrEqualTo(value) {
    return function (x) {
        return x <= value;
    }
}

/**
 *
 * @param {number} value
 * @returns {function(*): boolean}
 */
export function isEqualTo(value) {
    return function (x) {
        return x === value;
    }
}


/**
 *
 * @param {function} m
 * @returns {function(*): boolean}
 */
export function not(m) {
    return function (v) {
        return !m(v);
    }
}

/**
 * Joins two matchers via AND
 * @param {function(*):boolean} a
 * @param {function(*):boolean} b
 * @returns {function(*):boolean}
 */
export function and(a, b) {
    assert.typeOf(a, 'function', 'a');
    assert.typeOf(b, 'function', 'b');

    return function (m) {
        return a(m) && b(m);
    }
}

/**
 * Joins two matchers via OR
 * @param {function(*):boolean} a
 * @param {function(*):boolean} b
 * @returns {function(*):boolean}
 */
export function or(a, b) {
    assert.typeOf(a, 'function', 'a');
    assert.typeOf(b, 'function', 'b');

    return function (m) {
        return a(m) || b(m);
    }
}
