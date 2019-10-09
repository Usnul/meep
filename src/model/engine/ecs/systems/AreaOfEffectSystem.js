/**
 * Created by Alex on 11/08/2014.
 */
import { System } from '../System';
import Tag from '../components/Tag';
import Transform from '../components/Transform';
import AreaOfEffect from '../components/AreaOfEffect';


class AreaOfEffectSystem extends System {
    constructor() {
        super();
        this.componentClass = AreaOfEffect;
    }

    add(component, entity) {
    }

    remove(component) {
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        entityManager.traverseEntities([AreaOfEffect, Transform], function (aoe, transform) {
            const position = transform.position;
            const tags = aoe.tags;
            const radius = aoe.radius;
            entityManager.traverseEntities([Tag, Transform], function (tag, transform2, entity) {
                if (tags.indexOf(tag.name) === -1) {
                    return; //not a tag we care about
                }
                const position2 = transform2.position;
                //check range, doing one component at a time makes evaluation lazy, giving us a bit of speed
                if (
                    Math.abs(position2.x - position.x) < radius.x
                    && Math.abs(position2.y - position.y) < radius.y
                    && Math.abs(position2.z - position.z) < radius.z
                ) {
                    //within box
                    aoe.action(entityManager, timeDelta, entity);
                }
            })
        });
    }
}

export default AreaOfEffectSystem;
