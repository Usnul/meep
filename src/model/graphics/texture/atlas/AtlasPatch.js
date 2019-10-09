import Vector2 from "../../../core/geom/Vector2.js";
import Rectangle from "../../../core/geom/Rectangle.js";
import AABB2 from "../../../core/geom/AABB2.js";

export class AtlasPatch {
    constructor() {
        /**
         *
         * @type {Vector2}
         */
        this.position = new Vector2(0, 0);
        /**
         *
         * @type {Vector2}
         */
        this.size = new Vector2(0, 0);

        /**
         * Number of pixels to add to patch size to avoid sampling error at the edges
         * @type {number}
         */
        this.padding = 4;

        /**
         * Managed by TextureAtlas
         * @type {number}
         */
        this.id = -1;

        /**
         *
         * @type {Sampler2D|null}
         */
        this.sampler = null;

        /**
         * @type {Rectangle}
         */
        this.uv = new Rectangle(0, 0, 0, 0);

        /**
         * Used for packing inside TextureAtlas. Do not modify manually
         * @readonly
         * @protected
         * @type {AABB2}
         */
        this.packing = new AABB2();

        /**
         * bitfield
         * @type {number|AtlasPatchFlag}
         */
        this.flags = 0;
    }

    /**
     *
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    updateUV(canvasWidth, canvasHeight) {

        const size = this.size;

        const position = this.position;

        this.uv.set(
            position.x / canvasWidth,
            position.y / canvasHeight,
            size.x / canvasWidth,
            size.y / canvasHeight
        );

    }

    /**
     *
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    updatePositionFromPacking(canvasWidth, canvasHeight) {
        const patch = this;
        const box = this.packing;

        const x = box.x0 + patch.padding;
        const y = box.y0 + patch.padding;

        patch.position.set(x, y);

        this.updateUV(canvasWidth, canvasHeight)
    }

    /**
     *
     * @param {number|AtlasPatchFlag} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|AtlasPatchFlag} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|AtlasPatchFlag} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|AtlasPatchFlag} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }
}

/**
 * @readonly
 * @type {boolean}
 */
AtlasPatch.prototype.isAtlasPatch = true;
