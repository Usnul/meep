/**
 * Created by Alex on 17/11/2014.
 */


/**
 * Axis-Aligned Bounding Box
 * @param options
 * @constructor
 */
function AABB(options) {
    let s = this.size = {
        x: options.x !== void 0 ? options.x : 0,
        y: options.y !== void 0 ? options.y : 0,
        z: options.z !== void 0 ? options.z : 0
    };
    this.position = {
        x: 0,
        y: 0,
        z: 0
    };
    this.positionOffset = {
        x: 0,
        y: 0,
        z: 0
    };
    this.__bvhLeaf = void 0;
}


AABB.typeName = "AABB";

export default AABB;
