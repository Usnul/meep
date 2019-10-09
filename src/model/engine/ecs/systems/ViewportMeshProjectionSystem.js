/**
 * Created by Alex on 18/12/2014.
 */
import { System } from '../System';
import Transform from '../components/Transform';
import Renderable from '../components/Renderable';
import GeometryBVH from '../components/GeometryBVH';
import ViewportMeshProjection from '../components/ViewportMeshProjection';
import { Vector3 as ThreeVector3 } from 'three';

class VMPS extends System {
    /**
     *
     * @param {GraphicsEngine} graphicsEngine
     * @constructor
     */
    constructor(graphicsEngine) {
        super();
        this.graphicEngine = graphicsEngine;
        this.componentClass = ViewportMeshProjection;  //small number
        this.update = (function () {
            const source = new ThreeVector3();
            const target = new ThreeVector3();

            function update(timeDelta) {
                const ge = this.graphicEngine;
                const em = this.entityManager;
                em.traverseEntities([ViewportMeshProjection, Transform], function (p, t, e) {
                    const v2 = p.position;
                    const geometryBVH = em.getComponent(p.entity, GeometryBVH);
                    if (geometryBVH !== null) {
                        //bvh exists
                        ge.viewportProjectionRay(v2.x, v2.y, source, target);
                        geometryBVH.raycast(source, target, function (point) {
                            if (t.position.distanceToSquared(point) > EPSILON) {
                                t.position.copy(point);
                            }
                        });
                    } else {
                        //no bvh, use mesh directly
                        const renderable = em.getComponent(p.entity, Renderable);
                        const hits = ge.intersectObjectUnderViewportPoint(v2.x, v2.y, renderable.mesh, true);
                        if (hits !== void 0 && hits.length > 0) {
                            //take first hit
                            const hit = hits[0];
                            const point = hit.point;
                            if (t.position.distanceToSquared(point) > EPSILON) {
                                t.position.copy(point);
                            }
                        }
                    }


                });
            }

            return update;
        })();
    }
}


const EPSILON = 0.00001;

export default VMPS;