/**
 *
 * @param {Array} first
 * @param {Array} second
 * @returns {boolean}
 */
import { assert } from "../assert.js";

export function isArrayEqual(first, second) {

    const il = first.length;

    if (il !== second.length) return false;

    let i = 0;

    for (; i < il; i++) {

        const a = first[i];
        const b = second[i];

        if (a === b) {
            continue;
        }


        if (a === undefined) {
            //a is undefined, and B is something else
            return false;
        }

        if (a === null) {
            //a is null and B is something else
            return false;
        }

        //try "equals" method
        if (typeof a.equals === "function") {

            if (!a.equals(b)) {
                return false;
            }

        } else {
            return false;
        }

    }

    return true;

}

/**
 *
 * @param {Array} a
 * @param {Array} b
 * @returns {boolean}
 */
export function isArrayEqualStrict(a, b) {

    const il = a.length;

    if (il !== b.length) return false;

    let i = 0;

    for (; i < il; i++) {

        if (a[i] !== b[i]) return false;

    }

    return true;

}

/**
 * @template T
 * @param {T[]} array
 * @param {function(T):number} scoreFunction
 * @returns {T}
 */
export function arrayPickBestElement(array, scoreFunction) {
    assert.notEqual(array, undefined, 'array is undefined');
    assert.typeOf(scoreFunction, 'function', 'scoreFunction');

    let bestElement;
    let bestScore;

    const size = array.length;

    if (size === 0) {
        return undefined;
    }

    bestElement = array[0];

    bestScore = scoreFunction(bestElement);

    assert.typeOf(bestScore, 'number', 'bestScore');

    for (let i = 1; i < size; i++) {
        const el = array[i];

        // compute score
        const score = scoreFunction(el);

        assert.typeOf(score, 'number', 'score');

        if (score > bestScore) {
            bestScore = score;
            bestElement = el;
        }
    }

    return bestElement;
}

/**
 * @template T
 * @param {T[]} array
 * @param {function(T):number} scoreFunction
 * @returns {T}
 */
export function arrayPickMinElement(array, scoreFunction) {
    assert.notEqual(array, undefined, 'array is undefined');
    assert.typeOf(scoreFunction, 'function', 'scoreFunction');

    let bestElement;
    let bestScore;

    const size = array.length;

    if (size === 0) {
        return undefined;
    }

    bestElement = array[0];

    bestScore = scoreFunction(bestElement);

    assert.typeOf(bestScore, 'number', 'bestScore');

    for (let i = 1; i < size; i++) {
        const el = array[i];

        // compute score
        const score = scoreFunction(el);

        assert.typeOf(score, 'number', 'score');

        if (score < bestScore) {
            bestScore = score;
            bestElement = el;
        }
    }

    return bestElement;
}

/**
 * @template T,K
 * @param {T[]} array
 * @param {function(T):K} groupingFunction
 * @returns {Map<K,T[]>}
 */
export function groupArrayBy(array, groupingFunction) {
    const result = new Map();

    for (let i = 0; i < array.length; i++) {
        const element = array[i];

        const groupKey = groupingFunction(element);

        const group = result.get(groupKey);

        if (group === undefined) {
            result.set(groupKey, [element]);
        } else {
            group.push(element);
        }
    }

    return result;
}
