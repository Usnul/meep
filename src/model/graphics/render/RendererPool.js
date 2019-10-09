import { WebGLRenderer } from 'three';

function WebGLRendererPool() {
    this.used = new Set();
}

WebGLRendererPool.prototype.get = function (options) {
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.used.add(renderer);
    return renderer;
};

/**
 *
 * @param {THREE.WebGLRenderer} renderer
 * @returns {boolean}
 */
WebGLRendererPool.prototype.release = function (renderer) {
    if (!this.used.has(renderer)) {
        //not from this pool
        return false;
    }
    this.used.delete(renderer);

    renderer.forceContextLoss();
    renderer.dispose();
    renderer.domElement = null;

    return true;
};

WebGLRendererPool.global = new WebGLRendererPool();


export {
    WebGLRendererPool
};
