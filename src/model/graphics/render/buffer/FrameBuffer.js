import Vector2 from "../../../core/geom/Vector2.js";
import { WebGLRenderTarget } from "three";

export class FrameBuffer {
    /**
     *
     * @param {string} id
     * @constructor
     */
    constructor(id) {
        /**
         *
         * @type {string}
         */
        this.id = id;

        /**
         * is expected to be bound during initialization
         * @type {WebGLRenderTarget}
         */
        this.renderTarget = null;

        /**
         * Number of users of the frame buffer
         * @type {number}
         */
        this.referenceCount = 0;

        /**
         *
         * @type {FrameBuffer[]}
         */
        this.dependencies = [];

        /**
         * Size of the frame buffer in pixels
         * @type {Vector2}
         */
        this.size = new Vector2(0, 0);

    }

    /**
     * Gets called once before frame buffer is used for the first time
     * @param {WebGLRenderer} renderer
     */
    initialize(renderer) {
        //override this method as needed
    }

    /**
     * Gets called after frame buffer is no longer needed. Frame buffer becomes unusable afterwards
     * @param {WebGLRenderer} renderer
     */
    finalize(renderer) {
        //override this method as needed
    }

    /**
     * This method is used to populate FrameBuffer with data. Typically this is done every frame.
     * @param {WebGLRenderer} renderer
     * @param {Camera} camera
     * @param {Scene} scene
     */
    render(renderer, camera, scene) {
        const oldRenderTarget = renderer.getRenderTarget();

        renderer.setRenderTarget(this.renderTarget);
        renderer.clear();

        renderer.render(scene, camera);

        renderer.setRenderTarget(oldRenderTarget);
    }

    /**
     *
     * @param {number} x width
     * @param {number} y height
     */
    setSize(x, y) {
        if (x !== this.size.x || y !== this.size.y) {
            this.renderTarget.setSize(x, y);

            this.size.set(x, y);
        }
    }
}

