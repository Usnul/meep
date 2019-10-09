/**
 *
 * @enum {function(x:number):number}
 */
const TransitionFunctions = {
    Linear: linear,
    Sine: sine,
    EaseIn: easeInQuad,
    EaseOut: easeOutQuad
};


/**
 * @param {number} x
 * @returns {number}
 */
function linear(x) {
    return x;
}

/**
 * @param {number} x
 * @returns {number}
 */
function sine(x) {
    const pi_2 = Math.PI / 2;
    return Math.sin(x * pi_2);
}

/**
 *
 * @param {number} x
 * @returns {number}
 */
function easeInQuad(x) {
    return x * x;
}

/**
 *
 * @param {number} x
 * @returns {number}
 */
function easeOutQuad(x) {
    return -x * (x - 2);
}

export default TransitionFunctions;