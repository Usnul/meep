/**
 * Created by Alex on 08/08/2016.
 * @copyright Alex Goldring 2016
 */


import { clamp } from '../math/MathUtils';
import LineSegment2 from "./LineSegment2";
import Vector2 from "./Vector2";
import { assert } from "../assert.js";
import { max2, min2 } from "../math/MathUtils.js";

/**
 *
 * Axis-Aligned Bounding Box 2D
 */
class AABB2 {
    /**
     * @param {Number} [x0=0]
     * @param {Number} [y0=0]
     * @param {Number} [x1=0]
     * @param {Number} [y1=0]
     * @constructor
     */
    constructor(x0 = 0, y0 = 0, x1 = 0, y1 = 0) {
        assert.equal(typeof x0, "number", `x0 must be of type "number", instead was "${typeof x0}"`);
        assert.equal(typeof y0, "number", `y0 must be of type "number", instead was "${typeof y0}"`);
        assert.equal(typeof x1, "number", `x1 must be of type "number", instead was "${typeof x1}"`);
        assert.equal(typeof y1, "number", `y1 must be of type "number", instead was "${typeof y1}"`);

        assert.ok(!Number.isNaN(x0), `x0 must be a valid number, instead was NaN`);
        assert.ok(!Number.isNaN(y0), `y0 must be a valid number, instead was NaN`);
        assert.ok(!Number.isNaN(x1), `x1 must be a valid number, instead was NaN`);
        assert.ok(!Number.isNaN(y1), `y1 must be a valid number, instead was NaN`);

        /**
         *
         * @type {Number}
         */
        this.x0 = x0;
        /**
         *
         * @type {Number}
         */
        this.y0 = y0;
        /**
         *
         * @type {Number}
         */
        this.x1 = x1;
        /**
         *
         * @type {Number}
         */
        this.y1 = y1;
    }

    /**
     *  Expands box in every direction by a given amount
     * @param {number} size
     */
    grow(size) {
        this.set(this.x0 - size, this.y0 - size, this.x1 + size, this.y1 + size);
    }

    /**
     * Shrinks the box in every direction by a given amount
     * @param {number} size
     */
    shrink(size) {
        this.grow(-size);
    }

    /**
     *
     * @param {number} value
     */
    multiplyScalar(value) {
        this.set(
            this.x0 * value,
            this.y0 * value,
            this.x1 * value,
            this.y1 * value
        );
    }

    /**
     *
     * @param {AABB2} other
     * @param {AABB2} result Overlapping region will be written here
     * @returns {boolean} true if there is overlap, result is also written. false otherwise
     */
    computeOverlap(other, result) {
        const ax0 = this.x0;
        const ay0 = this.y0;
        const ax1 = this.x1;
        const ay1 = this.y1;

        const bx0 = other.x0;
        const by0 = other.y0;
        const bx1 = other.x1;
        const by1 = other.y1;

        return computeOverlap(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1, result);
    }

    /**
     *
     * @param {Number} x0
     * @param {Number} y0
     * @param {Number} x1
     * @param {Number} y1
     * @public
     */
    _expandToFit(x0, y0, x1, y1) {
        this.x0 = Math.min(this.x0, x0);
        this.y0 = Math.min(this.y0, y0);
        this.x1 = Math.max(this.x1, x1);
        this.y1 = Math.max(this.y1, y1);
    }

    /**
     * retrieve midpoint of AABB along X axis
     * @returns {number}
     */
    midX() {
        return (this.x1 + this.x0) / 2;
    }

    /**
     * retrieve midpoint of AABB along Y axis
     * @returns {number}
     */
    midY() {
        return (this.y1 + this.y0) / 2;
    }

