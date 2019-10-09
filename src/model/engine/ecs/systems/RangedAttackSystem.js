/**
 * Created by Alex on 13/08/2014.
 */
import { System } from '../System';
import Transform from '../components/Transform';
import RangedAttack from '../components/RangedAttack';
import PhysicalBody from '../components/PhysicalBody';
import Motion from '../components/Motion';
import Renderable from '../components/Renderable';
import { Matrix4 as ThreeMatrix4, Vector3 as ThreeVector3 } from 'three';
import { solveQuadratic } from "../../../core/math/MathUtils.js";

/**
 * Return the firing solution for a projectile starting at 'src' with
 * velocity 'v', to hit a target, 'dst'.
 *
 * @param Vector3 source position of shooter
 * @param Vector3 target position of target
 * @param Vector3 targetVelocity   velocity of target object
 * @param Vector3 sourceSpeed   speed of projectile
 * @return Vector3 Coordinate at which to fire (and where intercept occurs)
 */
const intercept = (function () {


    const toTarget = new ThreeVector3();
    const v0 = new ThreeVector3();

    function intercept(source, target, targetVelocity, sourceSpeed) {
        toTarget.copy(target).sub(source);
        // Get quadratic equation components
        const a = targetVelocity.dot(targetVelocity) - sourceSpeed * sourceSpeed;
        const b = 2 * targetVelocity.dot(toTarget);
        const c = toTarget.dot(toTarget);

        // Solve quadratic
        const ts = solveQuadratic(a, b, c); // See quad(), below

        // Find smallest positive solution
        let sol = null;
        if (ts) {
            const t0 = ts[0], t1 = ts[1];
            let t = Math.min(t0, t1);
            if (t < 0) t = Math.max(t0, t1);
            if (t > 0) {
                v0.copy(targetVelocity).multiplyScalar(t).add(target);
                sol = v0;
            }
        }

        return sol;
    }

    return intercept;
})();


class RangedAttackSystem extends System {
    constructor() {
        super();
        this.componentClass = RangedAttack;
    }

    add(component, entity) {
        const em = this.entityManager;
        em.addEntityEventListener(entity, "attack", function (target) {
            //get transform
            const targetTransform = em.getComponent(target, Transform);
            if (targetTransform === null) {
                //target no longer exists
                return;
            }
            const sourceTransform = em.getComponent(entity, Transform);
            //get projectile
            const projectileBuilder = component.factory();
            const projectileTransform = projectileBuilder.getComponent(Transform);
            //get delta between source and target
            const sourcePosition = sourceTransform.position.clone().add(component.projectileOffset);
            let targetPosition = targetTransform.position.clone();

            //check if target has a mesh
            const renderable = em.getComponent(target, Renderable);
            if (renderable !== null) {
                targetPosition.add(renderable.center);
            }
            //check if target is moving
            const motion = em.getComponent(target, Motion);
            if (motion !== null) {
                //correct targeting, with respect to motion
                const interceptPosition = intercept(sourcePosition, targetPosition, motion.velocity, component.speed);
                if (interceptPosition !== null) {
                    //if there is a valid solution, use it
                    targetPosition = interceptPosition;
                }
            }
            const velocity = targetPosition.clone().sub(sourcePosition).normalize().multiplyScalar(component.speed);
            //move projectile to source transform
            projectileTransform.position.copy(sourcePosition);
            //align rotation
            const matrix4 = new ThreeMatrix4();
            const up = new ThreeVector3(0, 1, 0);
            matrix4.lookAt(sourcePosition, targetPosition, up);
            projectileTransform.rotation.setFromRotationMatrix(matrix4);

            //set physical body
            const physicalBody = projectileBuilder.getComponent(PhysicalBody);
            if (physicalBody !== null && physicalBody !== void 0) {
                const body = physicalBody.body;
                body.position.copy(sourcePosition);
                body.linearVelocity.copy(velocity);
            }
            //motion of component
            const pMotion = projectileBuilder.getComponent(Motion);
            if (pMotion !== null) {
                pMotion.velocity.copy(velocity);
            }
            //build
            let projectileEntity = projectileBuilder.build(em);
        });
    }

    remove(component) {
    }

    update(timeDelta) {
    }
}


export default RangedAttackSystem;
