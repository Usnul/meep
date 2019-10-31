import Vector2 from "../../../model/core/geom/Vector2.js";

export class MinimapWorldLayer {
    constructor() {
        this.needsUpdate = true;
        this.needsRender = false;

        this.object = null;

        this.viewportSize = new Vector2();
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     */
    setViewportSize(x, y) {
        this.viewportSize.set(x, y);
    }

    startup() {

    }

    shutdown() {

    }

    update() {

    }
}
