/**
 * Created by Alex on 05/02/2015.
 */
import { System } from '../System';
import SynchronizePosition from '../components/SynchronizePosition';
import Transform from '../components/Transform';


class SynchronizePositionSystem extends System {
    constructor() {
        super();
        this.componentClass = SynchronizePosition;
        this.entityManager = null;
    }

    update(timeDelta) {
        const em = this.entityManager;
        em.traverseEntities([SynchronizePosition, Transform], function (sync, transform) {
            const targetEntity = sync.targetEntity;
            const targetTransform = em.getComponent(targetEntity, Transform);
            if (sync.x) {
                transform.position.x = targetTransform.position.x;
            }
            if (sync.y) {
                transform.position.y = targetTransform.position.y;
            }
            if (sync.z) {
                transform.position.z = targetTransform.position.z;
            }
        });
    }
}


export default SynchronizePositionSystem;
