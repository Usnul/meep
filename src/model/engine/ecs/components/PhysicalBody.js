/**
 * Created by Alex on 01/04/2014.
 */
import Vector3 from "../../../core/geom/Vector3";

let Shape = function () {
    this.type = void 0;
};
const BoxShape = function (options) {
    this.type = "box";
    const s = options.size;
    this.size = new Vector3(s.x, s.y, s.z);
};
const SphereShape = function (options) {
    this.type = "sphere";
    this.radius = options.radius;
};

function makeShape(desc) {
    switch (desc.type) {
        case "box":
            return new BoxShape(desc);
        case "sphere":
            return new SphereShape(desc);
        default:
            return desc;
    }
}

function PhysicalBody(options) {
    this.shape = makeShape(options.shape);
    this.velocity = new Vector3();
    this.linearDamping = options.linearDamping !== void 0 ? options.linearDamping : 0;
    this.angularVelocity = new Vector3();
    this.rotationAxis = new Vector3();
    //this.friction = options.friction !== void 0 ? options.friction : 0;
    if (options.rotationAxis !== void 0) {
        this.rotationAxis.copy(options.rotationAxis);
    }
    this.mass = options.mass !== void 0 ? options.mass : 0;
    this.collisionResponse = options.collisionResponse !== void 0 ? options.collisionResponse : true;
    //
    if (options.velocity !== void 0) {
        this.velocity.copy(options.velocity);
    }
    if (options.angularVelocity !== void 0) {
        this.angularVelocity.copy(options.angularVelocity);
    }
}

export default PhysicalBody;
