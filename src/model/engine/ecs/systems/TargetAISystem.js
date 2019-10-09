/**
 * Created by Alex on 30/06/2014.
 */
import { System } from '../System';
import TargetAI from '../components/TargetAI';
import Attacker from '../components/Attacker';
import Transform from '../components/Transform';
import Tag from '../components/Tag';


class TargetAISystem extends System {
    constructor() {
        super();
        this.componentClass = TargetAI;
        this.entityManager = null;
        this.managedTargets = [];
    }

    reset() {
        this.managedTargets = [];
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;
        const self = this;
        entityManager.on.entityRemoved.add(function (entity) {
            //check if it's a managed entity
            const managedTarget = self.managedTargets[entity];
            if (managedTarget !== void 0) {
                managedTarget.target = null;
            }
        });
        readyCallback();
    }

    remove(component, entity) {
        if (component.target !== null) {
            delete this.managedTargets[component.target];
        }
    }

    update(timeDelta) {
        const self = this;
        //go through target pickers
        const em = this.entityManager;
        em.traverseEntities([TargetAI, Attacker, Transform], function (picker, attacker, source, entity) {
            const sourcePosition = source.global.position;
            let targetEntity = attacker.target;
            let targetPosition;
            if (targetEntity !== null) {
                const targetTransform = em.getComponent(targetEntity, Transform);
                if (targetTransform === null) {
                    //target entity no longer exists
                    loseTarget(em, entity, attacker, self);
                } else {
                    targetPosition = targetTransform.global.position;
                    const d = targetPosition.distanceTo(sourcePosition);
                    if (d > picker.range) {
                        //reset target if too far
                        loseTarget(em, entity, attacker, self);
                    } else {
                        //we already have a decent target
                        return;
                    }
                }
            }
            if (attacker.target === null) {
                let range = picker.range;
                const tags = picker.tags;
                //find a new nearest target
                em.traverseEntities([Tag, Transform], function (tag, transform, entity) {
                    if (tags.indexOf(tag.name) < 0) {
                        //not a tag we care about
                        return;
                    }
                    //check distance
                    let d = transform.global.position.distanceTo(sourcePosition);
                    if (d < range) {
                        range = d; //reduce search radius
                        targetEntity = entity;
                    }
                });
                if (targetEntity !== null) {
                    gainTarget(em, entity, attacker, targetEntity, self);
                }
            }
        });
    }
}


function loseTarget(em, entity, attacker, ts) {
    const oldTarget = attacker.target;
    attacker.target = null;
    em.sendEvent(entity, "target-lost", oldTarget);
    delete ts.managedTargets[oldTarget];
}

function gainTarget(em, entity, attacker, target, ts) {
    attacker.target = target;
    em.sendEvent(entity, "target-gained", target);
    ts.managedTargets[target] = attacker;
}

export default TargetAISystem;
