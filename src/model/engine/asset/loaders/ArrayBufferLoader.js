import { Asset } from "../Asset.js";

/**
 *
 * @param {string} path
 * @param {function(Asset)} success
 * @param {function} failure
 * @param {function} progress
 */
export function loadArrayBuffer(path, success, failure, progress) {

    const xhr = new XMLHttpRequest();
    xhr.open('GET', path, true);
    xhr.responseType = "arraybuffer";

    xhr.addEventListener('load', function () {
        if (xhr.readyState === xhr.DONE && xhr.status === 200) {
            const arrayBuffer = xhr.response;
            const asset = new Asset(
                function () {
                    return arrayBuffer;
                },
                arrayBuffer.byteSize
            );

            success(asset);
        } else {
            failure(xhr);
        }
    }, false);

    xhr.addEventListener('error', failure, false);

    xhr.send();
}