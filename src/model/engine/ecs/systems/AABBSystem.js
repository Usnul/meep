/**
 * Created by Alex on 17/11/2014.
 */
import { System } from '../System';
import AABB from '../components/AABB';
import Transform from '../components/Transform';
import { BinaryNode } from '../../../core/bvh2/BinaryNode';

class AABBSystem extends System {
    constructor() {
        super();

        this.componentClass = AABB;
        const bvh = this.bvh = new BinaryNode();
        bvh.setBounds(0, 0, 0, 0, 0, 0);
    }

    traverseLineSegment(startX, startY, startZ, endX, endY, endZ, visitor) {
        this.bvh.traverseSegmentLeafIntersections(startX, startY, startZ, endX, endY, endZ, function (leaf) {
            visitor(leaf.object);
        });
    }

    link(aabb, entity) {
        const em = this.entityManager;
        const bvh = this.bvh;
        em.getComponentAsync(entity, Transform, function (transform) {
            const p = transform.position;
            const s = aabb.size;
            const o = aabb.positionOffset;
            const x2 = s.x / 2;
            const y2 = s.y / 2;
            const z2 = s.z / 2;
            //
            const px = p.x + o.x,
                py = p.y + o.y,
                pz = p.z + o.z;
            const x0 = px - x2,
                y0 = py - y2,
                z0 = pz - z2,
                x1 = px + x2,
                y1 = py + y2,
                z1 = pz + z2;
            aabb.__bvhLeaf = bvh.insert(x0, y0, z0, x1, y1, z1, entity);
        });
    }

    unlink(component, entity) {
        if (component.__bvhLeaf !== void 0) {
            component.__bvhLeaf.remove();
        }
    }

    update(timeDelta) {
        const em = this.entityManager;
        em.traverseEntities([AABB, Transform], function (aabb, transform, entity) {
            const p0 = transform.position;
            const offset = aabb.positionOffset;
            const x0 = p0.x + offset.x,
                y0 = p0.y + offset.y,
                z0 = p0.z + offset.z;
            const p1 = aabb.position;
            if (x0 !== p1.x || y0 !== p1.y || z0 !== p1.z) {
                let dx = x0 - p1.x,
                    dy = y0 - p1.y,
                    dz = z0 - p1.z;
                //
                const s = aabb.size;
                const x2 = s.x / 2,
                    y2 = s.y / 2,
                    z2 = s.z / 2;
                //aabb.__bvhLeaf.move(dx, dy, dz);
                aabb.__bvhLeaf.resize(x0 - x2, y0 - y2, z0 - z2, x0 + x2, y0 + y2, z0 + z2);
                //
                p1.x = x0;
                p1.y = y0;
                p1.z = z0;
            }
        });
    }
}


export default AABBSystem;
