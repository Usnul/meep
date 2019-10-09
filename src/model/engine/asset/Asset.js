/**
 *
 * @param {string} path
 * @param {string} type
 * @constructor
 */
import { computeStringHash } from "../../core/strings/StringUtils.js";
import { computeHashIntegerArray } from "../../core/math/MathUtils.js";
import { assert } from "../../core/assert.js";

/**
 *
 * @param {string} path
 * @param {string} type
 * @constructor
 */
function AssetDescription(path, type) {
    assert.typeOf(path, 'string', 'path');
    assert.typeOf(type, 'string', 'type');

    /**
     * @type {string}
     */
    this.path = path;
    /**
     * @type {string}
     */
    this.type = type;
}

/**
 *
 * @param {AssetDescription} other
 * @returns {boolean}
 */
AssetDescription.prototype.equals = function (other) {
    return this.path === other.path && this.type === other.type;
};

/**
 *
 * @returns {number}
 */
AssetDescription.prototype.hash = function () {
    return computeHashIntegerArray(
        computeStringHash(this.path),
        computeStringHash(this.type)
    );
};


/**
 * @template T
 * @param {function():T} factory
 * @param {number} byteSize byte size of the asset in RAM
 * @constructor
 */
function Asset(factory, byteSize) {
    /**
     *
     * @type {function(): T}
     */
    this.factory = factory;

    /**
     *
     * @type {number}
     */
    this.byteSize = byteSize;

    /**
     *
     * @type {Array.<AssetDescription>}
     */
    this.dependencies = [];

    /**
     *
     * @type {AssetDescription}
     */
    this.description = null;
}

/**
 *
 * @returns {T}
 */
Asset.prototype.create = function () {
    return this.factory();
};

export { Asset, AssetDescription };