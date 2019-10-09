import Vector2 from "./Vector2";


/**
 * A circle or a 2-dimensional sphere. Represented as a position (x,y) and radius (r)
 * @param {Number} [x=0]
 * @param {Number} [y=0]
 * @param {Number} [r=0]
 * @constructor
 */
function Circle(x = 0, y = 0, r = 0) {
    /**
     * Position along X axis
     * @type {Number}
     */
    this.x = x;

    /**
     * Position along Y axis
     * @type {Number}
     */
    this.y = y;

    /**
     * Radius
     * @type {Number}
     */
    this.r = r;
}

/**
 *
 * @param {Vector2} target
 */
Circle.prototype.readPosition = function (target) {
    target.set(this.x, this.y);
};

/**
 *
 * @param {Number} deltaX
 * @param {Number} deltaY
 */
Circle.prototype.move = function (deltaX, deltaY) {
    this.x += deltaX;
    this.y += deltaY;
};

/**
 *
 * @param {Circle} other
 * @returns {boolean}
 */
Circle.prototype.overlaps = function (other) {
    const x0 = this.x;
    const y0 = this.y;
    const r0 = this.r;

    const x1 = other.x;
    const y1 = other.y;
    const r1 = other.r;

    const minSeparation = r0 + r1;

    const distance = Vector2._distance(x0, y0, x1, y1);

    return distance < minSeparation;
};

/**
 *
 * @param {Circle} other
 * @returns {boolean}
 */
Circle.prototype.equals = function (other) {
    return this.x === other.x && this.y === other.y && this.r === other.r;
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} r
 */
Circle.prototype.set = function (x, y, r) {
    this.x = x;
    this.y = y;

    this.r = r;
};

/**
 *
 * @param {Circle} other
 */
Circle.prototype.copy = function (other) {
    this.set(other.x, other.y, other.r);
};

/**
 *
 * @returns {Circle}
 */
Circle.prototype.clone = function () {
    const result = new Circle(this.x, this.y, this.r);

    return result;
};

export default Circle;