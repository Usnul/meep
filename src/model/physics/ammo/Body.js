/**
 * Created by Alex on 19/02/14.
 */
import Quaternion from '../../core/geom/Quaternion';
import Vector3 from "../../core/geom/Vector3.js";

/**
 *
 * @param {Object} options
 * @constructor
 */
const Body = function (options) {
    if (!options) {
        options = {};
    }

    this.id = -1;

    this.shape = options.shape || null;
    this.position = new Vector3();
    this.rotation = new Quaternion();
    this.linearVelocity = new Vector3();
    if (options.position !== void 0) {
        this.position.copy(options.position);
    }
    if (options.rotation !== void 0) {
        this.rotation.copy(options.rotation);
    }
    if (options.linearVelocity !== void 0) {
        this.linearVelocity.copy(options.linearVelocity);
    }
    this.angularFactor = options.angularFactor || new Vector3(1, 1, 1);
    this.mass = options.mass || 0;
    this.friction = options.friction || 0;
    this.disableGravity = options.disableGravity || false;
    this.disableCollisionResponse = options.disableCollisionResponse || false;
    //
    const self = this;
    this.changedAttributes = [];
    [
        "position",
        "rotation",
        "linearVelocity"
    ].forEach(function (prop) {

        this[prop].onChange.add(function () {
            self.changedAttributes.push(prop);
        });
    }, this);

    //callbacks
    this.__callbacksChange = [];
    this.__callbacksCollision = [];
    //central impulse
    this.__centralImpulse = null;
    //Collision contacts
    this.__contacts = [];
};
Body.prototype.getContacts = function () {
    return this.__contacts;
};
Body.prototype.onChange = function (f) {
    this.__callbacksChange.push(f);
};
Body.prototype.update = function (newPosition, newRotation, newLinearVelocity) {
    let hasChanged = false;
    const position = this.position;
    if (position.x !== newPosition.x || position.y !== newPosition.y || position.z !== newPosition.z) {
        position.set(newPosition.x, newPosition.y, newPosition.z);
        hasChanged = true;
    }
    const rotation = this.rotation;
    if (rotation.x !== newRotation.x || rotation.y !== newRotation.y || rotation.z !== newRotation.z || rotation.w !== newRotation.w) {
        rotation.set(newRotation.x, newRotation.y, newRotation.z, newRotation.w);
        hasChanged = true;
    }
    const linearVelocity = this.linearVelocity;
    if (linearVelocity.x !== newLinearVelocity.x || linearVelocity.y !== newLinearVelocity.y || linearVelocity.z !== newLinearVelocity.z) {
        linearVelocity.copy(newLinearVelocity);
    }
    if (hasChanged) {
        //execute callbacks
        this.__callbacksChange.forEach(function (callback) {
            callback();
        });
    }
};
Body.prototype.applyCentralImpulse = function (force) {

    if (this.__centralImpulse) {
        this.__centralImpulse.add(force);
    } else {
        //impulse not defined
        this.__centralImpulse = new Vector3(force.x, force.y, force.z);
    }
};
Body.prototype.onCollision = function (f) {
    this.__callbacksCollision.push(f);
};
Body.prototype.collide = function (otherBody) {
    this.__callbacksCollision.forEach(function (callback) {
        callback(otherBody);
    });
};
export default Body;

