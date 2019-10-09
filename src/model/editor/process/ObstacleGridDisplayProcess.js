import { Process } from "./Process.js";
import GridObstacle from "../../engine/grid/components/GridObstacle.js";
import GridPosition from "../../engine/grid/components/GridPosition.js";
import Vector4 from "../../core/geom/Vector4.js";
import { Sampler2D } from "../../graphics/texture/sampler/Sampler2D.js";
import { obtainTerrain } from "../../level/terrain/ecs/Terrain.js";

class ObstacleGridDisplayProcess extends Process {

    constructor() {
        super();
        /**
         *
         * @type {TerrainOverlay|null}
         */
        this.overlay = null;
        this.name = ObstacleGridDisplayProcess.Id;
    }

    startup() {
        super.startup();

        const engine = this.editor.engine;

        const entityManager = engine.entityManager;

        const terrain = obtainTerrain(entityManager.dataset);

        if (terrain === null) {
            this.overlay = null;
            return;
        }

        const overlay = terrain.overlay;
        this.overlay = overlay;

        overlay.push();

        overlay.borderWidth.set(0.05);

        this.draw();
    }

    draw() {
        /**
         *
         * @type {TerrainOverlay}
         */
        const overlay = this.overlay;
        if (overlay === null) {
            //no overlay, do nothing
            return;
        }

        //
        const drawBuffer = Sampler2D.uint8(4, overlay.size.x, overlay.size.y);

        overlay.clear();

        const em = this.editor.engine.entityManager;

        const color = new Vector4(0, 0, 0, 0);

        /**
         *
         * @param {number} x
         * @param {number} y
         * @param {number} value
         */
        function paintPoint(x, y, value) {
            drawBuffer.get(x, y, color);

            if (value === 0) {
                if (color.w !== 0) {
                    return;
                }
                color.set(2, 256, 0, 13);
            } else {
                if (color.w !== 0) {
                    drawBuffer.set(x, y, [0, 0, 0, 0]);
                }
                color.set(0, 0, 0, 54);
            }


            drawBuffer.set(x, y, [color.x, color.y, color.z, color.w])
        }

        /**
         *
         * @param {GridObstacle} obstacle
         * @param {GridPosition} position
         */
        function visitObstacle(obstacle, position) {
            obstacle.traverseMask(position.x, position.y, paintPoint);
        }

        em.dataset.traverseEntities([GridObstacle, GridPosition], visitObstacle);

        overlay.writeData(drawBuffer.data);
    }

    shutdown() {
        super.shutdown();

        if (this.overlay !== null) {
            this.overlay.pop();
        }
    }
}

ObstacleGridDisplayProcess.Id = "obstacle-grid-display";

export { ObstacleGridDisplayProcess };
