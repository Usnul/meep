import Tool from "./engine/Tool.js";
import GridPosition from "../../engine/grid/components/GridPosition";
import GridObstacle from "../../engine/grid/components/GridObstacle";
import Vector4 from "../../core/geom/Vector4";
import { parseHex } from "../../core/color/ColorUtils";
import ObservedValue from "../../core/model/ObservedValue";
import Vector1 from "../../core/geom/Vector1";
import WriteGridValueAction from "../actions/concrete/WriteGridValueAction";
import PaintTerrainOverlayAction from "../actions/concrete/PaintTerrainOverlayAction";
import { decodeMouseEventButtons, PointerDevice } from "../../engine/input/devices/PointerDevice";
import Vector2 from "../../core/geom/Vector2.js";
import { obtainTerrain } from "../../level/terrain/ecs/Terrain.js";
import { pick } from "../../engine/input/ScreenGridPicker.js";

class GridPaintTool extends Tool {
    constructor() {
        super();
        this.name = "grid_paint";

        this.settings.value = new Vector1(1);
        this.settings.alphaMultiplier = new Vector1(0.15);
        this.settings.color = new ObservedValue("#00FF00");

    }


    initialize() {
        super.initialize();

        const engine = this.engine;
        const editor = this.editor;

        this.terrain = obtainTerrain(engine.entityManager.dataset, function (t, entity) {
            self.terrainEntity = entity;
        });

        this.terrain.overlay.push();

        this.paint();

        editor.selection.on.added.add(this.paint, this);
        editor.selection.on.removed.add(this.paint, this);


        this.settings.value.onChanged.add(this.paint, this);
        this.settings.alphaMultiplier.onChanged.add(this.paint, this);
        this.settings.color.onChanged.add(this.paint, this);

        this.cameraController = buildCameraController(engine, engine.entityManager);
        this.cameraController.start();
    }

    buildColor() {

        const color = new Vector4();
        const baseColor = parseHex(this.settings.color.get());
        color.set(baseColor.r, baseColor.g, baseColor.b, 0);
        color.multiplyScalar(1 / 255);

        return color;
    }

    paint() {

        const alphaMultiplier = this.settings.alphaMultiplier.getValue();
        const overlay = this.terrain.overlay;
        overlay.clear();

        const color = this.buildColor();

        /**
         *
         * @param {GridPosition} gridPosition
         * @param {GridObstacle} obstacle
         * @param {Number} entity
         */
        function visit(gridPosition, obstacle, entity) {
            obstacle.traverseMask(gridPosition.x, gridPosition.y, function (x, y, value) {
                color.w = value * alphaMultiplier;

                overlay.clearPoint(x, y);
                overlay.paintPoint(x, y, color);
            });
        }

        //initialize overlay
        this.traverse(visit);
    }

    traverse(callback) {
        /**
         * @type {EntityManager}
         */
        const entityManger = this.engine.entityManager;
        this.editor.selection.forEach(function (entity) {

            /**
             *
             * @type {GridPosition}
             */
            const gp = entityManger.getComponent(entity, GridPosition);

            /**
             *
             * @type {GridObstacle}
             */
            const obstacle = entityManger.getComponent(entity, GridObstacle);

            if (gp === null || obstacle === null) {
                //do nothing
                return;
            }
            callback(gp, obstacle, entity);
        });
    }

    shutdown() {
        this.terrain.overlay.pop();

        this.editor.selection.on.added.remove(this.paint, this);
        this.editor.selection.on.removed.remove(this.paint, this);

        this.settings.value.onChanged.remove(this.paint, this);
        this.settings.alphaMultiplier.onChanged.remove(this.paint, this);
        this.settings.color.onChanged.remove(this.paint, this);

        this.cameraController.stop();

        super.shutdown();
    }

    affectTile(_x, _y) {
        const x = _x | 0;
        const y = _y | 0;


        const self = this;
        const alphaMultiplier = this.settings.alphaMultiplier.getValue();
        const paintValue = this.settings.value.getValue();

        /**
         *
         * @param gp
         * @param {GridObstacle} obstacle
         * @param entity
         */
        function visit(gp, obstacle, entity) {

            const localX = x - gp.x;
            const localY = y - gp.y;

            if (!obstacle.isPointWithin(localX, localY)) {
                //painting outside
                return;
            }

            const actions = self.editor.actions;

            const aModifyGrid = new WriteGridValueAction(entity, localX, localY, paintValue);

            const color = self.buildColor();
            color.w = paintValue * alphaMultiplier;

            const aPaintGrid = new PaintTerrainOverlayAction(self.terrainEntity, x, y, color);

            actions.do(aModifyGrid);
            actions.do(aPaintGrid);
        }

        this.traverse(visit);
    }

    affectTileByMousePosition(position) {
        const engine = this.engine;

        const self = this;

        pick(position.x, position.y, engine.graphics, this.terrain, function (gridPosition) {
            self.affectTile(gridPosition.x, gridPosition.y);
        });
    }

    start() {
        this.editor.actions.mark('Paining Tiles');
        this.update();
    }

    update() {
        if (this.isRunning()) {
            const p = new Vector2(0, 0);
            this.engine.gameView.positionGlobalToLocal(this.engine.devices.pointer.position, p);
            this.affectTileByMousePosition(p);
        }
    }
}

/**
 *
 * @param {Engine} engine
 * @param {EntityManager} em
 * @returns {{start: function, stop: function}}
 */
function buildCameraController(engine, em) {
    const TopDownCameraController = em.getComponentClassByName("TopDownCameraController");
    const system = em.getSystemByComponentClass(TopDownCameraController);
    system.enabled.set(true);


    let cameraController = null;
    em.traverseEntities([TopDownCameraController], function (c) {
        cameraController = c;
    });

    const pointerDevice = new PointerDevice(window);
    pointerDevice.on.drag.add(function (position, origin, previousPosition, mouseEvent) {
        const buttons = mouseEvent.buttons;
        const pressedButtons = decodeMouseEventButtons(buttons);
        if (pressedButtons[2]) {
            const camera = engine.graphics.camera;
            TopDownCameraController.pan(previousPosition.clone().sub(position), camera, engine.graphics.domElement, cameraController.distance, camera.fov, cameraController.target);
        }
    });

    pointerDevice.on.wheel.add(function (delta) {
        cameraController.distance += delta.y / 70;
    });

    function start() {
        system.enabled.set(true);
        pointerDevice.start();
    }

    function stop() {
        system.enabled.set(false);
        pointerDevice.stop();
    }

    return {
        start,
        stop
    };
}


export default GridPaintTool;
