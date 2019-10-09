/**
 * Created by Alex on 30/01/14.
 */
let Module = {
    TOTAL_MEMORY: 20 * 1024 * 1024,
    ALLOW_MEMORY_GROWTH: 1
};
/**
 * Bullet enumerations
 */
const btRigidBodyFlags = {
    BT_DISABLE_WORLD_GRAVITY: 1,
    BT_ENABLE_GYROPSCOPIC_FORCE: 2
};
const CollisionFlags = {
    CF_STATIC_OBJECT: 1,
    CF_KINEMATIC_OBJECT: 2,
    CF_NO_CONTACT_RESPONSE: 4,
    CF_CUSTOM_MATERIAL_CALLBACK: 8,
    CF_CHARACTER_OBJECT: 16,
    CF_DISABLE_VISUALIZE_OBJECT: 32,
    CF_DISABLE_SPU_COLLISION_PROCESSING: 64
};
importScripts('../../../lib/ammo.src');

// Bullet-interfacing code
// Build the broadphase
const broadphase = new Ammo.btDbvtBroadphase();

// Set up the collision configuration and dispatcher
const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);

// The actual physics solver
const solver = new Ammo.btSequentialImpulseConstraintSolver();

// The world.
const dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
const globalGravity = new Ammo.btVector3(0, -10, 0);
dynamicsWorld.setGravity(globalGravity);
//add tick callback
Ammo.Runtime = Runtime || Ammo.Runtime;
const simulationTickCallbackPointer = Ammo.Runtime.addFunction(simulationTickCallback);
dynamicsWorld.setInternalTickCallback(simulationTickCallbackPointer);
//Runtime.removeFunction(pointer);


const bodies = [];
const shapes = [];
const transform = new Ammo.btTransform();
/**
 * @type {Array<Array>}
 */
const collisions = [];
let simulationStepInProgress = false;

function registerCollision(body1, body2, contactPoint) {

    const id1 = body1.__towers_id;
    const id2 = body2.__towers_id;
    let collision1 = collisions[id1];
    let collision2 = collisions[id2];
    if (!collision1) {
        collision1 = collisions[id1] = [];
    }
    if (!collision2) {
        collision2 = collisions[id2] = [];
    }
    let contact = collision1[id2];
    if (contact == null) {
        collision1[id2] = contactPoint;
    }
    contact = collision2[id1];
    if (contact == null) {
        collision2[id1] = contactPoint;
    }
}

function getElementByTowersId(id, collection) {

    for (let i = 0; i < collection.length; i++) {
        const element = collection[i];
        if (element.__towers_id == id) {
            return element;
        }
    }
    return null;
}

function getShapeById(id) {

    return getElementByTowersId(id, shapes);
}

function getBodyById(id) {

    return getElementByTowersId(id, bodies);
}

function btVector3ToJSON(vector) {

    return {
        x: vector.x(),
        y: vector.y(),
        z: vector.z()
    };
}

function write_btVector3(ptr, value) {
    ptr.setX(value.x);
    ptr.setY(value.y);
    ptr.setZ(value.z);
}

function write_btVector4(ptr, value) {
    ptr.setX(value.x);
    ptr.setY(value.y);
    ptr.setZ(value.z);
    ptr.setW(value.w);
}

function btQuaternionToJSON(q) {

    return {
        x: q.x(),
        y: q.y(),
        z: q.z(),
        w: q.w()
    };
}

function make_btVector3(json) {

    return new Ammo.btVector3(json.x, json.y, json.z);
}

function make_btQuaternion(json) {

    return new Ammo.btQuaternion(json.x, json.y, json.z, json.w);
}

function threeGeometryTobtTriangleMesh(geometry) {

    const threeFaces = geometry.faces;
    const triMesh = new Ammo.btTriangleMesh();
    const vertices = geometry.vertices.map(function (v) {
        return new Ammo.btVector3(v.x, v.y, v.z);
    });

    threeFaces.forEach(function (face) {
        const a = vertices[face.a];
        const b = vertices[face.b];
        const c = vertices[face.c];
        triMesh.addTriangle(a, b, c);
    });
    return triMesh;
}

/**
 * This will be called every simulation tick, including sub-steps. Collision detection is done inside this function
 * @param world
 * @param timeStep
 */
