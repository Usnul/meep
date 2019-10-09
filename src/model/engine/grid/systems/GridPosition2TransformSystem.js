/**
 * Created by Alex on 20/01/2015.
 */
import { System } from '../../ecs/System';
import Transform from '../../ecs/components/Transform';
import GridPosition from '../components/GridPosition';
import { GridPosition2Transform } from '../components/GridPosition2Transform';
import Vector3 from "../../../core/geom/Vector3.js";
import { obtainTerrain } from "../../../level/terrain/ecs/Terrain.js";


export class GridPosition2TransformSystem extends System {
    constructor() {
        super();
        this.componentClass = GridPosition2Transform;

        this.dependencies = [GridPosition, Transform];


        this.mapPoint = (x, y, v3) => {
            const terrain = obtainTerrain(this.entityManager.dataset);
            if (terrain !== null) {
                terrain.mapPointGrid2World(x, y, v3);
            }
        };

        this.data = [];
    }

    /**
     *
     * @param {GridPosition2Transform} component
     * @param {GridPosition} gp
     * @param {Transform} transform
     * @param {number} entity
     */
    link(component, gp, transform, entity) {
        const mapPoint = this.mapPoint;

        function sync() {
            const transformOffset = component.offset;

            const x = gp.x;
            const y = gp.y;

            const centerX = x + transformOffset.x;
            const centerY = y + transformOffset.y;

            setTransformFromGrid(mapPoint, centerX, centerY, transform);
        }

        sync.clear = function () {
            gp.onChanged.remove(sync);
            component.offset.onChanged.remove(sync);
        };

        gp.process(sync);
        component.offset.process(sync);


        this.data[entity] = {
            sync
        };
    }

    /**
     *
     * @param {GridPosition2Transform} component
     * @param {GridPosition} gp
     * @param {Transform} transform
     * @param {number} entity
     */
    unlink(component, gp, transform, entity) {
        const { sync } = this.data[entity];

        sync.clear();

        delete this.data[entity];
    }

    reset() {
        const data = this.data;

        for (let entity in data) {

            if (!data.hasOwnProperty(entity)) {
                continue;
            }

            const { sync } = data[entity];

            sync.clear();
        }

        this.data = [];
    }
}

const v3 = new Vector3();

/**
 *
 * @param {function} mapPointGrid2world
 * @param {number} x
 * @param {number} y
 * @param {Transform} transform
 */
function setTransformFromGrid(mapPointGrid2world, x, y, transform) {
    mapPointGrid2world(x, y, v3);
    const transformPosition = transform.position;
    //check if positions are different
    if (v3.x !== transformPosition.x || v3.z !== transformPosition.z) {
        transformPosition.setXZ(v3.x, v3.z);
    }
}
