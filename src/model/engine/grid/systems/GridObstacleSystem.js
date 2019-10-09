/**
 * Created by Alex on 13/10/2014.
 */
import { System } from '../../ecs/System';
import GridPosition from '../components/GridPosition';
import GridObstacle from '../components/GridObstacle';
import PathFollower from '../../../navigation/ecs/components/PathFollower';
import Path from '../../../navigation/ecs/components/Path';
import Transform from '../../ecs/components/Transform';
import Steering from '../../ecs/components/Steering';


function traverseMaskedRegion(x, y, obstacle, callback) {
    obstacle.traverseMask(x, y, callback);
}

class GridObstacleSystem extends System {
    constructor(grid) {
        super();

        this.componentClass = GridObstacle;
        this.dependencies = [GridPosition];

        this.grid = grid;

        this.watchedPositions = [];

        this.pathsNeedUpdate = false;
    }

    startup(entityManager, success, failure) {
        this.entityManager = entityManager;

        if (this.grid.field === null) {
            this.grid.init(1, 1);
        }

        success();
    }

    recalculatePaths() {
        const grid = this.grid;
        const em = this.entityManager;
        em.traverseEntities([Path, PathFollower, Transform, Steering], function (path, follower, transform, steering) {
            const points = path.points;

            if (points === null) {
                return;
            }

            const length = points.length;
            if (length === 0) {
                //no active path
                return;
            }
            if (follower.lastIndex >= length - 1) {
                //end was reached already
                return;
            }
            if (follower.lock === true) {
                //locked
                return;
            }
            steering.destination = null;
            const v3 = path[length - 1];
            path.points = null;
            follower.lastIndex = 0;
            follower.lock = true;
            grid.findPath(transform.position, v3, 0, function (points) {
                path.points = points;
                follower.lock = false;
            });
        });

    }

    /**
     *
     * @param {GridObstacle} obstacle
     * @param {GridPosition} p
     * @param {int} entityId
     */
    link(obstacle, p, entityId) {
        const grid = this.grid;
        const field = grid.field;

        function ensureGridSize(x, y) {
            if (grid.size.x < x + 1 || grid.size.y < y + 1) {
                grid.resize(Math.max(x + 1, grid.size.x), Math.max(y + 1, grid.size.y));
            }
        }

        function paintObstacle(x, y) {
            traverseMaskedRegion(x, y, obstacle, function (x, y, value) {
                field.pointAdd(x, y, value);
            });
        }

        function eraseObstacle(x, y) {
            traverseMaskedRegion(x, y, obstacle, function (x, y, value) {
                field.pointAdd(x, y, -value);
            });
        }

        function ensureGridBigEnough(x, y) {
            ensureGridSize(x + obstacle.size.x - 1, y + obstacle.size.y - 1);
        }

        function copyPositionOfMesh(x, y, oldX, oldY) {
            ensureGridBigEnough(x, y);
            eraseObstacle(oldX, oldY);
            paintObstacle(x, y);
        }

        ensureGridBigEnough(p.x, p.y);
        paintObstacle(p.x, p.y);
        p.onChanged.add(copyPositionOfMesh);
        this.watchedPositions[entityId] = copyPositionOfMesh;

        this.pathsNeedUpdate = true;
    }

    /**
     *
     * @param {GridObstacle} obstacle
     * @param {GridPosition} p
     * @param {int} entityId
     */
    unlink(obstacle, p, entityId) {
        const callback = this.watchedPositions[entityId];

        delete this.watchedPositions[entityId];

        p.onChanged.remove(callback);

        const field = this.grid.field;

        traverseMaskedRegion(p.x, p.y, obstacle, function (x, y, value) {
            field.pointAdd(x, y, -value);
        });

        this.pathsNeedUpdate = true;
    }

    update(timeDelta) {
        if (this.pathsNeedUpdate) {
            this.recalculatePaths();
            this.pathsNeedUpdate = false;
        }
    }
}


export default GridObstacleSystem;
