/**
 * User: Alex Goldring
 * Date: 7/4/2014
 * Time: 20:43
 */
import { System } from '../System';
import Motion from '../components/Motion';
import Transform from '../components/Transform';


class MotionSystem extends System {
    constructor() {
        super();
        this.componentClass = Motion;
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        entityManager.traverseEntities([Motion, Transform], function (motion, transform) {
            const positionDelta = motion.velocity.clone().multiplyScalar(timeDelta);
            transform.position.add(positionDelta);
        });
    }
}


export default MotionSystem;
