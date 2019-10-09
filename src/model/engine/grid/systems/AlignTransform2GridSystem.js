/**
 * Created by Alex on 20/01/2015.
 */
import { System } from '../../ecs/System';
import Transform from '../../ecs/components/Transform';
import AlignTransform2Grid from '../components/AlignTransform2Grid';
import Vector3 from "../../../core/geom/Vector3.js";
import Vector2 from "../../../core/geom/Vector2.js";

class AlignTransform2GridSystem extends System {
    /**
     *
     * @param {Grid} grid
     * @constructor
     */
    constructor(grid) {
        super();
        this.componentClass = AlignTransform2Grid;
        this.grid = grid;
    }

    update(timeDelta) {
        const grid = this.grid;
        const v2 = new Vector2();
        const v3 = new Vector3();
        this.entityManager.traverseEntities([AlignTransform2Grid, Transform], function (align, transform) {
            let position = transform.global.position;
            if (transform.parent !== null) {
                position = transform.parent.global.position;
            }
            grid.pointWorld2Grid(position, v2);
            grid.pointGrid2World(Math.round(v2.x), Math.round(v2.y), v3);
            if (transform.parent !== null) {
                v3.sub(transform.parent.global.position);
            }
            if (!transform.position.equals(v3)) {
                transform.position.x = v3.x;
                transform.position.z = v3.z;
            }
        });
    }
}


export default AlignTransform2GridSystem;