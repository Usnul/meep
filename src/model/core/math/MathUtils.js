/**
 * @author Alex Goldring
 * @copyright Alex Goldring 17/04/2016.
 */

import { assert } from "../assert.js";

/**
 * @template T
 * @param {T[]} sequence
 * @returns {function(): T}
 */
export function makeSequenceLoop(sequence) {
    let i = 0;

    const data = sequence.slice();
    const n = data.length;


    return function sequenceLoop() {
        const datum = data[i % n];

        i++;

        return datum;
    }
}

/**
 * Performs a probabilistic rounding where a fraction is rounded up or down with probability equal to the fraction
 * @param {number} number
 * @param {function} random
 * @returns {int}
 */
export function roundFair(number, random) {
    const mantissa = number % 1;
    const roll = random();
    if (roll < mantissa) {
        return Math.ceil(number);
    } else {
        return Math.floor(number);
    }
}

/**
 * Returns a random number within a normal distribution (Bell/Gaussian curve)
 * @param {int} [quality=6] controls number of "die rolls" used to approximate curve, more rolls - better approximation but higher cost of computation
 * @param {function():number} random
 * @returns {number} value between 0 and 1 with normal weight at 0.5
 */
export function randomGaussian(random, quality = 6) {
    let s = 0;

    for (let i = 0; i < quality; i++) {
        s += random();
    }

    return s / quality;
}

/**
 * @template T
 * @param {T[]} array
 * @param {function} random
 * @returns {T}
 */
export function randomFromArray(array, random) {
    const i = Math.min(array.length - 1, Math.floor(random() * array.length));

    return array[i];
}

/**
 *
 * @param {function} random
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomFloatBetween(random, min, max) {
    const span = max - min;

    const roll = random();

    return roll * span + min;
}

/**
 * Inclusive random between two boundaries, result is integer
 * @param {function} random
 * @param {number} min lower boundary, must be an integer
 * @param {number} max upper boundary, must be an integer
 * @returns {number}
 */
export function randomIntegerBetween(random, min, max) {
    const span = max - min;

    const roll = random();

    return Math.floor(roll * span + 0.999999) + min;
}

/**
 *
 * @param {function():number} random returns a number between 0 and 1
 * @param {number} min
 * @param {number} max
 * @returns {function():number} returns number between min and max
 */
export function makeRangedRandom(random, min, max) {

    if (min === 0 && max === 1) {
        //input already returns values in correct range
        return random;
    }

    const scale = max - min;
    return function () {
        return random() * scale + min;
    };
}

/**
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
    if (value < min) {
        return min;
    } else if (value > max) {
        return max;
    } else {
        return value;
    }
}

/**
 * https://gist.github.com/banksean/300494
 * @param {number} seed
 * @returns {function():number} RNG
 */
export function mersenneTwister(seed) {
    /* Period parameters */
    const N = 624;
    const M = 397;
    const MATRIX_A = 0x9908b0df;
    /* constant vector a */
    const UPPER_MASK = 0x80000000;
    /* most significant w-r bits */
    const LOWER_MASK = 0x7fffffff;
    /* least significant r bits */

    const mt = new Array(N);
    /* the array for the state vector */
    let mti = N + 1;

    /* mti==N+1 means mt[N] is not initialized */


    function init_genrand(s) {
        mt[0] = s >>> 0;
        for (mti = 1; mti < N; mti++) {
            const s = mt[mti - 1] ^ (mt[mti - 1] >>> 30);
            mt[mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253)
                + mti;
            /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
            /* In the previous versions, MSBs of the seed affect   */
            /* only MSBs of the array mt[].                        */
            /* 2002/01/09 modified by Makoto Matsumoto             */
            mt[mti] >>>= 0;
            /* for >32 bit machines */
        }
    }

    /* generates a random number on [0,0xffffffff]-interval */
    function genrand_int32() {
        let y;
        const mag01 = new Array(0x0, MATRIX_A);
        /* mag01[x] = x * MATRIX_A  for x=0,1 */

        if (mti >= N) { /* generate N words at one time */
            let kk;

            if (mti === N + 1)   /* if init_genrand() has not been called, */
                init_genrand(5489);
            /* a default initial seed is used */

            for (kk = 0; kk < N - M; kk++) {
                y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK);
                mt[kk] = mt[kk + M] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            for (; kk < N - 1; kk++) {
                y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK);
                mt[kk] = mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            y = (mt[N - 1] & UPPER_MASK) | (mt[0] & LOWER_MASK);
            mt[N - 1] = mt[M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];

            mti = 0;
        }

        y = mt[mti++];

        /* Tempering */
        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >>> 18);

        return y >>> 0;
    }

    init_genrand(seed);

    function random() {
        return genrand_int32() * (1.0 / 4294967296.0);
    }

    return random;
}

/**
 *
 * @param {number} seed
 * @returns {function}
 */
export function seededRandom(seed) {
    /**
     *
     * @returns {number}
     */
    function random() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    /**
     *
     * @returns {number}
     */
    random.getCurrentSeed = function () {
        return seed;
    };

    random.setCurrentSeed = function (v) {
        assert.typeOf(v, 'number', 'v');

        seed = v;
    };

    return random;
}

