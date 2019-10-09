/**
 * User: Alex Goldring
 * Date: 7/4/2014
 * Time: 09:17
 */
import { System } from '../System';
import CharacterController from '../components/CharacterController';
import Transform from '../components/Transform';
import PhysicalBody from '../components/PhysicalBody';
import Vector3 from "../../../core/geom/Vector3.js";


class CharacterControlSystem extends System {
    constructor() {
        super();
        this.componentClass = CharacterController;
        //
        this.entityManager = null;
    }

    remove(component) {
    }

    add(component) {
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const PhysicsSystemType = entityManager.getSystemIdByComponentClass(PhysicalBody);
        const physicsSystem = entityManager.systems[PhysicsSystemType];
        entityManager.traverseEntities([CharacterController, PhysicalBody, Transform], function (controller, physicalBody, transform) {
            if (controller.lockedTimeout > 0) {
                //controlls are locked - can't do anything
                controller.lockedTimeout -= timeDelta;
                if (controller.lockedTieout < 0) {
                    controller.lockedTimeout = 0;
                }
            } else {
                //controls aren't locked
                setOnSolidSurface(transform, controller, physicsSystem);
                updatePosition(controller, physicalBody.body, transform, physicsSystem);
                if (controller.attacking) {
                    console.log("pow!");
                }
            }
        });

    }
}


function setOnSolidSurface(transform, controller, physicsSystem) {
    const from = transform.position.clone();
    const to = from.clone().add(new Vector3(0, -100, 0));
    physicsSystem.rayTest(from, to, function (success, point) {
        if (success) {
            const v = new Vector3();
            v.copy(point);
            const number = v.distanceTo(from);
            if (number <= controller.height / 2 + 0.06) {
                controller.onSolidSurface = true;
            } else {
                controller.onSolidSurface = false;
            }
        } else {
            controller.onSolidSurface = false;
        }
    });
}

function updatePosition(controls, body, transform) {
    let z = 0;
    let x = 0;
    if (controls.forward) {
        z -= 1;
    }
    if (controls.back) {
        z += 1;
    }
    if (controls.right) {
        x += 1;
    }
    if (controls.left) {
        x -= 1;
    }
    const moving = (x !== 0 || z !== 0);
    let vector;
    const notTakingOff = body.linearVelocity.y <= 0.00001;
    if (controls.onSolidSurface && notTakingOff) {
        if (moving) {
            const y = body.linearVelocity.y;
            //obtain facing direction
            const euler = new THREE.Euler();
            euler.setFromQuaternion(transform.rotation);
            //vector pointing in the direction of travel
            vector = new THREE.Vector3(x, 0, z);
            const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(transform.rotation);
            vector.applyMatrix4(rotationMatrix);
            vector.y = y;
            //enforce movement speed
            let scalar = controls.movementSpeed;
            if (controls.sprinting) {
                //apply sprinting multiplier
                scalar *= controls.sprintingMultiplier;
            }
            //scale facing direction vector by the movement speed
            vector.normalize().multiplyScalar(scalar);
            //write the property
            body.linearVelocity.copy(vector);
        } else {
            //when on ground and not moving - stand still
            const v = body.linearVelocity;
            if (v.x !== 0 || v.z !== 0) {
                v.set(0, 0, 0);
            }
        }
        if (controls.jump) {
            //perform jump
            const up = new Vector3(0, 1, 0);
            const magnitude = (8 * body.mass);
            const force = up.scale(magnitude);
            body.applyCentralImpulse(force);

            controls.onSolidSurface = false;  //prevent further jumps
            controls.lockedTimeout = 0.1; //lock controls to prevent some race conditions
        }
    }

    //set jump to false
    controls.jump = false;
}

export default CharacterControlSystem;
