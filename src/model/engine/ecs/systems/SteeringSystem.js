/**
 * User: Alex Goldring
 * Date: 1/6/2014
 * Time: 08:37
 */
import { System } from '../System';
import PhysicalBody from '../components/PhysicalBody';
import Motion from '../components/Motion';
import Transform from '../components/Transform';
import Steering from '../components/Steering';


class SteeringSystem extends System {
    constructor() {
        super();
        this.componentClass = Steering;
    }

    update(timeDelta) {
        const entityManager = this.entityManager;

        function process(entity, steering, transform, velocity) {
            const destination = steering.destination;
            if (destination === null || destination === undefined) {
                return; //don't do anything
            }
            const delta = destination.clone().sub(transform.position);
            const distanceWithError = computeDistanceWithError(transform.position, destination, steering.targetMargin);

            if (distanceWithError > 0) {
                //not at the target yet
                const d = steering.maxSpeed;
                const v = delta.normalize();

                //check old velocity to avoid flying past target
                if (distanceWithError < d * timeDelta) {
                    const distance = delta.length();
                    const adjustedVelocity = Math.min(d, distance / timeDelta);
                    v.multiplyScalar(adjustedVelocity);
                } else {
                    v.multiplyScalar(d);
                }
                velocity.copy(v);
                //set transform rotation based on velocity
                Transform.adjustRotation(transform.rotation, v, steering.rotationSpeed * timeDelta);

            } else {
                steering.destination = null; //put to sleep
                velocity.set(0, 0, 0);
                //dispatch
                entityManager.sendEvent(entity, "steeringDestinationReached", steering);
            }
        }

        //Make sure physical bodies exist
        if (entityManager.getSystemIdByComponentClass(PhysicalBody) != -1) {
            entityManager.traverseEntities([Steering, PhysicalBody, Transform], function (steering, physicalBody, transform, entity) {
                const body = physicalBody.body;
                process(entity, steering, transform, body.linearVelocity);
            });
        }
        entityManager.traverseEntities([Steering, Motion, Transform], function (steering, motion, transform, entity) {
            process(entity, steering, transform, motion.velocity);
        });
    }
}


function computeDistanceWithError(v0, v1, error) {
    const absDelta = v0.clone().sub(v1).abs();
    absDelta.set(Math.max(absDelta.x - error.x, 0), Math.max(absDelta.y - error.y, 0), Math.max(absDelta.z - error.z, 0));
    return absDelta.length();
}

export default SteeringSystem;