/**
 *
 * @param {number} product
 * @param {number} limit
 * @returns {number}
 */
export function computeWholeDivisorLow(product, limit) {
    assert.typeOf(product, 'number', 'product');
    assert.typeOf(limit, 'number', 'limit');


    assert.ok(Number.isInteger(product), `expected product to be an integer, instead got '${product}'`);
    assert.ok(Number.isInteger(limit), `expected limit to be an integer, instead got '${limit}'`);

    let i = limit;

    while (i > 1) {

        if (product % i === 0) {
            break;
        }

        i--;

    }

    return i;
}


/**
 *
 * Returns highest value out of 2 supplied
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function max2(a, b) {
    if (a < b) {
        return b;
    } else {
        return a;
    }
}

/**
 * Returns lowest value out of 3 supplied
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function min2(a, b) {

    if (a < b) {
        return a;
    } else {
        return b;
    }
}

/**
 * Returns highest value out of 3 supplied
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @returns {number}
 */
export function max3(a, b, c) {

    let v = a;
    if (v < b) {
        v = b;
    }
    if (v < c) {
        v = c;
    }
    return v;
}

/**
 * Returns lowest value out of 3 supplied
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @returns {number}
 */
export function min3(a, b, c) {

    let v = a;
    if (v > b) {
        v = b;
    }
    if (v > c) {
        v = c;
    }
    return v;
}

/**
 *
 * @param {Number} t
 * @param {Number} p0
 * @param {Number} p1
 * @param {Number} p2
 * @return {number}
 */
