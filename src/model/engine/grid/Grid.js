/**
 * Created by Alex on 13/10/2014.
 */
import GridField from '../../navigation/grid/GridField';
import Vector2 from '../../core/geom/Vector2';
import Vector3 from "../../core/geom/Vector3.js";

const Grid = function () {
    let gridScale = 2;
    let gridScaleX = gridScale;
    let gridScaleY = gridScale;

    this.size = new Vector2();
    this.field = null;

    this.init = function (width, height, worldScale) {
        if (worldScale === undefined) {
            worldScale = 2;
        }
        gridScale = worldScale;
        this.field = new GridField(width, height);
        this.size.set(width, height);

        updateGridScale(width, height);
    };

    function updateGridScale(width, height) {
        //scale is not exact as number of points in the mesh will be greater by 1 than number of tiles, for obvious reasons.
        gridScaleX = gridScale * (width / (width - 1));
        gridScaleY = gridScale * (height / (height - 1));
    }

    this.resize = function (width, height) {
        const oldSize = this.size;

        if (oldSize.x !== width || oldSize.y !== height) {
            const newField = new GridField(width, height);
            updateGridScale(width, height);
            //copy values from old field to new one
            if (this.field !== null) {
                this.field.rectTraverse(0, 0, oldSize.x, oldSize.y, function (x, y, value) {
                    newField.pointSet(x, y, value);
                });
            }

            this.field = newField;
            this.size.set(width, height);
        }
    };

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {Vector3} resultV3
     */
    function pointGrid2World2(x, y, resultV3) {
        resultV3.x = (x) * gridScaleX;
        resultV3.z = (y) * gridScaleY;
    }

    /**
     *
     * @param {Vector3} v3
     * @param {Vector2} resultV2
     */
    function pointWorld2Grid(v3, resultV2) {
        resultV2.x = v3.x / gridScaleX;
        resultV2.y = v3.z / gridScaleY;
    }

    this.pointWorld2Grid = pointWorld2Grid;
    this.pointGrid2World = pointGrid2World2;
    const point2 = new Vector2();

    function mapHeightToPath(path, terrain, width, height, callback) {
        let mappedCount = 0;
        const l = path.length;

        function mapPoint(p) {
            terrain.sampleHeight(p.x, p.z, function (y) {
                p.y = y;
                if (++mappedCount >= l) {
                    callback(path);
                }
            });
        }

        for (let i = 0; i < l; i++) {
            const p = path[i];
            mapPoint(p);
        }
    }

    const self = this;
    this.findPath = (function () {
        const start = new Vector2(0, 0);
        const goal = new Vector2(0, 0);

        /**
         *
         * @param {Vector3} from
         * @param {Vector3} to
         * @param {number} clearance
         * @param callback
         */
        function findPath(from, to, clearance, callback) {
            pointWorld2Grid(from, start);
            start.ceil();
            pointWorld2Grid(to, goal);
            goal.ceil();
            const field = self.field;
            const indexPath = field.findPath(start, goal, 10000, 0);
            const path = [];
            let i, point;
            for (i = 0; i < indexPath.length; i++) {
                const index = indexPath[i];
                field.index2point(index, point2);
                point = new Vector3(0, 0, 0);
                pointGrid2World2(point2.x, point2.y, point);
                path.push(point);
            }
            const terrain = self.terrain;

            mapHeightToPath(path, terrain, self.size.x * gridScaleX, self.size.y * gridScaleY, callback);
        }

        return findPath;
    })();
};
export default Grid;
