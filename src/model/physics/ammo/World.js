/**
 * Created by Alex on 01/02/14.
 */
import IdPool from '../../core/IdPool';
import Vector3 from "../../core/geom/Vector3.js";

/**
 *
 * @param {Vector3} v3
 * @returns {{x: number, y: number, z: number}}
 */
function v3_toJSON(v3) {
    return { x: v3.x, y: v3.y, z: v3.z };
}

const World = function (readyCallback) {
    this.worker = new Worker("src/model/physics/PhysicsWorker.js");
    this.shapeIdPool = new IdPool();
    this.bodyIdPool = new IdPool();

    /**
     *
     * @type {Shape[]}
     */
    this.shapes = [];

    /**
     *
     * @type {Body[]}
     */
    const bodies = this.bodies = [];
    this.__updateCallbacks = [];
    const raytestCallbacks = this.__raytestCallbacks = [];
    const raycastCallbacks = this.__raycastCallbacks = [];
    const stepDoneCallbacks = this.__stepDoneCallbacks = [];

    const api = {
        updateState: function (data) {
            const ids = data.ids;
            const ts = data.states;

            for (let i = 0; i < ids.length; i++) {

                const id = ids[i];
                const body = bodies[id];

                if (body !== void 0) {
                    const j = (i * 10);

                    body.position.set(ts[j], ts[j + 1], ts[j + 2]);
                    body.rotation.set(ts[j + 3], ts[j + 4], ts[j + 5], ts[j + 6]);
                    body.linearVelocity.set(ts[j + 7], ts[j + 8], ts[j + 9]);
                    body.changedAttributes = [];

                }

            }

            if (stepDoneCallbacks.length > 0) {
                const callback = stepDoneCallbacks.shift();
                callback();
            }

        },
        collisions: function (data) {
            const pairs = data.pairs;
            for (let i = 0; i < pairs.length; i += 2) {
                const a = pairs[i],
                    b = pairs[i + 1];
                const b1 = bodies[a];
                const b2 = bodies[b];
                if (b1 !== void 0 && b2 !== void 0) {
                    b1.collide(b2);
                    b2.collide(b1);
                }
            }
        },
        rayHit: function (data) {
            const callback = raytestCallbacks.shift();
            callback(true, data.point)
        },
        rayMiss: function (data) {
            const callback = raytestCallbacks.shift();
            callback(false, null);
        },
        rayCast: function (data) {
            const callback = raycastCallbacks.shift();
        },
        workerReady: function () {
            if (readyCallback !== void 0) {
                readyCallback();
            }
        }
    };
    //


    this.worker.onmessage = function (event) {
        const data = event.data;
        const methodName = data.method;
        const method = api[methodName];
        if (method !== void 0) {
            method(data);
        } else {
            throw new Error("received unknown callback from worker '" + methodName + "'");
        }

    };

};

/**
 *
 * @param {number} id
 * @returns {Body}
 */
World.prototype.getBodyById = function (id) {
    const bodies = this.bodies;
    return bodies[id];
};

/**
 *
 * @param {Array} update
 */
World.prototype.updateBodies = function (update) {
    let i;

    for (i = 0; i < update.length; i++) {
        const info = update[i];
        const position = info.position;
        const rotation = info.rotation;
        const linearVelocity = info.linearVelocity;
        const collisions = info.collisions;
        const id = info.id;
        //get mapped objects
        const body = this.getBodyById(id);
        if (body === undefined || body === null) {
//                console.error("Received update for body " + id + " which no longer exists");
            continue; //this is really an error, but it doesn't seem to cause a leak, it's a synchronization issue
        }
        body.__contacts = [];                    //reset contacts
        if (collisions) {
            //process collisions
            collisions.forEach(function (contact) {
                const body_id = contact.t;
                const otherBody = this.getBodyById(body_id);
                const p = contact.p;
                const contactPoint = new Vector3(p.x, p.y, p.z);
                const contactObj = { target: otherBody, position: contactPoint };
                body.__contacts.push(contactObj);
                body.collide(otherBody);
            }, this);
        }
        body.update(position, rotation, linearVelocity);
        body.changedAttributes = [];
    }

    for (i = 0; i < this.__updateCallbacks.length; i++) {
        this.__updateCallbacks[i]();
    }
};