    /**
     *
     * @param {Vector2} p0
     * @param {Vector2} p1
     * @param {Vector2} result
     * @returns {boolean}
     */
    lineIntersectionPoint(p0, p1, result) {
        const x0 = this.x0;
        const y0 = this.y0;
        const x1 = this.x1;
        const y1 = this.y1;

        if (LineSegment2.intersectionPointRaw(p0.x, p0.y, p1.x, p1.y, x0, y0, x1, y0, result)) {
            //top
            return true;
        }
        if (LineSegment2.intersectionPointRaw(p0.x, p0.y, p1.x, p1.y, x0, y1, x1, y1, result)) {
            //bottom
            return true;
        }
        if (LineSegment2.intersectionPointRaw(p0.x, p0.y, p1.x, p1.y, x0, y0, x0, y1, result)) {
            //left
            return true;
        }
        if (LineSegment2.intersectionPointRaw(p0.x, p0.y, p1.x, p1.y, x1, y0, x1, y1, result)) {
            //right
            return true;
        }

        return false;
    }

    /**
     *
     * @param {Vector2} point
     * @param {Vector2} result
     */
    computeNearestPointToPoint(point, result) {
        let x, y;


        const x0 = this.x0;
        const y0 = this.y0;
        const x1 = this.x1;
        const y1 = this.y1;

        const pX = point.x;
        const pY = point.y;


        x = clamp(pX, x0, x1);
        y = clamp(pY, y0, y1);

        result.set(x, y);
    }

    /**
     *
     * @param {AABB2} other
     * @returns {number}
     */
    costForInclusion(other) {
        return this._costForInclusion(other.x0, other.y0, other.x1, other.y1);
    }

    /**
     *
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @returns {number}
     */
    _costForInclusion(x0, y0, x1, y1) {
        let x = 0;
        let y = 0;
        //
        const _x0 = this.x0;
        const _y0 = this.y0;
        const _x1 = this.x1;
        const _y1 = this.y1;
        //
        if (_x0 > x0) {
            x += _x0 - x0;
        }
        if (_x1 < x1) {
            x += x1 - _x1;
        }
        if (_y0 > y0) {
            y += _y0 - y0;
        }
        if (_y1 < y1) {
            y += y1 - _y1;
        }

        const dx = _x1 - _x0;
        const dy = _y1 - _y0;

        return x * dy + y * dx;
    }

