/**
 * User: Alex Goldring
 * Date: 7/4/2014
 * Time: 20:41
 */
import Vector3 from '../../../core/geom/Vector3';
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";


function Motion(options) {
    if (options === void 0) {
        options = {};
    }
    this.velocity = new Vector3();
    const velocity = options.velocity;
    if (velocity) {
        this.velocity.copy(velocity);
    }
}


Motion.typeName = "Motion";

Motion.prototype.toJSON = function () {
    return {
        velocity: this.velocity.toJSON()
    };
};

Motion.prototype.fromJSON = function (json) {
    this.velocity.fromJSON(json.velocity);
};

export default Motion;


export class MotionSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Motion;
        this.version = 0;
    }
}
