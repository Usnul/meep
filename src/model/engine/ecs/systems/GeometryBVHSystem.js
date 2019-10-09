/**
 * Created by Alex on 02/02/2015.
 */
import { System } from '../System';
import GeometryBVH from '../components/GeometryBVH';
import BVHFromGeometry from '../../../graphics/geometry/bvh/BVHFromGeometry';


class GeometryBVHSystem extends System {
    constructor(grid) {
        super();
        this.componentClass = GeometryBVH;
        //
        this.entityManager = null;
        this.grid = grid;
    }

    unlink(component, entity) {
    }

    link(component, entity) {
        //build bvh
        const g = component.geometry;
        //check if bvh exists
        if (component.bvh === null) {
            component.bvh = BVHFromGeometry(g);
        }
    }

    update(timeDelta) {
    }
}


export default GeometryBVHSystem;
