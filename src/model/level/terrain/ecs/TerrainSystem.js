import { System } from '../../../engine/ecs/System';
import Terrain from './Terrain';
import { CameraSystem } from '../../../graphics/ecs/camera/CameraSystem';
import { assert } from "../../../core/assert.js";

class TerrainSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphics
     * @param {Grid} grid
     * @param {AssetManager} assetManager
     * @constructor
     */
    constructor(graphics, grid, assetManager) {
        super();

        if (graphics === undefined) {
            throw new Error('No GraphicsEngine supplied');
        }

        if (grid === undefined) {
            throw new Error('No Grid supplied');
        }

        if (assetManager === undefined) {
            throw new Error('No AssetManager supplied');
        }


        this.graphics = graphics;

        this.componentClass = Terrain;
        this.entityManager = null;
        this.assetManager = assetManager;

        this.gridScaleX = 1;
        this.gridScaleY = 1;

        this.grid = grid;

        /**
         *
         * @type {RenderLayer|null}
         */
        this.renderLayer = null;

        /**
         *
         * @type {BinaryNode}
         */
        this.bvh = null;

        const self = this;

    }

    mapPointGrid2World(x, y, v3) {
        const wX = x * self.gridScaleX;
        const wY = v3.y;
        const wZ = y * self.gridScaleY;

        v3.set(wX, wY, wZ);
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        this.renderLayer = this.graphics.layers.create('terrain-system');

        /**
         *
         * @param {TerrainTile} tile
         * @returns {THREE.Object3D}
         */
        function extractRenderable(tile) {
            return tile.mesh;
        }

        this.renderLayer.extractRenderable = extractRenderable;

        this.bvh = this.renderLayer.bvh;

        readyCallback();
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.graphics.layers.remove(this.renderLayer);

        readyCallback();
    }

    /**
     *
     * @param {Terrain} component
     * @param entity
     */
    link(component, entity) {
        const gridSize = component.size;
        const gridScale = component.gridScale;

        this.gridScaleX = gridSize.x * gridScale / (gridSize.x - 1);
        this.gridScaleY = gridSize.y * gridScale / (gridSize.y - 1);

        //resize pathing grid to terrain's size
        this.grid.resize(gridSize.x, gridSize.y);

        const buildWorker = component.buildWorker;
        buildWorker.start();
        component.pSamplerHeight.then(function (samplerHeight) {
            if (buildWorker.__isRunning) {
                buildWorker.setHeightSampler(samplerHeight.data, samplerHeight.itemSize, samplerHeight.width, samplerHeight.height);
            }
        });

        const self = this;
        component.pTiles.then(function (tiles) {
            //set render layer BVH to one maintained by TilesEngine
            self.renderLayer.bvh = tiles.bvh;
        });
    }

    unlink(component, entity) {
        component.buildWorker.stop();
    }

    update(timeDelta) {
        const em = this.entityManager;
        const dataset = em.dataset;

        /**
         *
         * @param {Terrain} terrain
         */
        function visitTerrain(terrain) {
            terrain.update(timeDelta);
            //do frustum culling
            if (terrain.frustumCulled) {
                TerrainSystem.traverseVisibleTiles(dataset, terrain, function (tile, tileManager) {
                    tileManager.obtain(tile.gridPosition.x, tile.gridPosition.y);
                });
            }
        }

        if (dataset !== null) {
            dataset.traverseComponents(Terrain, visitTerrain);
        }
    }

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {Terrain} terrain
     * @param {function(tile:TerrainTile, tileManager:TerrainTileManager)} callback
     */
    static traverseVisibleTiles(ecd, terrain, callback) {
        assert.notEqual(terrain, null, 'terrain is null');
        assert.notEqual(terrain, undefined, 'terrain is undefined');

        const tileManager = terrain.tiles;
        if (tileManager !== undefined) {
            CameraSystem.getActiveFrustums(ecd, function (frustums) {
                tileManager.bvh.threeTraverseFrustumsIntersections(frustums, function (leafNode) {
                    const tile = leafNode.object;
                    callback(tile, tileManager);
                });
            });
        }
    }
}


export default TerrainSystem;