function simulationTickCallback(world, timeStep) {

    //collision information extraction
    const numManifolds = dispatcher.getNumManifolds();
    for (let i = 0; i < numManifolds; i++) {
        const contactManifold = dispatcher.getManifoldByIndexInternal(i);
        const body0 = contactManifold.getBody0();
        const body1 = contactManifold.getBody1();
        const numContacts = contactManifold.getNumContacts();
        for (let j = 0; j < numContacts; j++) {
            const pt = contactManifold.getContactPoint(j);
            //intersection
            const ptA = pt.getPositionWorldOnA();
            let ptB = pt.getPositionWorldOnB();
//                console.log("hit!");
            //wrap pointers
            const b0 = Ammo.wrapPointer(body0, Ammo.btRigidBody);
            const b1 = Ammo.wrapPointer(body1, Ammo.btRigidBody);
            registerCollision(b0, b1, btVector3ToJSON(ptA));
//                postMessage({method: "collision", a: b0.__towers_id, b: b1.__towers_id});
        }
    }
    //send out collisions

//    console.log("world: "+world+", timeStep: "+timeStep);
}

const api = {};
api.addShape = function (options) {

    let shape = null;
    switch (options.type) {
        case "sphere":
            shape = new Ammo.btSphereShape(options.radius);
            break;
        case "mesh":
            const triMesh = threeGeometryTobtTriangleMesh(options.mesh);
            shape = new Ammo.btBvhTriangleMeshShape(triMesh, true);
            break;
        case "plane":
            shape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(options.x, options.y, options.z), options.w);
            break;
        case "box":
            shape = new Ammo.btBoxShape(new Ammo.btVector3(options.x, options.y, options.z));
            break;
        case "capsule":
            shape = new Ammo.btCapsuleShape(options.raidus, options.height);
            break;
        default :
            //unsupported type
            break;
    }
    if (shape != null) {
        shape.__towers_id = options.id;
        shapes.push(shape);
//        console.log("shape " + options.id + " added", options);
    }
};
api.addBody = function (options) {

    //defaults
    const position = options.position || { x: 0, y: 0, z: 0 };
    const rotation = options.rotation || { x: 0, y: 0, z: 0, w: 1 };
    const mass = options.mass || 0;
    const shapeId = options.shape;
    //prepare shape
    const shape = getShapeById(shapeId);
    const inertia = new Ammo.btVector3(0, 0, 0);
    if (mass != 0) {
        //dynamic
        shape.calculateLocalInertia(mass, inertia);
    }
    //prepare transform
    const btPosition = make_btVector3(position);
    const btQuaternion = new Ammo.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    const transform = new Ammo.btTransform(btQuaternion, btPosition);
    //motion state
    const motionState = new Ammo.btDefaultMotionState(transform);
    const constructionInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, inertia);
    //create the body
    const body = new Ammo.btRigidBody(constructionInfo);
    if (options.friction && options.friction != 0) {
        body.setFriction(options.friction);
    }
    //linear velocity
    const linearVelocity = options.linearVelocity;
    if (linearVelocity) {
        body.setLinearVelocity(make_btVector3(linearVelocity));
    }
    //angular factor, affecting impulses and forces
    const angularFactor = options.angularFactor;
    if (angularFactor && (angularFactor.x != 1 || angularFactor.y != 1 || angularFactor.z != 1)) {
        body.setAngularFactor(make_btVector3(angularFactor));
    }
    //custom gravity
    const gravity = options.gravity;
    if (gravity) {
        body.setFlags(btRigidBodyFlags.BT_DISABLE_WORLD_GRAVITY);
    }
    const disableCollisionResponse = options.disableCollisionResponse;
    if (disableCollisionResponse) {
        body.setCollisionFlags(body.getCollisionFlags() | CollisionFlags.CF_NO_CONTACT_RESPONSE);
    }
    dynamicsWorld.addRigidBody(body);
    body.__towers_id = options.id;
    bodies.push(body);
};
api.removeBody = function (options) {

    const body = getBodyById(options.id);
    dynamicsWorld.removeRigidBody(body);
    Ammo.destroy(body); //clean up
    bodies.splice(bodies.indexOf(body), 1); //remove from array
};
api.writeBodyAttributes = function (options) {

    for (let i = 0; i < options.length; i++) {
        const obj = options[i];
        const body = getBodyById(obj.id);
        const attributes = obj.attributes;
        let t, v3, v4;
        for (let prop in attributes) {
            if (!attributes.hasOwnProperty(prop)) {
                continue;
            }
            const value = attributes[prop];
            switch (prop) {
                case "linearVelocity":
//                    body.setLinearVelocity(make_btVector3(value));
                    v3 = body.getLinearVelocity();
                    write_btVector3(v3, value);
                    break;
                case "position":
                    t = body.getWorldTransform();
                    v3 = t.getOrigin();
                    write_btVector3(v3, value);
//                    t.setOrigin(make_btVector3(value));
                    break;
                case "rotation":
                    t = body.getWorldTransform();
                    v4 = t.getRotation();
                    write_btVector4(v4, value);
//                    t.setRotation(make_btQuaternion(value));
                    break;
                default :
                    console.warn("unknown body property " + prop);
            }
            //
        }
        body.activate(); //wake up the body
    }
};

