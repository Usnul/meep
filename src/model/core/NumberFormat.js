/**
 * Created by Alex on 08/08/2016.
 * @copyright Alex Goldring 2016
 */


import { assert } from "./assert.js";

/**
 *
 * @param {number} x
 * @param {string} separator
 * @returns {string}
 */
function formatNumberByThousands(x, separator) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}


/**
 *
 * @param {string} value
 * @returns {number}
 */
function countDecimals(value) {
    if (value % 1 === 0) {
        //whole number
        return 0;
    }
    const s = value.toString();
    const index = s.indexOf('.');

    if (index === -1) {
        return 0;
    }

    //find last 0
    let endIndex = s.length - 1;
    for (; endIndex > index && s.charAt(endIndex) === "0"; endIndex--) {

    }
    const result = endIndex - index;
    return result;
}

/**
 *
 * @param {number} value
 * @returns {string|number}
 */
function prettyPrint(value) {
    assert.typeOf(value, 'number', 'value');

    const MAX_DECIMALS = 2;

    const fraction = value % 1;
    if (fraction !== 0 && Math.abs(value) < 100) {
        const decimals = countDecimals(value.toFixed(MAX_DECIMALS));
        const decimalsToPrint = Math.min(decimals, MAX_DECIMALS);
        return value.toFixed(decimalsToPrint);
    } else {
        //no fraction
        return formatNumberByThousands(value - fraction, ",");
    }

}

export {
    prettyPrint,
    formatNumberByThousands
};