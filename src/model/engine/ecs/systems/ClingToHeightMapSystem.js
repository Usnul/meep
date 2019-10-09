/**
 * User: Alex Goldring
 * Date: 1/10/2014
 * Time: 21:32
 */
import { System } from '../System';
import ClingToHeightMap from '../components/ClingToHeightMap';
import Transform from '../components/Transform';
import { Euler as ThreeEuler, Matrix4 as ThreeMatrix4, Vector2 as ThreeVector2, Vector3 as ThreeVector3 } from 'three';

class ClingToHeightMapSystem extends System {
    constructor(grid) {
        super();
        this.componentClass = ClingToHeightMap;
        //
        this.entityManager = null;
        this.grid = grid;
        this.update = function () {
            const uv = new ThreeVector2();
            let u, v;
            const euler = new ThreeEuler();
            const normal = new ThreeVector3();
            const m = new ThreeMatrix4();
            const vUp = new ThreeVector3(0, 1, 0);
            const vOrigin = new ThreeVector3();

            function update(timeDelta) {
                const entityManager = this.entityManager;
                const terrain = this.terrain;
                if (terrain === void 0) {
                    return 0;
                }
                const grid = this.grid;
                const heightSampler = terrain.samplerHeight;
                const samplerNormal = terrain.samplerNormal;
                entityManager.traverseEntities([ClingToHeightMap, Transform], function (clingon, transform) {
                    const position = transform.global.position;
                    if (position.equals(clingon.__prevPosition)) {
                        return; //already correct placement
                    } else {
                        clingon.__prevPosition.copy(position);
                    }
                    grid.pointWorld2Grid(position, uv);
                    uv.divide(grid.size);
                    u = uv.x;
                    v = uv.y;
                    position.y = heightSampler.sample(u, v);
                    transform.setGlobalPosition(position.x, position.y, position.z);
                    //
                    if (clingon.normalAlign) {
                        if (clingon.samplingRadius !== 0 && clingon.sampleCount > 1) {
                            //more than one sample is to be used to compute normal by averaging
                            sampleNormalOnDisk(clingon.sampleCount, clingon.samplingRadius, samplerNormal, uv, normal);
                        } else {
                            samplerNormal.sample(u, v, normal);
                        }
                        vOrigin.set(0, 0, 0);
                        vUp.set(0, 1, 0);
                        //normal.set(-normal.x, normal.z, -normal.y);
                        //
                        m.identity();
                        m.lookAt(normal, vOrigin, vUp);
                        euler.setFromRotationMatrix(m, "XZY");
                        if (Math.abs(euler.y) + 0.0001 >= Math.PI) {
                            euler.z = -euler.z;
                        }
                        euler.y = 0; //drop rotation orthogonal to terrain
                        transform.rotation.setFromEuler(euler);
                    }
                });
            }

            return update;
        }();
    }

    remove(component) {
    }

    add(component) {
    }

    clearCache() {
        const em = this.entityManager;
        em.traverseEntities([ClingToHeightMap], function (clingon) {
            clingon.__prevPosition.set(Number.NaN, Number.NaN, Number.NaN);
        });
    }
}


const sampleNormalOnDisk = (function () {
    const tempNormal = new ThreeVector3();
    const offset = new ThreeVector2();
    const PI2 = Math.PI * 2;

    //TODO consider plane-fitting algorithm from: http://www.ilikebigbits.com/blog/2015/3/2/plane-from-points
    /*
     // source: http://www.ilikebigbits.com/blog/2015/3/2/plane-from-points
     // @author Emil Ernerfeldt
     // Constructs a plane from a collection of points
     // so that the summed squared distance to all points is minimzized
     fn plane_from_points(points: &[Vec3]) -> Plane {
     let n = points.len();
     assert!(n >= 3, "At least three points required");

     let mut sum = Vec3{x:0.0, y:0.0, z:0.0};
     for p in points {
     sum = &sum + &p;
     }
     let centroid = &sum * (1.0 / (n as f64));

     // Calc full 3x3 covariance matrix, excluding symmetries:
     let mut xx = 0.0; let mut xy = 0.0; let mut xz = 0.0;
     let mut yy = 0.0; let mut yz = 0.0; let mut zz = 0.0;

     for p in points {
     let r = p - &centroid;
     xx += r.x * r.x;
     xy += r.x * r.y;
     xz += r.x * r.z;
     yy += r.y * r.y;
     yz += r.y * r.z;
     zz += r.z * r.z;
     }

     let det_x = yy*zz - yz*yz;
     let det_y = xx*zz - xz*xz;
     let det_z = xx*yy - xy*xy;

     let det_max = max3(det_x, det_y, det_z);
     assert!(det_max > 0.0, 'The points don't span a plane");

     // Pick path with best conditioning:
     let dir =
     if det_max == det_x {
     let a = (xz*yz - xy*zz) / det_x;
     let b = (xy*yz - xz*yy) / det_x;
     Vec3{x: 1.0, y: a, z: b}
     } else if det_max == det_y {
     let a = (yz*xz - xy*zz) / det_y;
     let b = (xy*xz - yz*xx) / det_y;
     Vec3{x: a, y: 1.0, z: b}
     } else {
     let a = (yz*xy - xz*yy) / det_z;
     let b = (xz*xy - yz*xx) / det_z;
     Vec3{x: a, y: b, z: 1.0}
     };

     plane_from_point_and_normal(&centroid, &normalize(dir))
     }
     */
    function sampleNormalOnDisk(sampleCount, radius, sampler, origin, result) {
        const radiusU = radius / sampler.width;
        const radiusV = radius / sampler.height;
        result.set(0, 0, 0);
        for (let i = 0; i < sampleCount; i++) {
            const angle = PI2 * (i / sampleCount);
            offset.set(radiusU * Math.cos(angle), radiusV * Math.sin(angle));
            sampler.sample(origin.x + offset.x, origin.y + offset.y, tempNormal);
            result.add(tempNormal);
        }
        result.normalize();
    }

    return sampleNormalOnDisk;
})();

export default ClingToHeightMapSystem;
