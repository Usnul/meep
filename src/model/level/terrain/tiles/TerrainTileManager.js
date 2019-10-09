/**
 * Created by Alex on 21/05/2016.
 */
import ObservedValue from '../../../core/model/ObservedValue';
import Vector2 from '../../../core/geom/Vector2';
import Signal from '../../../core/events/signal/Signal.js';
import TerrainTile from './TerrainTile';

import { BinaryNode } from '../../../core/bvh2/BinaryNode';

import CheckersTexture from '../../../graphics/texture/CheckersTexture';


import { MeshPhongMaterial } from 'three';
import { assert } from "../../../core/assert.js";
import { Color } from "../../../core/color/Color.js";
import { randomFloatBetween } from "../../../core/math/MathUtils.js";
import { noop } from "../../../core/function/Functions.js";
import Vector3 from "../../../core/geom/Vector3.js";

const TerrainTileManager = function ({
                                         tileSize = new Vector2(5, 5),
                                         totalSize,
                                         material,
                                         samplerHeight,
                                         resolution = 4,
                                         scale = new Vector2(1, 1),
                                         buildWorker,
                                         heightRange
                                     }) {

    this.on = {
        tileBuilt: new Signal(),
        tileDestroyed: new Signal()
    };

    this.tileSize = tileSize;

    if (totalSize === undefined) {
        throw new Error("Total size may not be undefined");
    }

    this.totalSize = totalSize;

    if (material === undefined) {
        const defaultMaterialTexture = CheckersTexture.create(this.totalSize.clone()._sub(1, 1).multiplyScalar(0.5));
        material = new MeshPhongMaterial({ map: defaultMaterialTexture });
    }

    this.material = new ObservedValue(material);

    this.resolution = new ObservedValue(resolution);

    this.samplerHeight = samplerHeight;

    this.scale = new Vector2(1, 1);
    this.scale.copy(scale);

    this.buildWorker = buildWorker;

    this.bvh = new BinaryNode();
    this.bvh.setNegativelyInfiniteBounds();

    this.heightRange = heightRange;

    /**
     * Debug parameter, makes all tiles have random colored material for easy visual distinction
     * @type {boolean}
     */
    this.debugTileMaterialRandom = false;

    this.initializeTiles();

    //
    const self = this;
    this.material.onChanged.add(function (mat) {

        self.traverse(function (tile) {
            self.assignTileMaterial(tile);
        });
    });
};

/**
 *
 * @param {TerrainTile} tile
 */
TerrainTileManager.prototype.assignTileMaterial = function (tile) {
    let material = this.material.getValue();

    if (this.debugTileMaterialRandom) {
        const color = new Color();
        color.setHSV(Math.random(), randomFloatBetween(Math.random, 0.4, 1), 1);
        material = new MeshPhongMaterial({ color: color.toUint() });
    }

    tile.material = material;
    if (tile.isBuilt) {
        tile.mesh.material = material;
    }
};

/**
 *
 * @param {function(tile:TerrainTile)} callback
 */
TerrainTileManager.prototype.traverse = function (callback) {
    const tiles = this.tiles;
    let tile;
    let i = 0;
    const il = tiles.length;
    for (; i < il; i++) {
        tile = tiles[i];
        callback(tile);
    }
};

TerrainTileManager.prototype.initializeTiles = function () {

    const gridSize = this.totalSize.clone().divide(this.tileSize).ceil();

    const tileCount = gridSize.x * gridSize.y;

    /**
     *
     * @type {TerrainTile[]}
     */
    this.tiles = new Array(tileCount);
    const tiles = this.tiles;

    const self = this;

    function ensureBuilt(x, y) {
        return function (resolve) {
            self.obtain(x, y, resolve);
        }
    }

    //populate tiles
    for (let y = 0; y < gridSize.y; y++) {
        const tY = y < gridSize.y - 1 ? this.tileSize.y : (this.totalSize.y - this.tileSize.y * y);
        for (let x = 0; x < gridSize.x; x++) {
            const tX = x < gridSize.x - 1 ? this.tileSize.x : (this.totalSize.x - this.tileSize.x * x);

            const tile = new TerrainTile(this.samplerHeight);
            tiles[y * gridSize.x + x] = tile;

            this.assignTileMaterial(tile);

            tile.gridPosition.set(x, y);

            tile.size.set(tX, tY);
            tile.position.set(this.tileSize.x * x, this.tileSize.y * y);
            tile.scale.copy(this.scale);
            tile.resolution.copy(this.resolution);

            tile.createInitialBounds(this.heightRange);

            //hook for building
            tile.ensureBuilt = ensureBuilt(x, y);
        }
    }

    this.bvh.insertManyBoxes2(function (index) {
        return tiles[index].boundingBox;
    }, tileCount);
};

