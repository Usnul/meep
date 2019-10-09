import { assert } from "../../../core/assert.js";

export function FrameBufferManager() {
    /**
     *
     * @type {FrameBuffer[]}
     */
    this.buffers = [];

    /**
     *
     * @type {boolean}
     */
    this.needsRebuild = false;

    /**
     *
     * @type {FrameBuffer[]}
     */
    this.orderedBuffers = [];

    /**
     *
     * @type {number}
     */
    this.pixelRatio = 1;
}

/**
 *
 * @param {WebGLRenderer} renderer
 */
FrameBufferManager.prototype.initialize = function (renderer) {
    assert.notEqual(renderer, undefined, 'renderer is undefined');
    assert.notEqual(renderer, null, 'renderer is null');

    for (const b of this.buffers) {
        b.initialize(renderer);

        //expect render target to be set
        if (typeof b.renderTarget !== 'object') {
            throw new Error(`renderTarget was expected to be of type 'object', instead was '${typeof b.renderTarget}'`)
        }

        if (b.renderTarget.isWebGLRenderTarget !== true) {
            throw new Error(`renderTarget.isWebGLRenderTarget must be true, instead was '${b.renderTarget.isWebGLRenderTarget}'`);
        }
    }
};

FrameBufferManager.prototype.build = function () {
    this.orderedBuffers = this.computeRenderOrder();

    this.needsRebuild = false;
};

/**
 *
 * @returns {FrameBuffer[]}
 */
FrameBufferManager.prototype.computeRenderOrder = function () {
    const openSet = this.buffers.slice();

    const result = [];

    /**
     *
     * @param {FrameBuffer} buffer
     */
    function dependenciesSatisfied(buffer) {
        const dependencies = buffer.dependencies;
        for (let i = 0; i < dependencies.length; i++) {
            const frameBuffer = dependencies[i];

            if (result.indexOf(frameBuffer) === -1) {
                //buffer has not been assigned yet
                return false;
            }
        }

        //all dependencies satisfied
        return true;
    }


    let openSetCount = openSet.length;
    while (openSetCount > 0) {
        //remember number of buffers in the open set
        const openSetCountBefore = openSetCount;

        for (let i = 0; i < openSetCount; i++) {
            const frameBuffer = openSet[i];
            if (dependenciesSatisfied(frameBuffer)) {
                result.push(frameBuffer);
                openSet.splice(i, 1);

                //update iteration variables
                i--;
                openSetCount--;
            }
        }

        if (openSetCountBefore === openSetCount) {
            //no buffers allocated in this pass
            throw new Error(`dependencies could not be satisfied for ${openSetCount} buffers`);
        }
    }

    return result;
};

/**
 *
 * @param {string} id
 * @returns {FrameBuffer|undefined}
 */
FrameBufferManager.prototype.getById = function (id) {
    return this.buffers.find(function (buffer) {
        return buffer.id === id;
    });
};

/**
 *
 * @param {FrameBuffer} buffer
 */
FrameBufferManager.prototype.add = function (buffer) {
    const existing = this.getById(buffer.id);

    if (existing !== undefined) {
        throw new Error(`Failed to add buffer. Another buffer with id='${buffer.id}' already exists`);
    }

    this.buffers.push(buffer);

    //mark for rebuild
    this.needsRebuild = true;
};

FrameBufferManager.prototype.update = function () {
    if (this.needsRebuild) {
        this.build();
    }
};

/**
 *
 * @param {WebGLRenderer} renderer
 * @param {Camera} camera
 * @param {Scene} scene
 */
FrameBufferManager.prototype.render = function (renderer, camera, scene) {
    this.update();

    const buffers = this.orderedBuffers;

    const numBuffers = buffers.length;

    for (let i = 0; i < numBuffers; i++) {
        const buffer = buffers[i];

        if (buffer.referenceCount > 0) {
            buffer.render(renderer, camera, scene);
        }
    }
};

/**
 *
 * @param {number} value
 */
FrameBufferManager.prototype.setPixelRatio = function (value) {
    this.pixelRatio = value;
};

/**
 *
 * @param {number} x
 * @param {number} y
 */
FrameBufferManager.prototype.setSize = function (x, y) {
    const buffers = this.buffers;

    const numBuffers = buffers.length;

    const pixelRatio = this.pixelRatio;

    for (let i = 0; i < numBuffers; i++) {
        const buffer = buffers[i];
        buffer.setSize(x / pixelRatio, y / pixelRatio);
    }
};
