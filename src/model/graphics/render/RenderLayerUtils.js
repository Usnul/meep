import Vector3 from "../../core/geom/Vector3.js";
import { compute3PlaneIntersection, computePointDistanceToPlane } from "../../core/geom/Plane.js";

/**
 *
 * @param {function(function(Plane))} traversePlanes
 * @param {number} [bias=0]
 * @returns {Function}
 */
export function buildPlanarRenderLayerClipPlaneComputationMethod(traversePlanes, bias = 0) {

    const p = new Vector3();

    /**
     *
     * @param {Frustum} frustum
     * @param {number} near
     * @param {number} far
     * @param {function(near:number, far:number)} visitor
     */
    return function (frustum, near, far, visitor) {

        const frustumPlanes = frustum.planes;

        const nearPlane = frustumPlanes[4];


        const adjacentPlanePairs = [
            [frustumPlanes[0], frustumPlanes[2]],
            [frustumPlanes[0], frustumPlanes[3]],

            [frustumPlanes[1], frustumPlanes[2]],
            [frustumPlanes[1], frustumPlanes[3]],
        ];

        traversePlanes(function (objectPlane) {

            adjacentPlanePairs.forEach(function (pair) {
                const [p0, p1] = pair;

                const planeIntersection = compute3PlaneIntersection(p, p0, p1, objectPlane);

                if (!planeIntersection) {
                    //no intersection
                    return;
                }


                const distanceToNearPlane = computePointDistanceToPlane(p.x, p.y, p.z, nearPlane.normal.x, nearPlane.normal.y, nearPlane.normal.z, nearPlane.constant);

                //update near and far plane distances
                if (distanceToNearPlane > 0 && distanceToNearPlane < near) {
                    near = distanceToNearPlane;
                }

                if (distanceToNearPlane > far) {
                    far = distanceToNearPlane;
                }
            });
        });

        if (near <= far) {
            visitor(near - bias, far + bias);
        }
    };

}