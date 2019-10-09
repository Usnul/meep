/**
 * Created by Alex on 18/12/2014.
 */

import Vector2 from "../../../core/geom/Vector2.js";

function ViewportMeshProjection(options) {
    if (options === void 0) {
        options = {};
    }
    this.position = options.position !== void 0 ? options.position : new Vector2();
    this.entity = options.entity;
}


ViewportMeshProjection.typeName = "ViewportMeshProjection";

export default ViewportMeshProjection;
