/**
 * Created by Alex on 14/03/2016.
 */
import Vector2 from './Vector2';
import { intersects1D, overlap1D } from "../math/MathUtils";


/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @constructor
 */
function Rectangle(x = 0, y = 0, width = 0, height = 0) {

    /**
     * @type {Vector2}
     */
    this.position = new Vector2(x, y);

    /**
     * @type {Vector2}
     */
    this.size = new Vector2(width, height);
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
Rectangle.prototype.set = function set(x, y, width, height) {
    this.size.set(width, height);
    this.position.set(x, y);
};

/**
 *
 * @returns {Rectangle}
 */
Rectangle.prototype.clone = function () {
    return new Rectangle(this.position.x, this.position.y, this.size.x, this.size.y);
};

/**
 *
 * @param {Rectangle} other
 */
Rectangle.prototype.copy = function (other) {
    this.position.copy(other.position);
    this.size.copy(other.size);
};

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @returns {boolean}
 */
Rectangle.prototype._intersects = function (x0, y0, x1, y1) {
    const p = this.position;
    const s = this.size;

    const _x0 = p.x;
    const _y0 = p.y;

    return intersects1D(x0, x1, _x0, s.x + _x0) && intersects1D(y0, y1, _y0, _y0 + s.y);
};

/**
 *
 * @param {Rectangle} other
 * @returns {boolean}
 */
Rectangle.prototype.intersects = function (other) {
    const x0 = other.position.x;
    const y0 = other.position.y;
    const y1 = other.size.y + y0;
    const x1 = other.size.x + x0;
    return this._intersects(x0, y0, x1, y1);
};

/**
 *
 * @param {number}  x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @returns {boolean}
 */
Rectangle.prototype._overlaps = function (x0, y0, x1, y1) {
    const p = this.position;
    const s = this.size;

    const _x0 = p.x;
    const _y0 = p.y;

    return overlap1D(x0, x1, _x0, s.x + _x0) && overlap1D(y0, y1, _y0, _y0 + s.y);
};

Rectangle.prototype.overlaps = function (other) {
    const x0 = other.position.x;
    const y0 = other.position.y;
    const y1 = other.size.y + y0;
    const x1 = other.size.x + x0;
    return this._overlaps(x0, y0, x1, y1);
};

Rectangle.prototype._resizeToFit = function (x0, y0, x1, y1) {
    const size = this.size;

    const _x0 = this.position.x;
    const _y0 = this.position.y;

    let _y1 = size.y + _y0;
    let _x1 = size.x + _x0;

    if (Number.isNaN(_x1)) {
        _x1 = -Infinity;
    }
    if (Number.isNaN(_y1)) {
        _y1 = -Infinity;
    }

    const nX0 = Math.min(x0, _x0);
    const nY0 = Math.min(y0, _y0);
    const nX1 = Math.max(x1, _x1);
    const nY1 = Math.max(y1, _y1);

    this.position.set(nX0, nY0);
    size.set(nX1 - nX0, nY1 - nY0);
};

Rectangle.prototype.resizeToFit = function (other) {
    const x0 = other.position.x;
    const y0 = other.position.y;
    const y1 = other.size.y + y0;
    const x1 = other.size.x + x0;

    return this._resizeToFit(x0, y0, x1, y1);
};

Rectangle.prototype._contains = function (x0, y0, x1, y1) {
    const size = this.size;

    const _x0 = this.position.x;
    const _y0 = this.position.y;

    const _y1 = size.y + _y0;
    const _x1 = size.x + _x0;

    return x0 >= _x0 && x1 <= _x1 && y0 >= _y0 && y1 <= _y1;
};

Rectangle.prototype.contains = function (other) {
    const x0 = other.position.x;
    const y0 = other.position.y;
    const y1 = other.size.y + y0;
    const x1 = other.size.x + x0;

    return this._contains(x0, y0, x1, y1);
};

/**
 *
 * @param {Array.<number>|Float32Array|Float64Array|Uint8Array} target
 * @param {number} [targetOffset=0]
 */
Rectangle.prototype.toArray = function (target, targetOffset = 0) {
    target[targetOffset] = this.position.x;
    target[targetOffset + 1] = this.position.y;
    target[targetOffset + 2] = this.size.x;
    target[targetOffset + 3] = this.size.y;
};

Rectangle.prototype.toJSON = function () {
    return {
        position: this.position.toJSON(),
        size: this.size.toJSON()
    };
};

Rectangle.prototype.fromJSON = function (json) {
    this.position.fromJSON(json.position);
    this.size.fromJSON(json.size);
};

export default Rectangle;