export function quadraticCurve(t, p0, p1, p2) {
    return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

/**
 *
 * @param {Number} p0
 * @param {Number} p1
 * @param {Number} p2
 * @param {Number} p3
 * @return {function(number): Number}
 */
export function makeCubicCurve(p0, p1, p2, p3) {
    return function (v) {
        return cubicCurve(v, p0, p1, p2, p3);
    }
}

/**
 *
 * @param {Number} t
 * @param {Number} p0
 * @param {Number} p1
 * @param {Number} p2
 * @param {Number} p3
 * @return {Number}
 */
export function cubicCurve(t, p0, p1, p2, p3) {
    /**
     *
     * @type {number}
     */
    const cX = 3 * (p1 - p0);

    /**
     *
     * @type {number}
     */
    const bX = 3 * (p2 - p1) - cX;

    /**
     *
     * @type {number}
     */
    const aX = p3 - p0 - cX - bX;


    return (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0;
}

/**
 *
 * @param {number} v
 * @returns {number}
 */
export function computeHashFloat(v) {
    //  we use sin function to force an unknown number into a known range and then scale it to maximum 32bit integer value
    return Math.sin(v) * 1367130550;
}

/**
 *
 * @param {number[]} values
 * @param {number} min
 * @param {number} max
 */
export function computeHashFloatArray(values, min, max) {
    const dataLength = values.length;

    const dataRange = max - min;

    /*
     hash min and max
     */
    const minHash = computeHashFloat(min);
    const maxHash = computeHashFloat(min);

    let hash = ((minHash << 5) - minHash) + maxHash;

    for (let i = 0; i < dataLength; i++) {
        const singleValue = values[i];
        //normalize value
        const valueNormalized = (singleValue - min) / dataRange;
        //scale value to integer range
        const integerValue = valueNormalized * 4294967295;

        hash = ((hash << 5) - hash) + integerValue;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
}

/**
 * @template T
 * @param {T[]} array
 * @param {function(T):number} elementHashFunction
 */
export function computeHashArray(array, elementHashFunction) {
    let hash = 0;
    const numArguments = array.length;
    for (let i = 0; i < numArguments; i++) {

        const singleValue = array[i];

        const elementHash = elementHashFunction(singleValue);

        hash = ((hash << 5) - hash) + elementHash;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

/**
 * Computes hash on integer values
 * @param {...number} value
 * @returns {number}
 */
export function computeHashIntegerArray(value) {
    let hash = 0;
    const numArguments = arguments.length;
    for (let i = 0; i < numArguments; i++) {
        const singleValue = arguments[i];
        hash = ((hash << 5) - hash) + singleValue;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

/**
 *
 * @param {number} v
 * @returns {number} +1 if v>0, 0 if v == 0, -1 if v<0
 */
export function sign(v) {
    return v > 0 ? 1 : (v < 0 ? -1 : 0);
}

/**
 * Returns a value with the magnitude of x and the sign of y.
 * NOTE: a port of c++ method from tgmath.h
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function copysign(x, y) {
    if ((x > 0 && y > 0) || (x < 0 && y < 0)) {
        //preserve sign
        return x;
    } else {
        //inverse sign
        return -x;
    }
}

/**
 * Linear interpolation between two values controlled by a given fraction
 * @param {Number} a
 * @param {Number} b
 * @param {Number} fraction Floating point value between 0 and 1
 * @return {Number}
 */
export function lerp(a, b, fraction) {
    return (b - a) * fraction + a;
}

/**
 * Compute fraction of linear interpolation
 * @param {number} a
 * @param {number} b
 * @param {number} value
 * @returns {number} fraction
 */
export function inverseLerp(a, b, value) {
    const range = b - a;
    const scaledValue = value - a;

    if (range === 0) {
        //avoid division by zero error
        return 0;
    }

    const fraction = scaledValue / range;

    return fraction;
}

/**
 * Exclusive test, boundaries are not included in positive test
 * @param {Number} value
 * @param {Number} v0
 * @param {Number} v1
 * @returns {boolean}
 */
export function isValueBetween(value, v0, v1) {
    return (v0 > value && value > v1) || (v1 > value && value > v0);
}

/**
 * Inclusive test, boundaries are included in positive test
 * @param {Number} value
 * @param {Number} v0
 * @param {Number} v1
 * @returns {boolean}
 */
export function isValueBetweenInclusive(value, v0, v1) {
    return (v0 >= value && value >= v1) || (v1 >= value && value >= v0);
}


/**
 * Return solutions for quadratic
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @returns {number[]|null}
 */
export function solveQuadratic(a, b, c) {
    let sol = null;
    if (Math.abs(a) < 1e-6) {
        if (Math.abs(b) < 1e-6) {
            sol = Math.abs(c) < 1e-6 ? [0, 0] : null;
        } else {
            sol = [-c / b, -c / b];
        }
    } else {
        let disc = b * b - 4 * a * c;
        if (disc >= 0) {
            disc = Math.sqrt(disc);
            a = 2 * a;
            sol = [(-b - disc) / a, (-b + disc) / a];
        }
    }
    return sol;
}

/**
 * Produces a proportional mix of 2 values, a*(1-portion) + b*portion
 * @param {number} a
 * @param {number} b
 * @param {number} portion
 * @returns {number}
 */
export function mix(a, b, portion) {
    return a * (1 - portion) + b * portion;
}

/**
 *
 * @param {number} side length of the side
 * @param {number} base length of the base
 * @returns {number}
 */
export function computeIsoscelesTriangleApexAngle(side, base) {
    const b2 = base * base;
    const s2 = side * side;

    const upper = (2 * s2 - b2);
    const lower = (2 * s2);

    const cosAlpha = upper / lower;

    return Math.acos(cosAlpha);
}

/**
 * Comparison of two numbers with a given tolerance
 * @param {number} a
 * @param {number} b
 * @param {number} tolerance
 * @returns {boolean}
 */
export function epsilonEquals(a, b, tolerance) {
    assert.equal(typeof a, 'number', `a must be a number, instead was '${typeof a}'`);
    assert.equal(typeof b, 'number', `a must be a number, instead was '${typeof b}'`);
    assert.equal(typeof tolerance, 'number', `a must be a number, instead was '${typeof tolerance}'`);

    return Math.abs(a - b) <= tolerance;
}

/**
 * Returns true if two 1D lines intersect, touch is treated as intersection
 * Parameters are assumed to be ordered, a1 >= a0, b1 >= b0
 * @param {Number} a0
 * @param {Number} a1
 * @param {Number} b0
 * @param {Number} b1
 * @returns {boolean}
 */
export function intersects1D(a0, a1, b0, b1) {
    assert.equal(typeof a0, "number");
    assert.equal(typeof a1, "number");
    assert.equal(typeof b0, "number");
    assert.equal(typeof b1, "number");

    return a1 >= b0 && b1 >= a0;
}

/**
 * Returns true if two 1D lines overlap, touch is not considered overlap
 * Parameters are assumed to be ordered, a1 > a0, b1 > b0
 * @param {Number} a0
 * @param {Number} a1
 * @param {Number} b0
 * @param {Number} b1
 * @returns {boolean}
 */
export function overlap1D(a0, a1, b0, b1) {
    assert.equal(typeof a0, "number");
    assert.equal(typeof a1, "number");
    assert.equal(typeof b0, "number");
    assert.equal(typeof b1, "number");

    return a1 > b0 && b1 > a0;
}

/**
 * Returns a number representing overlap distance between two 1D line segments.
 * Positive number indicates overlap, negative number indicates that segments do not overlap; 0 indicates that segments are touching.
 * @param {Number} a0
 * @param {Number} a1
 * @param {Number} b0
 * @param {Number} b1
 * @returns {number}
 */
export function separation1D(a0, a1, b0, b1) {
    assert.equal(typeof a0, "number");
    assert.equal(typeof a1, "number");
    assert.equal(typeof b0, "number");
    assert.equal(typeof b1, "number");

    return min2(a1, b1) - max2(a0, b0);
}

/**
 * Pi*2
 * @type {number}
 */
export const PI2 = Math.PI * 2;

/**
 * Pi/2
 * @type {number}
 */
export const PI_HALF = Math.PI / 2;

/**
 * Very small value, used for comparison when compensation for rounding error is required
 * @type {number}
 */
export const EPSILON = 0.000001;
