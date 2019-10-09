/**
 * User: Alex Goldring
 * Date: 1/6/2014
 * Time: 08:37
 */


import Vector3 from '../../../core/geom/Vector3';
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";

function Steering(options) {
    if (options === undefined) {
        options = {};
    }
    this.maxSpeed = options.maxSpeed !== undefined ? options.maxSpeed : 1;
    this.destination = options.destination || null;
    this.targetMargin = new Vector3(0.001, 0.001, 0.001);
    if (typeof options.targetMargin === "object") {
        this.targetMargin.copy(options.targetMargin);
    }
    this.rotationSpeed = options.rotationSpeed || 90 * (Math.PI / 180);
}

Steering.typeName = "Steering";

Steering.prototype.fromJSON = function (json) {
    if (json.maxSpeed !== undefined) {
        this.maxSpeed = json.maxSpeed;
    }
    if (json.rotationSpeed !== undefined) {
        this.rotationSpeed = json.rotationSpeed;
    }
    if (json.targetMargin !== undefined) {
        this.targetMargin.fromJSON(json.targetMargin);
    }
};

Steering.prototype.toJSON = function () {
    return {
        maxSpeed: this.maxSpeed,
        rotationSpeed: this.rotationSpeed,
        targetMargin: this.targetMargin.toJSON()
    };
};

export default Steering;

export class SteeringSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Steering;
        this.version = 0;
    }
}
