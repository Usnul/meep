/**
 * Created by Alex on 04/03/14.
 */


import View from "../../view/View";
import EmptyView from "../../view/ui/elements/EmptyView";
import domify from "../../view/DOM";
import Terrain, { obtainTerrain } from "../../model/level/terrain/ecs/Terrain";
import Vector2 from "../../model/core/geom/Vector2";
import { Camera } from "../../model/graphics/ecs/camera/Camera";
import { PointerDevice } from "../../model/engine/input/devices/PointerDevice";
import TopDownCameraController from "../../model/engine/input/ecs/components/TopDownCameraController";
import { MinimapMarkersGL } from "./gl/MinimapMarkersGL";
import Rectangle from "../../model/core/geom/Rectangle";
import { EntityObserver } from "../../model/engine/ecs/EntityObserver.js";
import Transform from "../../model/engine/ecs/components/Transform.js";
import { MinimapWorldGL } from "./gl/MinimapWorldGL.js";
import { MinimapCameraView } from "./dom/MinimapCameraView.js";
import { MinimapFogOfWar } from "./gl/MinimapFogOfWar.js";
import { MinimapTerrainGL } from "./gl/MinimapTerrainGL.js";


class MinimapView extends View {
    /**
     *
     * @constructor
     * @param {EntityComponentDataset} entityDataset
     * @param {AssetManager} assetManager
     */
    constructor(entityDataset, assetManager) {
        super(entityDataset, assetManager);

        this.el = domify('div').addClass('ui-minimap-view').el;

        /**
         *
         * @type {EntityComponentDataset}
         */
        this.entityDataset = entityDataset;

        const vWorld = new EmptyView();
        this.addChild(vWorld);

        /**
         *
         * @type {Rectangle}
         */
        const world = this.world = new Rectangle(0, 0, 0, 0);

        const worldScale = new Vector2(1, 1);


        this.worldGL = new MinimapWorldGL({ canvasSize: this.size, worldBounds: world });


        /**
         *
         * @param {MinimapWorldGL} worldGL
         */
        function setupWorld(worldGL) {
            worldGL.addLayer(new MinimapMarkersGL(entityDataset, assetManager));
            worldGL.addLayer(new MinimapFogOfWar(entityDataset, world));
        }

        const lTerrain = new MinimapTerrainGL({ assetManager });

        this.worldGL.addLayer(lTerrain);

        setupWorld(this.worldGL);


        this.vMarkers = new EmptyView({ classList: ["ui-minimap-marker-view"] });
        vWorld.addChild(this.vMarkers);

        this.__worldView = vWorld;
        this.__terrainView = lTerrain;

        /**
         *
         * @type {MinimapCameraView[]}
         */
        const cameraViews = this.__cameraViews = [];

        const self = this;

        function cameraAdded(camera, transform, entity) {
            const cameraView = new MinimapCameraView({ camera, transform, entity, world, worldScale });

            const terrain = obtainTerrain(entityDataset);

            cameraView.terrain.set(terrain);

            self.__cameraViews.push(cameraView);
            self.__worldView.addChild(cameraView);
        }

        function cameraRemoved(camera, transform, entity) {
            const cameraView = self.__cameraViews.find(v => v.entity === entity);

            if (cameraView === undefined) {
                //do nothing
                console.warn('Camera view not found', camera, transform, entity);
                return;
            }

            const i = self.__cameraViews.indexOf(cameraView);

            self.__cameraViews.splice(i, 1);

            self.__worldView.removeChild(cameraView);
        }

        this.cameraObserver = new EntityObserver([Camera, Transform], cameraAdded, cameraRemoved);

        function updateWorldScale() {
            let worldSizeX = world.size.x;
            let worldSizeY = world.size.y;

            let scaleX;

            if (worldSizeX === 0) {
                scaleX = 0;
            } else {
                scaleX = self.size.x / worldSizeX;
            }

            let scaleY;

            if (worldSizeY === 0) {
                scaleY = 0;
            } else {
                scaleY = self.size.y / worldSizeY;
            }

            worldScale.set(scaleX, scaleY);
        }

        world.size.onChanged.add(updateWorldScale);

        this.size.onChanged.add(function (x, y) {
            updateWorldScale();
        });

        const pointer = this.pointer = new PointerDevice(this.el);

        function focus(x, y) {
            const worldX = (x / worldScale.x) + world.position.x;
            const worldZ = (y / worldScale.y) + world.position.y;

            //find active camera
            const v = cameraViews.find(function (v) {
                /**
                 * @type {Camera}
                 */
                const camera = v.camera;
                return camera.active.getValue();
            });

            if (v === undefined) {
                console.warn(`No camera present. Focusing attempt failed, (x=${x}, y=${y})`);
            } else {

                /**
                 *
                 * @type {TopDownCameraController}
                 */
                const controller = entityDataset.getComponent(v.entity, TopDownCameraController);

                if (controller !== null) {
                    controller.target.set(worldX, controller.target.y, worldZ);
                }

            }
        }

        pointer.on.down.add(function (position, event) {
            focus(event.layerX, event.layerY);
        });

        pointer.on.drag.add(function (position, origin, lastDragPosition, event) {
            focus(event.layerX, event.layerY);
        });

    }

    clear() {
        for (let i = 0, l = this.__cameraViews.length; i < l; i++) {
            const v = this.__cameraViews[i];
            this.__worldView.addChild(v);
        }
    }

    link() {
        super.link();

        const entityDataset = this.entityDataset;


        let self = this;

        /**
         *
         * @param {Terrain} t
         */
        function visitTerrain(t) {
            self.__terrainView.terrain.set(t);
            self.__cameraViews.forEach(c => c.terrain.set(t));
        }

        entityDataset.traverseComponents(Terrain, visitTerrain);

        entityDataset.addObserver(this.cameraObserver, true);

        try {
            this.worldGL.startup();
        } catch (e) {
            console.error('Startup of marker manager failed', e);
        }

        const dom = domify(this.vMarkers.el);
        dom.clear();
        dom.append(this.worldGL.domElement);


        this.pointer.start();
    }

    unlink() {
        super.unlink();

        this.pointer.stop();

        this.worldGL.shutdown();

        //clear out all camera views
        this.entityDataset.removeObserver(this.cameraObserver, true);

        //remove all exiting markers
        this.clear();
    }
}


export default MinimapView;
