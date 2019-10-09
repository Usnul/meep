/**
 * User: Alex Goldring
 * Date: 1/10/2014
 * Time: 21:29
 */
import Vector3 from "../../../core/geom/Vector3.js";

function ClingToHeightMap(options) {
    if (options === void 0) {
        options = {};
    }
    this.normalAlign = options.normalAlign !== void 0 ? options.normalAlign : false;
    this.sampleCount = options.sampleCount !== void 0 ? options.sampleCount : 1;
    this.samplingRadius = options.samplingRadius !== void 0 ? options.samplingRadius : 0;
    const inf = Number.POSITIVE_INFINITY;
    this.__prevPosition = new Vector3(inf, inf, inf);
}

export default ClingToHeightMap;
