/**
 * Created by Alex on 01/04/2014.
 */
import { System } from '../System';
import PhysicalBody from '../components/PhysicalBody';
import Transform from '../components/Transform';
import PhysicsWorld from '../../../physics/ammo/World';


class PhysicsSystem extends System {
    constructor() {
        super();
        this.componentClass = PhysicalBody;
    }

    rayTest(from, to, callback) {
        this.physics.rayTest(from, to, callback);
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;
        this.physics = new PhysicsWorld(readyCallback);
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        try {
            this.physics = null;
            readyCallback();
        } catch (e) {
            errorCallback(e);
        }
    }

    add(component, entity) {
        const body = component.body;
        body.__entity = entity;
        this.physics.addBody(body);
        //collisions
        if (component.notifyCollision) {
            const entityManager = this.entityManager;

            body.onCollision(function (other) {
                entityManager.sendEvent(entity, "collision", other.__entity);
            });
        }
    }

    remove(component) {
        const body = component.body;
        this.physics.removeBody(body);
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        let signals = entityManager.eventManager.signals;
        //set position to physical body
        entityManager.traverseEntities([PhysicalBody, Transform], function (physicalBody, transform) {
            //copy position into body
            const body = physicalBody.body;
            body.position.copy(transform.position);
            body.rotation.copy(transform.rotation);
        });


        const stepFinishedCallback = function () {
            //set position from physical body
            entityManager.traverseEntities([PhysicalBody, Transform], function (physicalBody, transform, entity) {
                //copy position from body
                const body = physicalBody.body;
                const previousPosition = transform.previousPosition;
                const currentPosition = transform.position;
                if (previousPosition.x != currentPosition.x || previousPosition.y != currentPosition.y || previousPosition.z != currentPosition.z) {
                    //write previous position is the current position is different from before
                    previousPosition.copy(currentPosition);
                }
                currentPosition.copy(body.position);
                //                transform.rotation.copy(body.rotation);
            });
        };
        this.physics.simulate(timeDelta, stepFinishedCallback);
    }
}


function collisionHandler() {
}

export default PhysicsSystem;
