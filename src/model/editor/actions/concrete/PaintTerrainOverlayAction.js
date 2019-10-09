import Vector4 from "../../../core/geom/Vector4";
import { Action } from "../Action.js";
import { obtainTerrain } from "../../../level/terrain/ecs/Terrain.js";

class PaintTerrainOverlayAction extends Action {
    /**
     *
     * @param {number} entity
     * @param {number} x
     * @param {number} y
     * @param {Vector4} color
     * @constructor
     */
    constructor(entity, x, y, color) {
        super();
        this.entity = entity;
        this.x = x;
        this.y = y;
        this.color = color;

        this.overlay = null;
        this.oldColor = new Vector4();
    }

    apply(editor) {
        const terrain = obtainTerrain(editor.engine.entityManager.dataset);
        const overlay = this.overlay = terrain.overlay;

        //remember old color
        overlay.readPoint(this.x, this.y, this.oldColor);

        overlay.clearPoint(this.x, this.y);
        overlay.paintPoint(this.x, this.y, this.color);
    }

    revert(editor) {
        const overlay = this.overlay;

        overlay.clearPoint(this.x, this.y);
        overlay.paintPoint(this.x, this.y, this.oldColor);
    }
}


export default PaintTerrainOverlayAction;
