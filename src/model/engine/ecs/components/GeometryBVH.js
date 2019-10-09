/**
 * Created by Alex on 02/02/2015.
 */
import { Ray as ThreeRay, Vector3 as ThreeVector3 } from 'three';

function GeometryBVH(geometry) {
    this.geometry = geometry;
    this.bvh = null;
}

GeometryBVH.prototype.raycast = (function () {
    const hit = new ThreeVector3();
    const ray = new ThreeRay();

    function raycast(origin, direction, callback) {
        const geometry = this.geometry;
        const vertices = geometry.vertices;
        let hitCount = 0;
        this.bvh.traverseRayLeafIntersections(origin.x, origin.y, origin.z, direction.x, direction.y, direction.z, function (leaf) {
            const face = leaf.object;
            hitCount++;
            ray.set(origin, direction);
            const vA = vertices[face.a];
            const vB = vertices[face.b];
            const vC = vertices[face.c];
            let hitFound = ray.intersectTriangle(vA, vB, vC, false, hit);
            if (hitFound) {
                callback(hit, face, geometry);
            } else {
                //try opposite way
                hitFound = ray.intersectTriangle(vC, vB, vA, false, hit);
                if (hitFound) {
                    callback(hit, face, geometry);
                }
            }
        });
    }

    return raycast;
})();

GeometryBVH.typeName = "GeometryBVH";

export default GeometryBVH;