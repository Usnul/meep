/**
 * Created by Alex on 15/11/2016.
 */


import { System } from '../../../engine/ecs/System';
import AnimationController from './AnimationController';
import { Animation } from '../../../engine/ecs/components/Animation';

class AnimationControllerSystem extends System {
    constructor() {
        super();
        this.componentClass = AnimationController;
        this.removers = [];
    }

    /**
     *
     * @param {AnimationController} component
     * @param entity
     */
    link(component, entity) {
        const em = this.entityManager;
        const dataset = em.dataset;

        const callbacks = this.removers[entity] = [];

        function registerRule(r) {
            function startEventHandler() {
                const animation = dataset.getComponent(entity, Animation);

                //remove existing clips with that animation
                removeAnimation(animation);

                //create a new animation according to the rule
                const clip = new Animation.Clip();
                clip.fromJSON({
                    name: r.animation,
                    timeScale: r.speed,
                    repeatCount: r.loop ? Number.POSITIVE_INFINITY : 1,
                    weight: r.weight
                });
                animation.clips.add(clip);
            }

            function removeAnimation(animation) {
                animation.clips.removeIf(function (c) {
                    return c.name.getValue() === r.animation;
                });
            }

            function stopEventHandler() {
                const animation = dataset.getComponent(entity, Animation);
                removeAnimation(animation);
            }

            if (typeof r.stopEvent === "string") {
                dataset.addEntityEventListener(entity, r.stopEvent, stopEventHandler);
                callbacks.push({ name: r.stopEvent, handler: stopEventHandler });
            }
            dataset.addEntityEventListener(entity, r.startEvent, startEventHandler);
            callbacks.push({ name: r.startEvent, handler: startEventHandler });
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


export default AnimationControllerSystem;