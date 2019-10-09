/**
 * Created by Alex on 01/04/2014.
 */


import { LeafNode } from "../../../core/bvh2/LeafNode.js";
import { AABB3 } from "../../../core/bvh2/AABB3.js";

function Renderable(object) {
    this.object = object;

    this.boundingBox = new AABB3(0, 0, 0, 0, 0, 0);

    this.bvh = new LeafNode(object, 0, 0, 0, 0, 0, 0);

    /**
     *
     * @type {boolean}
     */
    this.matrixAutoUpdate = true;
}

Renderable.typeName = "Renderable";

Renderable.serializable = false;

export default Renderable;
