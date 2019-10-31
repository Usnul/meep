import Clock from "../../Clock.js";
import Script from "../ecs/components/Script.js";
import EntityBuilder from "../ecs/EntityBuilder.js";
import { ParticleEmitter } from "../../graphics/particles/particular/engine/emitter/ParticleEmitter.js";
import Timer from "../ecs/components/Timer.js";
import { ParticleEmitterFlag } from "../../graphics/particles/particular/engine/emitter/ParticleEmitterFlag.js";
import AnimationTrack from "./keyed2/AnimationTrack.js";
import TransitionFunctions from "./TransitionFunctions.js";
import AnimationTrackPlayback from "./keyed2/AnimationTrackPlayback.js";
import Transform from "../ecs/components/Transform.js";
import { createSound, createTimer } from "../EntityCreator.js";
import { whenAllEntitiesDestroyed, whenEntityDestroyed } from "../ecs/EntityBuilderUtils.js";
import Mesh from "../../graphics/ecs/mesh/Mesh.js";

/**
 *
 * @param {EntityComponentDataset} ecd
 * @param {number} entity
 * @param {Array} exceptions
 */
export function removeComponentsExcept(ecd, entity, exceptions) {

    const components = ecd.getAllComponents(entity);
    components.forEach(function (component, systemId) {
        for (let i = 0; i < exceptions.length; i++) {
            if (component instanceof exceptions[i]) {
                //keep
                return;
            }
        }
        //not a component to keep
        ecd.removeComponentFromEntityByIndex(entity, systemId);
    });

}

/**
 *
 * @param {AnimationTrackPlayback} track
 * @param {EntityComponentDataset} ecd
 *
 * @returns {EntityBuilder}
 */
export function playTrackRealTime(track, ecd) {

    const clock = new Clock();
    const script = new Script();

    script.scripts.push(function (timeDelta) {
        const delta = clock.getDelta();

        track.advance(delta);
    });

    const entity = new EntityBuilder();
    entity.add(script).build(ecd);

    track.on.ended.add(function () {
        entity.destroy();
    });

    clock.start();

    return entity;
}

/**
 *
 * @param {AnimationTrackPlayback} track
 * @param {EntityComponentDataset} ecd
 * @returns {EntityBuilder}
 */
export function playAnimationTrack(track, ecd) {
    const script = new Script();

    script.scripts.push(function (timeDelta) {
        track.advance(timeDelta);
    });

    const entity = new EntityBuilder();
    entity.add(script).build(ecd);

    track.on.ended.add(function () {
        entity.destroy();
    });

    return entity;
}

/**
 *
 * @param {number} entity
 * @param {EntityComponentDataset} ecd
 * @returns {Promise}
 */
export function stopEmitterAndNotifyOnceFinished(entity, ecd) {
    return new Promise(function (resolve, reject) {
        if (!ecd.entityExists(entity)) {
            console.warn(`Entity ${entity} doesn't exist`);

            resolve();
            return;
        }

        /**
         *
         * @type {ParticleEmitter}
         */
        const emitter = ecd.getComponent(entity, ParticleEmitter);

        if (emitter === undefined) {
            console.warn(`Entity ${entity} doesn't have ParticleEmitter component`);

            resolve();
            return;
        }

        //stop emission
        emitter.clearFlag(ParticleEmitterFlag.Emitting);


        //figure out how long the emitter should stay alive
        const maxLife = emitter.computeMaxEmittingParticleLife();

        const entityBuilder = new EntityBuilder();
        //create a timer to remove emitter
        const timer = new Timer();
        timer.timeout = maxLife;
        timer.actions.push(function () {
            //confirm that entity still exists
            if (!ecd.entityExists(entity)) {
                //nothing to do
                return;
            }

            //confirm that it's the same entity
            const component = ecd.getComponent(entity, ParticleEmitter);

            if (component !== emitter) {
                //entity seems to have changed, do nothing
                return;
            }
        }, function () {
            //kill self
            entityBuilder.destroy();
            resolve();
        });

        entityBuilder.add(timer);

        entityBuilder.build(ecd);
    });
}

