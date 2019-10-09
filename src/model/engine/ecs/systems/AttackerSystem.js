/**
 * Created by Alex on 30/06/2014.
 */
import { System } from '../System';
import Attacker from '../components/Attacker';
import Transform from '../components/Transform';


class AttackerSystem extends System {
    constructor() {
        super();
        this.componentClass = Attacker;
        this.entityManager = null;
    }

    add(component, entity) {
    }

    remove(component, entity) {
    }

    update(timeDelta) {
        const em = this.entityManager;

        /**
         *
         * @param {Attacker} attacker
         * @param {Transform} transform
         * @param entity
         */
        function visitEntity(attacker, transform, entity) {
            const target = attacker.target;
            if (target === null) {
                return; //no target
            }
            //check distance between attacker and the target
            const targetTransform = em.getComponent(target, Transform);
            if (targetTransform === null) {
                //target doesn't have transform
                attacker.target = null; //drop target
                return;
            }
            if (transform.position.distanceTo(targetTransform.position) > attacker.range) {
                return; //target is too far
            }
            const delay = attacker.delay;
            let time = attacker.timerValue + timeDelta;
            if (time > delay) {
                let attacks = Math.floor(time / delay);
                time %= delay;
                while (attacks-- > 0) {
                    em.sendEvent(entity, "attack", target);
                }
            }
            attacker.timerValue = time;
        }

        em.traverseEntities([Attacker, Transform], visitEntity);
    }
}


export default AttackerSystem;
