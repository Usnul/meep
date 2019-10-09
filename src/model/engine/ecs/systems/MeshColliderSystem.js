/**
 * Created by hdnha on 7/24/2014.
 */
import { System } from '../System';
import Tag from '../components/Tag';
import Transform from '../components/Transform';
import Renderable from '../components/Renderable';
import MeshCollider from '../components/MeshCollider';
import { Raycaster } from "three";


class MeshColliderSystem extends System {
    constructor() {
        super();
        this.componentClass = MeshCollider;
    }

    add(component, entity) {
    }

    remove(component) {
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        entityManager.traverseEntities([Transform, MeshCollider], function (transform, meshCollider, entity) {
            const delta = transform.position.clone().sub(transform.previousPosition);
            const length = delta.length();
            let raycaster = new Raycaster(transform.previousPosition, delta.normalize(), 0, length);
            if (!raycaster) {
                return;
            }
            entityManager.traverseEntities([Tag, Renderable], function (tag, renderable, otherEntity) {
                if (meshCollider.tags.indexOf(tag.name) != -1) {
                    const objects = raycaster.intersectObject(renderable.mesh);
                    if (objects.length > 0) {
                        entityManager.sendEvent(entity, "collision", otherEntity);
                        return false; //stop traversal
                    }
                }
            });
        });
    }
}

export default MeshColliderSystem;