const raytest_from = new Ammo.btVector3(0, 0, 0),
    raytest_to = new Ammo.btVector3(0, 0, 0);
api.rayTest = function (options) {
    const from = options.from;
    const to = options.to;
    write_btVector3(raytest_from, from);
    write_btVector3(raytest_to, to);
    const cb = new Ammo.ClosestRayResultCallback(raytest_from, raytest_to);
    dynamicsWorld.rayTest(raytest_from, raytest_to, cb);
    if (cb.hasHit()) {
        const hitPointWorld = cb.get_m_hitPointWorld();
        let hitNormalWorld = cb.get_m_hitNormalWorld();
        // Do some clever stuff here
        postMessage({ method: "rayHit", point: btVector3ToJSON(hitPointWorld) });
    } else {
        postMessage({ method: "rayMiss" });
    }
    Ammo.destroy(cb);
};
api.rayCast = function (options) {
    const from = options.from;
    const to = options.to;
    write_btVector3(raytest_from, from);
    write_btVector3(raytest_to, to);
    const cb = new Ammo.btCollisionWorld.AllHitsRayResultCallback(raytest_from, raytest_to);
    const points = [];
    if (cb.hasHit()) {
        const hitPointWorld = cb.get_m_hitPointWorld();
//        var hitNormalWorld = cb.get_m_hitNormalWorld();
        // Do some clever stuff here
        const length = hitPointWorld.size();
        for (let i = 0; i < length; i++) {
            const at = hitPointWorld.at(i);
            points.push(btVector3ToJSON(at));
        }
    } else {
    }

    destroy(cb);
    postMessage({ method: "rayCast", points: points });
};

function sendCollisions() {
    const count = collisions.reduce(function (prev, val) {
        return prev + val.length;
    }, 0);
    const i = count * 2;
    const data = new Int32Array(i);
    collisions.forEach(function (val, id1) {
        val.forEach(function (v, id2) {
            data[--i] = id1;
            data[--i] = id2;
        });
    });
    postMessage({ method: "collisions", pairs: data }, [data.buffer]);
}

api.simulate = function (delta) {

    const substeps = 2;
    //reset collision matrix
    collisions = [];
    //tell simulation world to perform step
    dynamicsWorld.stepSimulation(delta, substeps);
    const ids = new Int32Array(bodies.length);
    const states = new Float32Array(bodies.length * 10);
    bodies.forEach(function (body, index) {
        body.getMotionState().getWorldTransform(transform);
        const origin = transform.getOrigin();
        const rotation = transform.getRotation();
        const id = body.__towers_id;
        const linearVelocity = body.getLinearVelocity();
        ids[index] = id;
        const j = (index * 10);
        //position
        states[j] = origin.x();
        states[j + 1] = origin.y();
        states[j + 2] = origin.z();
        //rotation
        states[j + 3] = rotation.x();
        states[j + 4] = rotation.y();
        states[j + 5] = rotation.z();
        states[j + 6] = rotation.w();
        //velocity
        states[j + 7] = linearVelocity.x();
        states[j + 8] = linearVelocity.y();
        states[j + 9] = linearVelocity.z();
        // the reason for mapping is the fact that JS will use map internally for our contacts array, but when passing
        // out - it will end up as a large sparse array, and that would take a lot of memory
//        var bodyCollisions = collisions[body.__towers_id];
//        if (bodyCollisions) {
//            var contacts = info.collisions = [];
//            bodyCollisions.forEach(function (val, key) {
//                contacts.push({t: key, p: val});
//            });
//        }
//        message.push(info);
    });
    postMessage({ method: "updateState", ids: ids, states: states }, [ids.buffer, states.buffer]);
    sendCollisions();
};
api.applyCentralImpulse = function (data) {

    for (let i = 0; i < data.length; i++) {
        const pair = data[i];
        const id = pair.id;
        const value = pair.value;
        const body = getBodyById(id);
        body.applyCentralImpulse(make_btVector3(value));
        body.activate();
    }
};
onmessage = function (event) {
    const data = event.data;
    const method = api[data.method];
    if (method) {
        method(data.options);
    } else {
        console.error(data.method, "is not a supported method");
    }
};

postMessage({ method: "workerReady", options: null });