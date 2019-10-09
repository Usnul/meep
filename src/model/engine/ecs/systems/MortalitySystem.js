/**
 * User: Alex Goldring
 * Date: 17/6/2014
 * Time: 21:27
 */
import { System } from '../System';
import Mortality from '../components/Mortality';


class MortalitySystem extends System {
    constructor() {
        super();
        this.componentClass = Mortality;
        //
        this.__handlers = [];
    }

    reset() {
        this.__handlers = [];
    }

    link(component, entity) {
        const entityManager = this.entityManager;
        const h = function () {
            component.actions.forEach(function (action) {
                action(entity, entityManager);
            });
        };
        this.__handlers[entity] = h;
        entityManager.addEntityEventListener(entity, "death", h);
    }

    unlink(component, entity) {
        const handlers = this.__handlers;
        const handler = handlers[entity];
        this.entityManager.removeEntityEventListener(entity, "death", handler);
        delete handlers[entity];
    }

    update(timeDelta) {
    }
}


export default MortalitySystem;
