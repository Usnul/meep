/**
 * Created by Alex on 23/11/2016.
 */


import { System } from '../../engine/ecs/System';
import { SoundEmitter } from './SoundEmitter';
import SoundController from './SoundController';

/**
 *
 * @param {Rule} rule
 * @returns {string}
 */
function pickTackFromRule(rule) {

    const randomNumber = Math.random();

    const tracks = rule.tracks;

    const numTracks = tracks.length;

    const index = Math.floor(randomNumber * numTracks);

    return tracks[index];
}

class SoundControllerSystem extends System {
    constructor() {
        super();
        this.componentClass = SoundController;
        this.removers = [];
    }

    /**
     *
     * @param {SoundController} component
     * @param {number} entity
     */
    link(component, entity) {

        const em = this.entityManager;

        const dataset = em.dataset;

        const callbacks = this.removers[entity] = [];


        /**
         *
         * @param {SoundController.Rule} rule
         */
        function registerRule(rule) {
            function startEventHandler() {
                const emitter = dataset.getComponent(entity, SoundEmitter);

                if (emitter === undefined) {
                    //do nothing?
                    console.error("Entity " + entity + " has no SoundEmitter to control");
                }

                const track = new SoundEmitter.Track();

                const url = pickTackFromRule(rule);

                track.fromJSON({
                    url,
                    loop: rule.loop,
                    volume: rule.volume,
                    channel: rule.channel
                });

                emitter.tracks.add(track);
            }

            function stopEventHandler() {
                const emitter = dataset.getComponent(entity, SoundEmitter);
                emitter.tracks.removeOneIf(function (t) {
                    return rule.tracks.indexOf(t.url) !== -1;
                });
            }

            if (typeof rule.stopEvent === "string") {
                dataset.addEntityEventListener(entity, rule.stopEvent, stopEventHandler);
                callbacks.push({ name: rule.stopEvent, handler: stopEventHandler });
            }
            dataset.addEntityEventListener(entity, rule.startEvent, startEventHandler);
            callbacks.push({ name: rule.startEvent, handler: startEventHandler });
        }

        component.rules.forEach(registerRule);
    }

    unlink(component, entity) {
        const callbacks = this.removers[entity];
        delete this.removers[entity];
        const em = this.entityManager;

        const dataset = em.dataset;

        callbacks.forEach(function (cb) {
            dataset.removeEntityEventListener(entity, cb.name, cb.handler);
        });
    }
}


export default SoundControllerSystem;
