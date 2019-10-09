/**
 * @template V
 * @param {Object<V>} object
 * @param {V} value
 * @returns {string}
 */
export function objectKeyByValue(object, value) {
    for (let i in object) {
        if (object[i] === value) {
            return i;
        }
    }

    return undefined;
}