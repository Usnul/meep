import Rectangle from "../../../model/core/geom/Rectangle.js";
import AABB2 from "../../../model/core/geom/AABB2.js";

/**
 *
 * @param {Element} el
 * @param {number} depth
 * @param {AABB2} aabb
 */
export function resizeAABB2ToFitBoundingClientRect(el, depth, aabb) {

    /**
     *
     * @type {ClientRect | DOMRect}
     */
    const rect = el.getBoundingClientRect();

    if (rect.width !== 0) {
        //make sure element has dimensions
        if (rect.left < aabb.x0) {
            aabb.x0 = rect.left;
        }

        if (rect.right > aabb.x1) {
            aabb.x1 = rect.right;
        }
    }

    if (rect.height !== 0) {
        //make sure element has dimensions
        if (rect.top < aabb.y0) {
            aabb.y0 = rect.top;
        }

        if (rect.bottom > aabb.y1) {
            aabb.y1 = rect.bottom;
        }
    }

    if (depth > 0) {
        const children = el.children;

        for (let i = 0, l = children.length; i < l; i++) {
            const child = children[i];

            resizeAABB2ToFitBoundingClientRect(child, depth - 1, aabb);
        }
    }
}

export class DomSizeObserver {
    /**
     *
     * @param {number} [depth=0] how deep should the observation go
     */
    constructor({ depth = 0 } = {}) {
        const rectangle = new Rectangle();

        this.dimensions = rectangle;

        const aabb = new AABB2();

        function update() {

            aabb.setNegativelyInfiniteBounds();

            resizeAABB2ToFitBoundingClientRect(self.element, depth, aabb);

            rectangle.position.set(aabb.x0, aabb.y0);
            rectangle.size.set(aabb.getWidth(), aabb.getHeight());
        }

        const self = this;

        this.running = false;

        function cycle() {
            if (self.running) {
                update();
                requestAnimationFrame(cycle);
            }
        }

        this.cycle = cycle;
    }

    start() {
        if (this.running) {
            // already running
            return;
        }

        this.running = true;

        this.cycle();
    }

    /**
     *
     * @param {Element} element
     */
    attach(element) {
        this.element = element;
    }

    stop() {
        this.running = false;
    }
}