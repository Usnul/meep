/**
 * User: Alex Goldring
 * Date: 13/6/2014
 * Time: 22:33
 */
import { System } from '../System';
import AimController from '../components/AimController';
import CharacterController from '../components/CharacterController';
import Transform from '../components/Transform';


class AimControllerSystem extends System {
    constructor() {
        super();
        this.componentClass = AimController;
        this.sensitivity = 5 * Math.PI / 180;
    }

    add(component, entity) {
    }

    remove(component) {
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const sensitivity = this.sensitivity;
        entityManager.traverseEntities([AimController, CharacterController, Transform], function (aimController, character, transform) {
            //update controller
            updateController(aimController, sensitivity);
            //rotate player
            const quaternion = new THREE.Quaternion();
            quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -aimController.lon * (Math.PI / 180));
            transform.rotation.copy(quaternion);
            //rotate aim transform
            const aimTransform = character.aim;
            if (aimTransform !== void 0) {
                const e = new THREE.Euler();
                e.setFromQuaternion(aimTransform.rotation);
                e.x = -(aimController.phi - Math.PI / 2);
                aimTransform.rotation.setFromEuler(e);
            }
        });
    }
}


function updateController(aim, sensitivity) {
    aim.lon += sensitivity * aim.xDelta;
    aim.lat -= sensitivity * aim.yDelta;
    //reset deltas
    aim.xDelta = 0;
    aim.yDelta = 0;

    aim.lat = Math.max(-85, Math.min(85, aim.lat));
    aim.phi = THREE.Math.degToRad(90 - aim.lat);

    aim.theta = THREE.Math.degToRad(aim.lon);
}

export default AimControllerSystem;
