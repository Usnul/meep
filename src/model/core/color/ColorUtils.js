/**
 * Created by Alex on 02/05/2016.
 */

/**
 *
 * @param {number} h from 0 to 1
 * @param {number} s from 0 to 1
 * @param {number} v from 0 to 1
 * @returns {{r: number, g: number, b: number}}
 */
function hsv2rgb(h, s, v) {
    let r, g, b, i, f, p, q, t;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 *
 * @param {number} r 0 to 255
 * @param {number} g 0 to 255
 * @param {number} b 0 to 255
 * @returns {{h: number, s: number, v: number}}
 */
export function rgb2hsv(r, g, b) {

    r /= 255;
    g /= 255;
    b /= 255;


    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    var h, s, v = max;

    var d = max - min;

    s = max === 0 ? 0 : d / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return {
        h,
        s,
        v
    };
}

/**
 *
 * @param {string} hex
 * @returns {{r: Number, g: Number, b: Number}} rgb
 */
function parseHex(hex) {
    function hex2dec(v) {
        return parseInt(v, 16)
    }

    return {
        r: hex2dec(hex.slice(1, 3)),
        g: hex2dec(hex.slice(3, 5)),
        b: hex2dec(hex.slice(5))
    };
}


/**
 *
 * @param r
 * @param g
 * @param b
 * @returns {string}
 */
function rgb2hex(r, g, b) {
    function dec2hex(c) {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    return dec2hex(r) + dec2hex(g) + dec2hex(b);
}

function int2rgb(value) {
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: (value) & 255
    }
}

/**
 *
 * @param {string|number} c
 * @returns {number[]} Numeric array, values are in Uint range
 */
export function parseColor(c) {
    const rgbRegEx = /rgb\(([0-9]+),([0-9]+),([0-9]+)\)/;

    const result = [];

    if (typeof c === "string") {
        const cL = c.toLowerCase();

        let match;

        if ((match = cL.match(rgbRegEx)) !== null) {
            result[0] = parseInt(match[1]);
            result[1] = parseInt(match[2]);
            result[2] = parseInt(match[3]);
        } else if (cL.startsWith('0x')) {
            const rgb = parseHex(cL);
            result[0] = rgb.r;
            result[1] = rgb.g;
            result[2] = rgb.b;
        } else {
            throw new Error(`Failed to decode color string '${c}' `);
        }
    } else {
        throw new Error(`Failed to decode color '${c}'`);
    }

    return result;
}

export {
    hsv2rgb,
    parseHex,
    rgb2hex,
    int2rgb
};