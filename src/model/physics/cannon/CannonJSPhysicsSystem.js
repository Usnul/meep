/**
 * Created by Alex on 04/02/2015.
 */
import { System } from '../../engine/ecs/System';
import Transform from '../../engine/ecs/components/Transform';
import PhysicalBody from '../../engine/ecs/components/PhysicalBody';
import Vector3 from '../../core/geom/Vector3';
import Cannon from './cannon.min.js';


class CannonPhysicsSystem extends System {
    constructor() {
        super();
        this.componentClass = PhysicalBody;
        this.entityManager = null;
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;
        const world = this.world = new Cannon.World();
        world.gravity.set(0, -30, 0);
        world.broadphase = new Cannon.NaiveBroadphase();
        world.solver.iterations = 3;
        this.bodies = [];
        this.delayRemove = false;
        this.defferredRemoveBodies = [];
        this.materials = [];
        readyCallback();
    }

    add(component, entity) {
        const em = this.entityManager;
        //make a shape
        const shape = createShape(component.shape);
        const body = new Cannon.Body({
            mass: component.mass,
            position: new Cannon.Vec3(0, 0, 0)
        });
        body.collisionResponse = component.collisionResponse;
        body.angularDamping = 0;
        body.linearDamping = component.linearDamping;
        body.addShape(shape);
        body.entity = entity;
        if (component.rotationAxis.x === false && component.rotationAxis.y === false && component.rotationAxis.z === false) {
            //lock rotation
            body.fixedRotation = true;
            body.updateMassProperties();
        }
        this.bodies[entity] = body;
        const world = this.world;
        em.getComponentAsync(entity, Transform, function (t) {
            const p = t.global.position;
            body.position.set(p.x, p.y, p.z);
            body.initPosition.set(p.x, p.y, p.z);
            world.add(body);
        });
        //watch component and update body
        const handlers = body.entityEventHandlers = {
            velocity: function (x, y, z) {
                body.velocity.set(x, y, z);
            },
            angularVelocity: function (x, y, z) {
                body.angularVelocity.set(x, y, z);
            },
            collision: function (evt) {
                const body = evt.body;
                const contact = evt.contact;
                collisionPoint.copy(contact.bi.position).add(contact.ri);
                em.sendEvent(entity, "collision", { entity: body.entity, point: collisionPoint });
            }
        };
        body.addEventListener("collide", handlers.collision);
        //
        component.velocity.onChanged.add(handlers.velocity);
        component.angularVelocity.onChanged.add(handlers.angularVelocity);
    }

    remove(component, entity) {
        const body = this.bodies[entity];
        if (body === undefined) {
            //trying to remove something that isn't registered
            console.warn("Entity " + entity + " was not found.");
            return;
        }
        //handlers
        const handlers = body.entityEventHandlers;
        component.velocity.onChanged.remove(handlers.velocity);
        component.angularVelocity.onChanged.remove(handlers.angularVelocity);
        body.removeEventListener("collide", handlers.collision);
        //
        if (this.delayRemove) {
            this.defferredRemoveBodies.push(body);
        } else {
            this.world.remove(body);
        }
    }

    update(timeDelta) {
        const bodies = this.bodies;
        const em = this.entityManager;
        em.traverseEntities([PhysicalBody, Transform], function (pb, transform, entity) {
            const body = bodies[entity];
            body.angularVelocity.copy(pb.angularVelocity);
            body.velocity.copy(pb.velocity);
            //
            //record old inertia
            body.position.copy(transform.position);
            body.quaternion.copy(transform.rotation);
        });
        this.delayRemove = true;
        const world = this.world;
        if (timeDelta <= 0) {
            //time delta not supported, return without doing simulation
            return;
        }
        world.step(timeDelta, timeDelta, 5);
        this.delayRemove = false;
        if (this.defferredRemoveBodies.length !== 0) {
            this.defferredRemoveBodies.forEach(function (body) {
                world.remove(body);
            });
        }
        //write body parameters back
        world.bodies.forEach(function (body) {
            if (body.sleepState === Cannon.Body.SLEEPING) {
                //ignore sleeping bodies
                return;
            }
            const entity = body.entity;

            //
            const pb = em.getComponent(entity, PhysicalBody);
            const transform = em.getComponent(entity, Transform);
            //
            pb.velocity.copy(body.velocity);
            pb.angularVelocity.copy(body.angularVelocity);
            if (!pb.angularVelocity.isZero() && quaternionsEqual(body.quaternion, transform.rotation)) {
                //this is an override to cannon not applying angular velocity to bodies of mass 0
                const av = pb.angularVelocity;
                tempQuaternion.setFromEuler(av.x * timeDelta, av.y * timeDelta, av.z * timeDelta, "XYZ");
                body.quaternion.mult(tempQuaternion, body.quaternion);
            }
            transform.position.copy(body.position);
            transform.rotation.copy(body.quaternion);
        });

    }
}


function createShape(desc) {
    let result = void 0;
    switch (desc.type) {
        case "sphere":
            result = new Cannon.Sphere(desc.radius);
            break;
        case "box":
            const size = desc.size;
            result = new Cannon.Box(new Cannon.Vec3(size.x / 2, size.y / 2, size.z / 2));
            size.onChanged.add(function (newValue) {
                result.halfExtents.set(size.x / 2, size.y / 2, size.z / 2);
            });
            result.updateConvexPolyhedronRepresentation();
            result.updateBoundingSphereRadius();
            break;
        default :
            console.error("unsupported shape type " + desc.type);
            break;
    }
    return result;
}

function obtainMaterial(existing, options) {
    let i = 0;
    const l = existing.length;
    for (; i < l; i++) {
        const m = existing[i];
        const match = false;
        for (let j in options) {
            if (options.hasOwnProperty(j) && options[j] !== m[j]) {
                break;
            }
        }
        if (match) {
            return m;
        }
    }
}

const collisionPoint = new Vector3();

function quaternionsEqual(q0, q1) {
    return q0.x === q1.x && q0.y === q1.y && q0.z === q1.z && q0.w === q1.w;
}

const tempQuaternion = new Cannon.Quaternion();

export default CannonPhysicsSystem;