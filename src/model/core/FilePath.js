/**
 * Strips all directories from the path.
 * @example 'a/b/c' -> 'c'
 * @param {string} path
 * @returns {string}
 */
function computePathBase(path) {
    if (typeof path !== "string") {
        throw new Error('path is not a string');
    }

    const lastSlashIndex = path.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
        return path.substring(lastSlashIndex + 1);
    } else {
        return path;
    }
}

/**
 *
 * @param {string} path
 * @returns {String|null}
 */
function computeFileExtension(path) {
    if (typeof path !== "string") {
        throw new Error('path is not a string');
    }

    //get base
    const pathBase = computePathBase(path);

    const lastDotIndex = pathBase.lastIndexOf('.');

    if (lastDotIndex !== -1) {
        return pathBase.substring(lastDotIndex + 1);
    } else {
        //no extension
        return null;
    }
}

export {
    computePathBase,
    computeFileExtension
};