    /**
     *
     * @returns {number}
     */
    computeArea() {
        const x0 = this.x0;
        const y0 = this.y0;
        const x1 = this.x1;
        const y1 = this.y1;

        const dx = x1 - x0;
        const dy = y1 - y0;

        return dx * dy;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    containsPoint(x, y) {
        return x >= this.x0 && x <= this.x1 && y >= this.y0 && y <= this.y1;
    }

    /**
     *
     * @param {AABB2} other
     */
    expandToFit(other) {
        this._expandToFit(other.x0, other.y0, other.x1, other.y1);
    }

    /**
     *
     * @returns {number}
     */
    getWidth() {
        return this.x1 - this.x0;
    }

    /**
     *
     * @returns {number}
     */
    getHeight() {
        return this.y1 - this.y0;
    }

    /**
     *
     * @param {Number} x0
     * @param {Number} y0
     * @param {Number} x1
     * @param {Number} y1
     * returns {AABB2} this
     */
    set(x0, y0, x1, y1) {
        assert.equal(typeof x0, "number", `x0 must be of type "number", instead was "${typeof x0}"`);
        assert.equal(typeof y0, "number", `y0 must be of type "number", instead was "${typeof y0}"`);
        assert.equal(typeof x1, "number", `x1 must be of type "number", instead was "${typeof x1}"`);
        assert.equal(typeof y1, "number", `y1 must be of type "number", instead was "${typeof y1}"`);

        assert.ok(!Number.isNaN(x0), `x0 must be a valid number, instead was NaN`);
        assert.ok(!Number.isNaN(y0), `y0 must be a valid number, instead was NaN`);
        assert.ok(!Number.isNaN(x1), `x1 must be a valid number, instead was NaN`);
        assert.ok(!Number.isNaN(y1), `y1 must be a valid number, instead was NaN`);

        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;

        return this;
    }

    /**
     * Relative displacement of the AABB by given vector described by {@param deltaX} and {@param deltaY}
     * @param {number} deltaX
     * @param {number} deltaY
     */
    move(deltaX, deltaY) {
        this.set(this.x0 + deltaX, this.y0 + deltaY, this.x1 + deltaX, this.y1 + deltaY);
    }

    /**
     *
     * @returns {AABB2}
     */
    clone() {
        return new AABB2(this.x0, this.y0, this.x1, this.y1);
    }

    /**
     *
     * @param {AABB2} other
     * @returns {AABB2} this
     */
    copy(other) {
        return this.set(other.x0, other.y0, other.x1, other.y1);
    }

    /**
     *
     * @param {AABB2} other
     * @returns {boolean}
     */
    equals(other) {
        return this.x0 === other.x0 && this.y0 === other.y0 && this.x1 === other.x1 && this.y1 === other.y1;
    }

    /**
     * Clamps AABB to specified region
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     */
    clamp(x0, y0, x1, y1) {
        this.x0 = clamp(this.x0, x0, x1);
        this.y0 = clamp(this.y0, y0, y1);

        this.x1 = clamp(this.x1, x0, x1);
        this.y1 = clamp(this.y1, y0, y1);
    }


    /**
     * returns {AABB2}
     */
    setNegativelyInfiniteBounds() {
        return this.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    }

    toString() {
        return `AABB2{x0:${this.x0}, y0:${this.y0}, x1:${this.x1}, y1:${this.y1}}`;
    }

    toJSON() {
        return {
            x0: this.x0,
            y0: this.y0,
            x1: this.x1,
            y1: this.y1
        };
    }

    fromJSON(json) {
        this.set(json.x0, json.y0, json.x1, json.y1);
    }
}


/**
 *
 * @param {AABB2} b0
 * @param {AABB2} b1
 * @param {Vector2} p0 resulting line segment point
 * @param {Vector2} p1 resulting line segment point
 */
function computeLineBetweenTwoBoxes(b0, b1, p0, p1) {
    //compute box centers
    const c0 = new Vector2(b0.midX(), b0.midY());
    const c1 = new Vector2(b1.midX(), b1.midY());

    const i0 = b0.lineIntersectionPoint(c0, c1, p0);
    const i1 = b1.lineIntersectionPoint(c0, c1, p1);

    if (!i0) {
        console.error("No intersection point: ", b0, c0, c1);
    }

    if (!i1) {
        console.error("No intersection point: ", b1, c0, c1);
    }
}

AABB2.computeLineBetweenTwoBoxes = computeLineBetweenTwoBoxes;

/**
 *
 * @param {number} ax0
 * @param {number} ay0
 * @param {number} ax1
 * @param {number} ay1
 * @param {number} bx0
 * @param {number} by0
 * @param {number} bx1
 * @param {number} by1
 * @returns {boolean} true if overlap exists, false if no overlap
 */
export function aabb2_overlapExists(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1) {

    const x0 = max2(ax0, bx0);
    const x1 = min2(ax1, bx1);

    if (x0 >= x1) {
        //no overlap
        return false;
    }

    const y0 = max2(ay0, by0);
    const y1 = min2(ay1, by1);

    if (y0 >= y1) {
        //no overlap
        return false;
    }

    return true;
}

/**
 *
 * @param {number} ax0
 * @param {number} ay0
 * @param {number} ax1
 * @param {number} ay1
 * @param {number} bx0
 * @param {number} by0
 * @param {number} bx1
 * @param {number} by1
 * @param {AABB2} result
 * @returns {boolean} true if overlap exists, false if no overlap
 */
function computeOverlap(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1, result) {
    const x0 = max2(ax0, bx0);
    const x1 = min2(ax1, bx1);

    if (x0 >= x1) {
        //no overlap
        return false;
    }

    const y0 = max2(ay0, by0);
    const y1 = min2(ay1, by1);

    if (y0 >= y1) {
        //no overlap
        return false;
    }

    result.set(x0, y0, x1, y1);

    return true;
}


export default AABB2;
