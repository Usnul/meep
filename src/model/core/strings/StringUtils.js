/**
 * @author Alex Goldring 2018
 * @copyright Alex Goldring 2018
 */

/**
 *
 * @param {string} string
 * @returns {number}
 */
export function computeStringHash(string) {
    if (string === null) {
        return 0;
    }

    const length = string.length;

    let hash = 0;

    for (let i = 0; i < length; i++) {
        const charCode = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + charCode;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
}

/**
 *
 * @param {string} string
 * @returns {string}
 */
export function capitalize(string) {
    const length = string.length;

    if (length === 0) {
        return string;
    } else {
        return string.charAt(0).toLocaleUpperCase() + string.substring(1);
    }
}

/**
 * @example: ['abra', 'abc', 'abode'] => 'ab'
 * @param {String[]} strings
 * @returns string
 */
export function computeCommonPrefix(strings) {
    let i, j;

    const numInputs = strings.length;

    let result = "";

    if (numInputs === 0) {
        return result;
    }

    const firstString = strings[0];

    let lengthLimit = firstString.length;

    for (i = 1; i < numInputs; i++) {
        lengthLimit = Math.min(strings[i].length, lengthLimit);
    }


    main_loop:for (i = 0; i < lengthLimit; i++) {
        const letter0 = firstString.charAt(i);

        for (j = 1; j < numInputs; j++) {

            const string = strings[j];

            const letter1 = string.charAt(i);

            if (letter0 !== letter1) {
                break main_loop;
            }
        }

        result += letter0;
    }

    return result;
}

/**
 *
 * @param {string} string
 * @returns {string}
 */
export function camelToKebab(string) {
    return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}