/**
 * Created by Alex on 13/10/2014.
 */
import { System } from '../../ecs/System';
import GridPosition from '../components/GridPosition';
import { QuadTreeNode } from "../../../core/geom/2d/quad-tree/QuadTreeNode.js";

class GridPositionSystem extends System {
    constructor() {
        super();
        this.componentClass = GridPosition;

        /**
         *
         * @type {QuadTreeNode<number>}
         */
        this.index = new QuadTreeNode(0, 0, 0, 0);

        this.data = [];
    }

    /**
     *
     * @param {number[]} result
     * @param {number} x
     * @param {number} y
     * @returns {number} number of found entities
     */
    getEntitiesAt(result, x, y) {
        let count = 0;

        this.index.traverseRectangleIntersections(x - 0.1, y - 0.1, x + 0.1, y + 0.1, function (datum) {
            if (datum.x0 === x && datum.y0 === y) {
                result.push(datum.data);

                count++;
            }
        });

        return count;
    }


    /**
     *
     * @param {GridPosition} gridPosition
     * @param {Number} entityId
     */
    link(gridPosition, entityId) {

        const x0 = gridPosition.x;
        const y0 = gridPosition.y;

        const node = this.index.add(entityId, x0, y0, x0, y0);

        function sync() {

            const x = gridPosition.x;
            const y = gridPosition.y;

            node.move(x, y);
        }

        sync.clear = function () {
            gridPosition.onChanged.remove(sync);
        };

        gridPosition.process(sync);

        this.data[entityId] = {
            sync,
            node
        };
    }

    /**
     *
     * @param {GridPosition} gridPosition
     * @param {Number} entityId
     */
    unlink(gridPosition, entityId) {
        const { sync, node } = this.data[entityId];
        sync.clear();

        node.disconnect();

        delete this.data[entityId];
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

        this.index.clear();
    }
}

/**
 *
 * @param {EntityComponentDataset} dataset
 * @param {number} x
 * @param {number} y
 * @param {number[]} result
 */
export function getEntitiesAtGridPosition(dataset, x, y, result) {
    /**
     *
     * @param {GridPosition} component
     * @param {number} entity
     */
    function getEntitiesAtGridPosition_visitor(component, entity) {
        if (component.x === x && component.y === y) {
            result.push(entity);
        }
    }

    dataset.traverseComponents(GridPosition, getEntitiesAtGridPosition_visitor);

    return result;
}


export default GridPositionSystem;
