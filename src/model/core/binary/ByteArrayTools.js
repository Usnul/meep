/**
 * Created by Alex on 03/11/2016.
 * @author Alex Goldring
 * @author google.closure library team
 */

import { stringifyStream } from "../json/JsonUtils";

/**
 * Turns a string into an array of bytes; a "byte" being a JS number in the
 * range 0-255.
 * @param {string} str String value to arrify.
 * @return {!Uint8Array} Array of numbers corresponding to the
 *     UCS character codes of each character in str.
 */
function stringToByteArray(str) {
    const length = str.length;

    const output = [];
    let p = 0;

    for (let i = 0; i < length; i++) {
        let c = str.charCodeAt(i);
        while (c > 0xff) {
            output[p++] = c & 0xff;
            c >>= 8;
        }
        output[p++] = c;
    }

    const uint8Array = new Uint8Array(output);

    return uint8Array;
}


/**
 * Turns an array of numbers into the string given by the concatenation of the
 * characters to which the numbers correspond.
 * @param {!Uint8Array|!Array<number>} bytes Array of numbers representing
 *     characters.
 * @return {string} Stringification of the array.
 */
function byteArrayToString(bytes) {
    const numBytes = bytes.length;

    const CHUNK_SIZE = 8192;

    // Special-case the simple case for speed's sake.
    if (numBytes <= CHUNK_SIZE) {
        return String.fromCharCode.apply(null, bytes);
    }

    // The remaining logic splits conversion by chunks since
    // Function#apply() has a maximum parameter count.
    // See discussion: http://goo.gl/LrWmZ9

    let str = '';
    for (let i = 0; i < numBytes; i += CHUNK_SIZE) {
        const chunk = Array.prototype.slice.call(bytes, i, i + CHUNK_SIZE);
        str += String.fromCharCode.apply(null, chunk);
    }
    return str;
}

/**
 *
 * @param {Object} json
 * @returns {number[]}
 */
function jsonToStringToByteArray(json) {
    const output = [];
    let p = 0;

    function addToOutput(str) {
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            while (c > 0xff) {
                output[p++] = c & 0xff;
                c >>= 8;
            }
            output[p++] = c;
        }
    }

    stringifyStream(json, addToOutput);
    return output;
}


/**
 *
 * @param {string} url
 * @param {string} filename
 */
export function downloadUrlAsFile(url, filename) {
    const elem = window.document.createElement('a');
    elem.href = url;
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}

function downloadAsFile(data, filename, type = 'text/json') {

    let blobContent;

    if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
        //raw binary data
        blobContent = [data];
    } else if (data instanceof Array) {
        //already an array
        blobContent = data;
    } else if (data instanceof Blob) {
        //already a blob
        blobContent = [data];
    } else if (typeof data === "string") {
        blobContent = [data];
    } else {
        blobContent = [data]
    }

    const blob = new Blob(blobContent, { type });
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        downloadUrlAsFile(window.URL.createObjectURL(blob), filename);
    }
}

export {
    stringToByteArray,
    byteArrayToString,
    jsonToStringToByteArray,
    downloadAsFile
};
