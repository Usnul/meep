/**
 * User: Alex Goldring
 * Date: 7/4/2014
 * Time: 20:43
 */


import { System } from '../../../engine/ecs/System';
import PathFollower, { PathFollowerEventType } from '../components/PathFollower';
import Path from '../components/Path';
import Transform from '../../../engine/ecs/components/Transform';
import Vector3 from "../../../core/geom/Vector3.js";

const v3_forward = new Vector3();

/**
 *
 * @param {PathFollower} pathFollower
 * @param {Path} path
 * @param {Transform} transform
 * @param {number} timeDelta
 */
function performStep(pathFollower, path, transform, timeDelta) {
    const distance = pathFollower.speed.getValue() * timeDelta;

    path.move(distance);

    /**
     *
     * @type {*|*|*}
     */
    const nextPosition = path.getCurrentPosition();

    if (nextPosition === undefined) {
        //no next position exits, nothing to update
        return;
    }

    if (!nextPosition.equals(transform.position)) {
        //TODO can avoid cloning here to prevent memory allocation
        const oldPosition = transform.position.clone();

        const alignment = pathFollower.rotationAlignment;
        if (alignment.x || alignment.y || alignment.z) {

            //compute old facing direction vector
            v3_forward.copy(Vector3.forward);

            v3_forward.applyQuaternion(transform.rotation);

            const positionDelta = nextPosition.clone().sub(oldPosition);

            if (!alignment.x) {
                positionDelta.x = v3_forward.x;
            }
            if (!alignment.y) {
                positionDelta.y = v3_forward.y;
            }
            if (!alignment.z) {
                positionDelta.z = v3_forward.z;
            }

            positionDelta.normalize();

            const angularLimit = pathFollower.rotationSpeed.getValue() * timeDelta;

            // console.log("Angular limit:", angularLimit, positionDelta.toJSON());

            Transform.adjustRotation(transform.rotation, positionDelta, angularLimit);
        }

        transform.position.copy(nextPosition);
    }

}

class PathFollowingSystem extends System {
    constructor() {
        super();

        this.componentClass = PathFollower;
    }

    /**
     *
     * @param {number} timeDelta Time in seconds
     */
    update(timeDelta) {
        const entityManager = this.entityManager;

        const dataset = entityManager.dataset;

        if (dataset !== null) {
            dataset.traverseEntities([PathFollower, Transform, Path], function (pathFollower, transform, path, entity) {
                if (!pathFollower.active) {
                    //follower is not active, skip
                    return;
                }


                performStep(pathFollower, path, transform, timeDelta);
                if (path.isComplete()) {
                    //deactivate
                    pathFollower.active = false;
                    dataset.sendEvent(entity, PathFollowerEventType.EndReached);
                }
            });
        }
    }
}


export default PathFollowingSystem;