/**
 *
 * @param {number} x Tile X coordinate
 * @param {number} y Tile Y coordinate
 * @returns {number}
 */
TerrainTileManager.prototype.computeTileIndex = function (x, y) {
    assert.ok(Number.isInteger(x), `x must be an integer, instead was ${x}`);
    assert.ok(Number.isInteger(y), `x must be an integer, instead was ${y}`);

    assert.ok(x >= 0, `x(=${x}) must be greater or equal to 0`);
    assert.ok(y >= 0, `y(=${y}) must be greater or equal to 0`);

    const w = Math.ceil(this.totalSize.x / this.tileSize.x);

    assert.ok(x < w, `x(=${x}) must be less than than width(=${w})`);
    assert.ok(y < Math.ceil(this.totalSize.y / this.tileSize.y), `y(=${y}) must be less than than height(=${Math.ceil(this.totalSize.y / this.tileSize.y)})`);

    return y * w + x;
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {TerrainTile}
 */
TerrainTileManager.prototype.getRaw = function (x, y) {

    const tileIndex = this.computeTileIndex(x, y);

    assert.ok(tileIndex >= 0, `tileIndex(=${tileIndex}) must be >= 0`);
    assert.ok(tileIndex <= this.tiles.length, `tileIndex(=${tileIndex}) must be <= tileCount(=${this.tiles.length})`);

    const tile = this.tiles[tileIndex];

    return tile;
};

/**
 *
 * @param {number} x Grid X coordinate
 * @param {number} y Grid Y coordinate
 * @returns {TerrainTile}
 */
TerrainTileManager.prototype.getRawTileByPosition = function (x, y) {
    const tileX = Math.floor(x / this.tileSize.x);
    const tileY = Math.floor(y / this.tileSize.y);

    return this.getRaw(tileX, tileY);
};

TerrainTileManager.prototype.processTile = function (x, y, callback) {
    const tile = this.getRaw(x, y);

    if (tile.isBuilt) {
        callback(tile);
    } else {
        tile.buildCallbacks.push(callback);
    }
};

/**
 *
 * @param {int} x
 * @param {int} y
 * @param {function} [resolve]
 */
TerrainTileManager.prototype.obtain = function (x, y, resolve) {
    const tile = this.getRaw(x, y);

    if (tile === undefined) {
        throw new Error(`No tile found at x=${x},y=${y}`);
    }

    tile.referenceCount++;

    if (tile.isBuilt) {
        if (typeof resolve === "function") {
            resolve(tile);
        }
    } else {
        tile.buildCallbacks.push(resolve);
        if (!tile.isBuildInProgress) {
            this.build(x, y);
        }
    }

};

TerrainTileManager.prototype.release = function (tile) {
    tile.referenceCount--;

    if (tile.referenceCount <= 0) {
        //potential garbage
    }
};

TerrainTileManager.prototype.stitchTile = function (x, y, tile) {

    const gridSize = this.totalSize.clone().divide(this.tileSize).floor();

    const self = this;
    //normal stitching
    let top, bottom, left, right, topLeft, topRight, bottomLeft, bottomRight;

    if (y > 0) {
        top = self.getRaw(x, y - 1);
        if (x > 0) {
            topLeft = self.getRaw(x - 1, y - 1);
        }
        if (x < gridSize.x - 1) {
            topRight = self.getRaw(x + 1, y - 1);
        }
    }
    if (y < gridSize.y - 1) {
        bottom = self.getRaw(x, y + 1);
        if (x > 0) {
            bottomLeft = self.getRaw(x - 1, y + 1);
        }
        if (x < gridSize.x - 1) {
            bottomRight = self.getRaw(x + 1, y + 1);
        }
    }
    if (x > 0) {
        left = self.getRaw(x - 1, y);
    }
    if (x < gridSize.x - 1) {
        right = self.getRaw(x + 1, y);
    }

    tile.stitchNormals2(top, bottom, left, right, topLeft, topRight, bottomLeft, bottomRight);
};

const v3_origin = new Vector3();
const v3_direction = new Vector3();

/**
 *
 * @param {Vector3} result
 * @param {number} originX
 * @param {number} originY
 * @param {number} originZ
 * @param {number} directionX
 * @param {number} directionY
 * @param {number} directionZ
 * @returns {boolean}
 */
TerrainTileManager.prototype.raycastFirstSync = function (result, originX, originY, originZ, directionX, directionY, directionZ) {

    let bestHit = null;
    let bestNormal = null;
    let bestGeometry = null;
    let bestDistanceSqr = Number.POSITIVE_INFINITY;


    v3_origin.set(originX, originY, originZ);
    v3_direction.set(directionX, directionY, directionZ);

    /**
     *
     * @param {Vector3} hit
     * @param normal
     * @param geo
     */
    function registerHit(hit, normal, geo) {
        const d = hit.distanceSqrTo(v3_origin);
        if (d < bestDistanceSqr) {
            bestDistanceSqr = d;
            bestHit = hit;
            bestNormal = normal;
            bestGeometry = geo;
        }
    }

    this.bvh.traverseRayLeafIntersections(originX, originY, originZ, directionX, directionY, directionZ, function (leaf) {
        const tile = leaf.object;

        if (tile.isBuilt) {
            tile.raycast(v3_origin, v3_direction, registerHit, noop);
        }
    });


    if (bestHit !== null) {
        result.copy(bestHit);
        return true;
    }

    return false;
};

TerrainTileManager.prototype.raycast = (function () {

    function raycast(origin, direction, callback, missCallback) {
        assert.typeOf(callback, 'function', 'callback');
        assert.typeOf(missCallback, 'function', 'missCallback');

        let bestHit = null;
        let bestNormal = null;
        let bestGeometry = null;
        let bestDistanceSqr = Number.POSITIVE_INFINITY;

        let firstStageOver = false;

        let tileCount = 0;

        function tryReturn() {
            if (tileCount === 0 && firstStageOver) {
                callback(bestHit, bestNormal, bestGeometry);
            }
        }

        function registerHit(hit, normal, geo) {
            const d = hit.distanceSqrTo(origin);
            if (d < bestDistanceSqr) {
                bestDistanceSqr = d;
                bestHit = hit;
                bestNormal = normal;
                bestGeometry = geo;
            }
        }


        /**
         *
         * @param {TerrainTile} tile
         */
        function doCast(tile) {

            tile.raycast(origin, direction, registerHit, missCallback);
            tileCount--;
            tryReturn();
        }

        this.bvh.traverseRayLeafIntersections(origin.x, origin.y, origin.z, direction.x, direction.y, direction.z, function (leaf) {
            const tile = leaf.object;

            tileCount++;

            if (tile.isBuilt) {
                doCast(tile);
            } else {
                tile.buildCallbacks.push(doCast);
            }
        });

        firstStageOver = true;
        tryReturn();
    }

    return raycast;
})();

TerrainTileManager.prototype.raycastVertical = function (x, y, successCallback, missCallback) {
    assert.typeOf(missCallback, 'function', 'missCallback');

    /**
     *
     * @param {TerrainTile} tile
     */
    function doCast(tile) {
        tile.raycastVertical(x, y, successCallback, missCallback);
    }


    let miss = true;

    this.bvh.traverseRayLeafIntersections(x, -10000, y, 0, 1, 0, function (leaf) {
        const tile = leaf.object;

        miss = false;

        if (tile.isBuilt) {
            doCast(tile);
        } else {
            tile.buildCallbacks.push(doCast);
        }
    });

    if (miss) {
        missCallback();
    }
};

TerrainTileManager.prototype.build = function (x, y, resolve, reject) {
    const processName = 'building tile x = ' + x + ", y = " + y;
    const self = this;


    const tileIndex = this.computeTileIndex(x, y);
    const tile = this.tiles[tileIndex];

    tile.isBuilt = false;
    tile.isBuildInProgress = true;

    this.buildWorker.buildTile(
        tile.position.toJSON(),
        tile.size.toJSON(),
        tile.scale.toJSON(),
        self.totalSize.toJSON(),
        tile.resolution.getValue()
    ).then(function (tileData) {

        //console.time(processName);

        tile.build(tileData);

        self.stitchTile(x, y, tile);
        //refit the bvh
        tile.boundingBox.parentNode.bubbleRefit();

        tile.isBuilt = true;
        tile.isBuildInProgress = false;

        //invoke callbacks
        const buildCallbacks = tile.buildCallbacks;
        let i = 0;
        const l = buildCallbacks.length;
        for (; i < l; i++) {
            let buildCallback = buildCallbacks[i];

            if (typeof buildCallback === "function") {
                buildCallback(tile);
            }
        }

        tile.buildCallbacks.length = 0;

        //console.timeEnd(processName);

        self.on.tileBuilt.dispatch(tile);
    }, reject);
};

export default TerrainTileManager;