/**
 *
 * @param {Shape} shape
 */
World.prototype.addShape = function (shape) {
    if (shape.id == null) {
        shape.id = this.shapeIdPool.get();
    }
    this.shapes.push(shape);
    this.worker.postMessage({ method: "addShape", options: shape });
};


/**
 *
 * @param {Body} body
 */
World.prototype.addBody = function (body) {
    if (body.id == null) {
        body.id = this.bodyIdPool.get();
    }
    const shape = body.shape;
    if (shape == null) {
        console.error("shape can not be null");
        return;
    }
    //check if shape is registered
    if (this.shapes.indexOf(shape) < 0) {
        //if not registered - add it
        this.addShape(shape);
    }
    const options = {
        shape: shape.id,
        rotation: body.rotation.toJSON(),
        position: body.position.toJSON(),
        linearVelocity: body.linearVelocity.toJSON(),
        angularFactor: body.angularFactor.toJSON(),
        gravity: body.disableGravity,
        disableCollisionResponse: body.disableCollisionResponse,
        id: body.id,
        mass: body.mass,
        friction: body.friction
    };
    body.changedAttributes = [];
    const worker = this.worker;
    this.bodies[body.id] = body;
    worker.postMessage({ method: "addBody", options: options });
};

/**
 *
 * @param {Body} body
 */
World.prototype.removeBody = function (body) {

    const options = {
        id: body.id
    };

    this.worker.postMessage({ method: "removeBody", options: options });

    delete this.bodies[body.id];

    this.bodyIdPool.release(body.id);
};

World.prototype.sendImpulses = function () {
    //get list of bodies with impulses
    const bodies = this.bodies;

    const options = [];

    for (let i in bodies) {
        if (!bodies.hasOwnProperty(i)) {
            continue;
        }
        const body = bodies[i];
        const value = body.__centralImpulse;
        if (value == null) {
            continue;
        }
        options.push({
            id: body.id,
            value: value.toJSON()
        });
        body.__centralImpulse = null;
    }

    if (options.length > 0) {
        this.worker.postMessage({ method: "applyCentralImpulse", options: options });
    }
};

World.prototype.writeChangedAttributes = function () {
    let body;
    const bodies = this.bodies;
    const options = [];
    for (let i in bodies) {
        if (!bodies.hasOwnProperty(i)) {
            continue;
        }
        body = bodies[i];
        const changedAttributes = body.changedAttributes;
        const numChangedAttributes = changedAttributes.length;
        if (numChangedAttributes > 0) {
            const attributes = {};
            for (let j = 0; j < numChangedAttributes; j++) {
                const attrName = changedAttributes[j];
                let value = body[attrName];
                if (typeof value["toJSON"] === "function") {
                    value = value.toJSON();
                }
                attributes[attrName] = value;
            }
            options.push({
                id: body.id,
                attributes: attributes
            });
        }
    }
    if (options.length > 0) {
        this.worker.postMessage({ method: "writeBodyAttributes", options: options });
    }
};

/**
 *
 * @param {Vector3} from
 * @param {Vector3} to
 * @param {function<Vector3>} callback
 */
World.prototype.rayTest = function (from, to, callback) {
    this.__raytestCallbacks.push(callback);
    this.worker.postMessage({
        method: "rayTest",
        options: {
            from: v3_toJSON(from), to: v3_toJSON(to)
        }
    });
};

/**
 *
 * @param {Vector3} from
 * @param {Vector3} to
 * @param {function} callback
 */
World.prototype.rayCast = function (from, to, callback) {
    this.__raycastCallbacks.push(callback);
    this.worker.postMessage({
        method: "rayCast",
        options: {
            from: v3_toJSON(from), to: v3_toJSON(to)
        }
    });
};

/**
 *
 * @param {number} delta
 * @param {function} callback
 */
World.prototype.simulate = function (delta, callback) {
    //send impulses if there are any
    this.writeChangedAttributes();
    this.sendImpulses();
    //post simulation request
    if (callback) {
        this.__stepDoneCallbacks.push(callback);
    }
    this.worker.postMessage({ method: "simulate", options: delta });
};

export default World;
