import { ShaderManager } from "./ShaderManager.js";
import { BinaryNode } from "../../../../core/bvh2/BinaryNode.js";
import List from "../../../../core/collection/List.js";
import { ParticleEmitterFlag } from "./emitter/ParticleEmitterFlag.js";


function ParticularEngine(assetManager) {
    this.shaderManager = new ShaderManager(assetManager);

    /**
     *
     * @type {THREE.Texture|null}
     */
    this.depthTexture = null;

    /**
     *
     * @type {THREE.Camera|null}
     */
    this.camera = null;

    /**
     * Managed emitters
     * @type {List.<ParticleEmitter>}
     */
    this.emitters = new List();

    this.bvh = new BinaryNode();
    this.bvh.setNegativelyInfiniteBounds();
}

/**
 *
 * @param {ParticleEmitter} emitter
 */
ParticularEngine.prototype.add = function (emitter) {
    if (!emitter.getFlag(ParticleEmitterFlag.Built)) {
        emitter.build();
    }

    //mark sprites for update as their UVs might have changed since last usage
    emitter.setFlag(ParticleEmitterFlag.SpritesNeedUpdate);

    this.emitters.add(emitter);

    this.shaderManager.register(emitter);

    this.bvh.insertNode(emitter.bvhLeaf);
};

/**
 *
 * @param {ParticleEmitter} emitter
 */
ParticularEngine.prototype.remove = function (emitter) {
    this.emitters.removeOneOf(emitter);

    this.shaderManager.deregister(emitter);

    emitter.bvhLeaf.disconnect();
};

/**
 *
 * @param {THREE.Camera} camera
 */
ParticularEngine.prototype.setCamera = function (camera) {
    this.camera = camera;
    this.shaderManager.setCamera(camera);
};

ParticularEngine.prototype.setDepthTexture = function (texture) {
    this.shaderManager.setDepthTexture(texture);
};

ParticularEngine.prototype.setViewportSize = function (x, y) {
    this.shaderManager.setViewportSize(x, y);
};

/**
 * @private
 * @param {ParticleEmitter} emitter
 * @param {number} timeDelta
 */
ParticularEngine.prototype.updateEmitter = function (emitter, timeDelta) {
    if (emitter.getFlag(ParticleEmitterFlag.Sleeping)) {
        emitter.sleepTime += timeDelta;
    } else {

        if (!emitter.getFlag(ParticleEmitterFlag.Initialized)) {
            emitter.initialize();
        }

        if (emitter.sleepTime > 0) {
            //emitter was sleeping, need to catch up the simulation
            const maxParticleLife = emitter.computeMaxEmittingParticleLife();

            let wakingTime = Math.min(emitter.sleepTime, maxParticleLife - timeDelta);

            const minWakingIncrement = 0.15;

            const maxWakingSteps = 10;

            const wakingIncrement = Math.max(wakingTime / maxWakingSteps, minWakingIncrement);

            while (wakingTime > 0) {
                const wakingStep = Math.min(wakingIncrement, wakingTime);

                emitter.advance(wakingStep);

                wakingTime -= wakingStep;
            }

            //consume the sleep time
            emitter.sleepTime = 0;
        }
        //advance simulation
        emitter.advance(timeDelta);
    }
};

ParticularEngine.prototype.update = function () {
    const emitters = this.emitters;

    const numEmitters = emitters.length;

    for (let i = 0; i < numEmitters; i++) {
        const emitter = emitters.get(i);
        if (!emitter.getFlag(ParticleEmitterFlag.Sleeping)) {

            emitter.update();
        }
    }
};

ParticularEngine.prototype.sortParticles = function () {
    const emitters = this.emitters;

    const numEmitters = emitters.length;

    for (let i = 0; i < numEmitters; i++) {
        const emitter = emitters.get(i);
        if (!emitter.getFlag(ParticleEmitterFlag.Sleeping) && emitter.getFlag(ParticleEmitterFlag.DepthSorting)) {
            //sort particles by position from camera
            emitter.sort(this.camera);
        }
    }
};

/**
 *
 * @param {number} timeDelta
 */
ParticularEngine.prototype.advance = function (timeDelta) {
    const emitters = this.emitters;

    const numEmitters = emitters.length;

    for (let i = 0; i < numEmitters; i++) {
        const emitter = emitters.get(i);
        this.updateEmitter(emitter, timeDelta);
    }
};

export { ParticularEngine };