/**
 *
 * @param {Engine} engine
 * @param {EntityComponentDataset} ecd
 * @param {number} entity
 * @param {string} [particles]
 * @param {string} [sound]
 * @returns {Promise<any>}
 */
export function removeEntityGenericEffect(
    {
        engine,
        ecd,
        entity,
        particles = 'cloud-puff',
        sound = "data/sounds/effects/Magic_Game_Essentials/Magic_Vanish_3.wav"
    }
) {

    /**
     *
     * @type {ParticleEmitterSystem2}
     */
    const sPE = engine.entityManager.getSystemByComponentClass(ParticleEmitter);

    /**
     *
     * @type {ParticleEmitterLibrary}
     */
    const emitterLibrary = sPE.library;

    const emitter = emitterLibrary.create(particles);

    const result = removeEntityWithEffect({
        entity,
        ecd,
        emitter,
        soundEffect: sound
    });

    return result;
}

/**
 *
 * @param {number} entity
 * @param {EntityComponentDataset} ecd
 * @returns {Promise}
 */
function shutdownParticleEmitter(entity, ecd) {
    const promise = stopEmitterAndNotifyOnceFinished(entity, ecd);


    const MAX_PARTICLE_LIFE = 10;

    /**
     *
     * @type {ParticleEmitter}
     */
    const particleEmitter = ecd.getComponent(entity, ParticleEmitter);

    if (particleEmitter !== undefined) {

        //destroy any particles that have very long lifespan

        particleEmitter.traverseLayers((layer) => {
            const maxParticleLife = layer.particleLife.max;

            if (layer.emissionRate <= 0 && layer.emissionImmediate <= 0) {
                //skip layers with no emission
                return;
            }

            if (maxParticleLife > MAX_PARTICLE_LIFE) {
                particleEmitter.destroyParticlesFromLayer(layer);
            }
        });
    }

    return promise;
}

/**
 *
 * @param entity
 * @param {EntityComponentDataset} ecd
 * @param {ParticleEmitter} emitter
 * @param {String} soundEffect
 * @param {number} [timeout]
 * @returns {Promise}
 */
export function removeEntityWithEffect({ entity, ecd, emitter, soundEffect, timeout }) {
    /**
     *
     * @type {Transform}
     */
    const transform = ecd.getComponent(entity, Transform);

    //prevent further interactions
    removeComponentsExcept(ecd, entity, [Mesh, ParticleEmitter, Transform]);

    return new Promise((resolve, reject) => {

        const particleEmitterFinished = shutdownParticleEmitter(entity, ecd);


        const animationTrack = new AnimationTrack(['scale']);
        animationTrack.addKey(0, [1]);
        animationTrack.addKey(0.05, [1]);
        animationTrack.addKey(0.27, [0]);
        animationTrack.addTransition(0, TransitionFunctions.EaseOut);
        animationTrack.addTransition(1, TransitionFunctions.EaseOut);


        const originalScale = transform.scale.clone();

        const trackPlayback = new AnimationTrackPlayback(animationTrack, function (s) {
            transform.scale.copy(originalScale.clone().multiplyScalar(s));
        }, null);

        trackPlayback.on.ended.add(() => {
            //remove mesh if it exists since scale is 0
            ecd.removeComponentFromEntity(entity, Mesh);
        });

        const eAnimation = playAnimationTrack(trackPlayback, ecd);

        const entityRemoved = Promise.all([whenEntityDestroyed(eAnimation), particleEmitterFinished])
            .then(() => ecd.removeEntity(entity));

        const t = new Transform();
        t.copy(transform);

        const emitterBuilder = new EntityBuilder();
        emitterBuilder.add(t).add(emitter);
        emitterBuilder.build(ecd);

        const timer = createTimer({
            timeout: emitter.layers.reduce((s, l) => {
                return Math.max(s, l.particleLife.max)
            }, 0),
            action() {
                emitterBuilder.destroy()
            }
        });

        const sound = createSound({
            position: transform.position,
            url: soundEffect,
            positioned: true
        });

        Promise.all([
            entityRemoved,
            whenAllEntitiesDestroyed([timer, sound])
        ])
            .then(resolve, reject);

        timer.build(ecd);
        sound.build(ecd);
    });

}
