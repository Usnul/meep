/**
 * Created by Alex on 22/02/2017.
 */

class Storage {
    constructor() {

    }

    /**
     *
     * @param {string} key
     * @param {ArrayBuffer} value
     * @param {function} resolve
     * @param {function} reject
     * @param {function} progress
     */
    storeBinary(key, value, resolve, reject, progress) {
        //special case, delegate to generic by default
        this.store(key, value, resolve, reject, progress);
    }

    loadBinary(key, resolve, reject, progress) {
        //special case, delegate to generic by default
        this.load(key, resolve, reject, progress);
    }

    store(key, value, resolve, reject, progress) {
        throw new Error(`Not Implemented`);
    }

    load(key, resolve, reject, progress) {
        throw new Error(`Not Implemented`);
    }

    list(resolve, reject) {
        throw new Error(`Not Implemented`);
    }

    contains(key, resolve, reject) {
        let resolved = false;
        this.list(function (keys) {
            resolve(keys.indexOf(key) !== -1);
        }, reject);
    }
}

export default Storage;
