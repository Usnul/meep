/**
 * Created by Alex on 28/10/2014.
 */


import { LinearFilter, Vector2 as ThreeVector2 } from 'three';
import { Sampler2D } from '../../../graphics/texture/sampler/Sampler2D';
import sampler2D2Texture from '../../../graphics/texture/sampler/Sampler2D2Texture';
import heightMap2NormalMap from '../../grid/HeightMap2NormalMap';
import normalMap2AOMap from '../../grid/NormalMap2AOMap';
import loadMaterial from '../../../graphics/material/LoadMaterial';
import rgbaData2valueSampler2D from '../../../graphics/texture/sampler/rgbaData2valueSampler2D';
import { BinaryNode } from '../../../core/bvh2/BinaryNode';
import Vector2 from '../../../core/geom/Vector2';
import Vector3 from '../../../core/geom/Vector3';
import TerrainOverlay from './../TerrainOverlay';

import Clouds from '../TerrainClouds';

import TerrainTileManager from '../tiles/TerrainTileManager';

import WorkerBuilder from '../../../core/process/worker/WorkerBuilder';
import { WebGLRendererPool } from "../../../graphics/render/RendererPool";
import { deserializeTexture } from "../../../graphics/texture/sampler/TextureBinaryBufferSerializer.js";
import { BinaryBuffer } from "../../../core/binary/BinaryBuffer.js";
import { TerrainPreview } from "../TerrainPreview.js";
import { assert } from "../../../core/assert.js";
import { GameAssetType } from "../../../engine/asset/GameAssetType.js";
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

function makeLightTexture(sampler) {
    const texture = sampler2D2Texture(sampler, 1, 0);
    texture.needsUpdate = true;

    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;

    texture.flipY = false;
    texture.anisotropy = 4;

    return texture;
}

/**
 *
 * @param zRange
 * @param heightMapURL
 * @param {AssetManager} assetManager
 * @returns {Promise<any>}
 */
function promiseSamplerHeight(zRange, heightMapURL, assetManager) {
    return new Promise(function (fulfill, reject) {

        function assetObtained(asset) {
            const array = asset.create();

            const binaryBuffer = new BinaryBuffer();
            //
            // binaryBuffer.writeUint32(2560);
            // binaryBuffer.writeUint32(2560);
            //
            // binaryBuffer.writeUint8(1);
            //
            // binaryBuffer.writeUint8(6);

            binaryBuffer.writeBytes(new Uint8Array(array));

            binaryBuffer.position = 0;

            const sampler2D = deserializeTexture(binaryBuffer);
            fulfill(sampler2D);
        }


        if (heightMapURL === undefined) {
            console.warn('Height map is not specified');
            const defaultSampler = new Sampler2D(new Uint8Array(1), 1, 1, 1);
            fulfill(defaultSampler);
        } else if (heightMapURL.endsWith('.bin')) {
            //load texture from a binary file
            assetManager.get(heightMapURL, GameAssetType.ArrayBuffer, assetObtained, reject);
        } else {
            assetManager.get(heightMapURL, GameAssetType.Image, function (asset) {
                const image = asset.create();

                // plane
                const imgWidth = image.width;
                const imgHeight = image.height;

                const samplerHeight = rgbaData2valueSampler2D(image.data, imgWidth, imgHeight, zRange, -zRange / 2);

                fulfill(samplerHeight);
            }, reject);
        }
    });
}

function promiseSamplerNormal(renderer, pSamplerHeight, zRange) {
    return new Promise(function (resolve, reject) {
        pSamplerHeight.then(function (sampler) {
            console.time("generating normal map");
            const normalSampler = heightMap2NormalMap(renderer, sampler, zRange);
            console.timeEnd("generating normal map");
            resolve(normalSampler);
        }, reject);
    });
}

function promiseSamplerAO(renderer, pSamplerNormal, pSamplerHeight, zRange, resolution) {
    return new Promise(function (resolve, reject) {
        Promise.all([pSamplerNormal, pSamplerHeight]).then(function (values) {
            const samplerNormal = values[0];
            const samplerHeight = values[1];
            console.time("generating AO map");
            const occlusionSampler = normalMap2AOMap(renderer, samplerHeight, samplerNormal, zRange, resolution);
            console.timeEnd("generating AO map");
            //console.info(occlusionSampler);
            //
            //debugSamplers(self);
            //
            //
            resolve(occlusionSampler);
        }, reject);
    });
}

function deepClone(obj) {
    if (null === obj || "object" !== typeof obj) {
        return obj;
    }

    const copy = obj.constructor();
    for (let attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = deepClone(obj[attr]);
    }
    return copy;
}

/**
 *
 * @param {Promise<Sampler2D>} pSamplerAO
 * @param description
 * @param {Vector2} size
 * @param overlay
 * @param {AssetManager} assetManager
 * @returns {Promise<any>}
 */
function promiseMaterial(pSamplerAO, description, size, overlay, assetManager) {
    if (description === undefined) {
        description = {
            textures: {}
        };
    }

    const dClone = deepClone(description);

    return new Promise(function (fulfill, reject) {
        pSamplerAO.then(function (samplerLight) {
            let repeatPerTile = description.repeat;
            if (repeatPerTile === undefined) {
                repeatPerTile = { x: 0.2, y: 0.2 };
            }
            const minSize = Math.min(size.x, size.y);
            dClone.repeat = new ThreeVector2(minSize * repeatPerTile.x, minSize * repeatPerTile.y);
            dClone.textures.light = makeLightTexture(samplerLight);
            dClone.gridResolution = size;
            dClone.assetManager = assetManager;

            const terrainMaterialDescription = loadMaterial(dClone);

            const terrainMaterial = terrainMaterialDescription.material;


            const uniforms = terrainMaterial.uniforms;
            if (uniforms !== undefined && uniforms.hasOwnProperty("diffuseGridOverlayMap")) {

                uniforms.diffuseGridOverlayMap.value = overlay.texture;
                uniforms.gridBorderWidth.value = overlay.borderWidth.getValue();

                overlay.size.onChanged.add(function (x, y) {
                    uniforms.gridResolution.value = new ThreeVector2(x, y);
                    //mark material for update
                    terrainMaterial.needsUpdate = true;
                });

                overlay.borderWidth.onChanged.add(function (v) {
                    uniforms.gridBorderWidth.value = v;
                    //mark material for update
                    terrainMaterial.needsUpdate = true;
                });
            }

            terrainMaterial.depthWrite = true;
            terrainMaterial.transparent = false;

            // terrainMaterial.wireframe = true;
            // let lightMaterial = new THREE.MeshLambertMaterial({map: dClone.textures.light});

            fulfill(terrainMaterialDescription);
        }, function (reason) {
            reject(reason);
            console.error(reason);
        });
    });
}

function makeTerrainWorkerProxy() {
    const workerBuilder = new WorkerBuilder();
    workerBuilder.importScript('bundle-1.js');

    function useSampler(callback) {
        if (globalScope.samplerHeight !== undefined) {
            callback(globalScope.samplerHeight);
        } else {
            if (globalScope.useSampleCallbacks === undefined) {
                globalScope.useSampleCallbacks = [callback];
            } else {
                globalScope.useSampleCallbacks.push(callback);
            }
        }
    }

    workerBuilder.importFunction(useSampler);

    workerBuilder.addMethod('setHeightSampler', function setHeightSampler(data, itemSize, width, height) {
        return new Promise(function (resolve, reject) {
            globalScope.samplerHeight = new Lib.Sampler2D(data, itemSize, width, height);
            if (globalScope.useSampleCallbacks !== undefined) {
                globalScope.useSampleCallbacks.forEach(function (c) {
                    c(globalScope.samplerHeight);
                })
            }
            resolve();
        });
    });

    workerBuilder.addMethod('buildTile', function (position, size, scale, totalSize, resolution) {
        return new Promise(function (resolve, reject) {
            useSampler(function (sampler) {
                try {
                    const geometry = Lib.BufferedGeometryArraysBuilder.build(sampler, position, size, scale, totalSize, resolution);
                    // var timerName = 'building bvh '+(geometry.indices.length/3);
                    // console.time(timerName);
                    const bvh = Lib.BinaryBVHFromBufferGeometry.buildUnsorted(geometry.vertices, geometry.indices);
                    // console.timeEnd(timerName);

                    resolve({
                        geometry: geometry,
                        bvh: bvh
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });
    });

    return workerBuilder.build();
}

let idCounter = 0;

function Terrain() {
    /**
     *
     * @type {number}
     */
    this.id = idCounter++;
    /**
     *
     * @type {Vector2}
     */
    this.size = new Vector2(0, 0);
    /**
     *
     * @type {TerrainPreview}
     */
    this.preview = new TerrainPreview();
    /**
     * whether or not frustum culling is enabled
     * @type {boolean}
     */
    this.frustumCulled = true;
}

Terrain.typeName = "Terrain";

Terrain.prototype.update = function (timeDelta) {
    this.clouds.update(timeDelta);
};

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
Terrain.prototype.raycastFirstSync = function (result, originX, originY, originZ, directionX, directionY, directionZ) {
    if (this.tiles === undefined) {
        return false;
    }

    return this.tiles.raycastFirstSync(result, originX, originY, originZ, directionX, directionY, directionZ);
};

/**
 *
 * @param {Vector3} origin
 * @param {Vector3} direction
 * @param {function(hit:Vector3, normal:Vector3, geometry:BufferGeometry)} callback
 * @param {function} missCallback
 */
Terrain.prototype.raycast = function (origin, direction, callback, missCallback) {
    /**
     *
     * @param {TerrainTileManager} tiles
     */
    function rayCast(tiles) {
        tiles.raycast(origin, direction, callback, missCallback);
    }

    if (this.tiles !== undefined) {
        rayCast(this.tiles);
    } else {
        this.pTiles.then(rayCast);
    }
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {function} callback
 * @param {function} missCallback
 * @param {function} errorCallback
 */
Terrain.prototype.raycastVertical = function (x, y, callback, missCallback, errorCallback) {
    assert.typeOf(callback, 'function', 'callback');
    assert.typeOf(missCallback, 'function', 'missCallback');
    assert.typeOf(errorCallback, 'function', 'errorCallback');

    this.pTiles.then(function (tiles) {
        tiles.raycastVertical(x, y, callback, missCallback);
    }, errorCallback);
};

/**
 *
 * @param {Vector3[]} points
 * @param {number[]} missIndices
 */
function mendMissedPoints(points, missIndices) {
    const numPoints = points.length;
    const lastPointIndex = numPoints - 1;

    const numMisses = missIndices.length;

    for (let i = 0; i < numMisses; i++) {
        const index = missIndices[i];

        let heightSum = 0;
        let sampleCount = 0;

        if (index > 0) {
            heightSum += points[index - 1].y;
            sampleCount++;
        }

        if (index < lastPointIndex) {
            heightSum += points[index + 1].y;
            sampleCount++;
        }

        if (sampleCount > 0) {
            points[index].y = heightSum / sampleCount;
        }
    }
}

/**
 *
 * @param {Array.<Vector3>} points3v points in world coordinate space
 * @param {function} callback
 * @param {function} errorCallback
 */
Terrain.prototype.projectPointsVertical = function (points3v, callback, errorCallback) {
    /**
     *
     * @type {Terrain}
     */
    const terrain = this;

    let mappedCount = 0;

    const l = points3v.length;

    const missedPoints = [];

    function finalizePoint() {
        if (++mappedCount >= l) {
            mendMissedPoints(points3v, missedPoints);
            callback(points3v);
        }
    }


    function mapPoint(index) {
        const p = points3v[index];

        function missedCallback() {
            //no mapping
            missedPoints.push(index);

            finalizePoint();
        }

        function hitCallback(y) {
            p.y = y;

            finalizePoint();
        }

        terrain.sampleHeight(p.x, p.z, hitCallback, missedCallback, errorCallback);
    }

    if (l === 0) {
        callback(points3v);
    } else {
        for (let i = 0; i < l; i++) {
            mapPoint(i);
        }
    }
};

/**
 *
 * @param {Array.<Vector2>} points2v
 * @param {Vector3[]} result
 * @param {function} callback
 * @param {function} errorCallback
 */
Terrain.prototype.mapGridPoints = function (points2v, result, callback, errorCallback) {
    const terrain = this;

    const pointCount = points2v.length;

    for (let i = 0; i < pointCount; i++) {
        const v2 = points2v[i];

        const v3 = result[i];

        terrain.mapPointGrid2World(v2.x, v2.y, v3);
    }

    this.projectPointsVertical(result, callback, errorCallback);
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {Vector3} result
 */
Terrain.prototype.mapPointGrid2World = function (x, y, result) {
    assert.typeOf(x, "number", 'x');
    assert.typeOf(y, "number", 'y');

    assert.notEqual(result, null, 'result is null');
    assert.notEqual(result, undefined, 'result is undefined');
    assert.ok(result.isVector3, 'result is not Vector3');

    result.set(x * this.worldGridScale.x, result.y, y * this.worldGridScale.y);
};

/**
 *
 * @param {Vector3} v3
 * @param {Vector2} result
 */
Terrain.prototype.mapPointWorld2Grid = function (v3, result) {
    result.set(v3.x / this.worldGridScale.x, v3.z / this.worldGridScale.y);
};

Terrain.prototype.sampleHeight = (function () {

    /**
     * @param {number} x
     * @param {number} y
     * @param {function} callback
     * @param {function} missCallback
     * @param {function} errorCallback
     */
    function sampleHeight(x, y, callback, missCallback, errorCallback) {
        assert.typeOf(callback, 'function', 'callback');
        assert.typeOf(missCallback, 'function', 'missCallback');
        assert.typeOf(errorCallback, 'function', 'errorCallback');

        let processed = false;

        /**
         *
         * @param {Vector3} hit
         * @param face
         * @param geometry
         */
        function processHit(hit, face, geometry) {
            if (!processed) {
                processed = true;
                callback(hit.y);
            }
        }

        this.raycastVertical(x, y, processHit, missCallback, errorCallback);

    }

    return sampleHeight;
})();


/**
 *
 * @param {EntityComponentDataset} ecd
 * @param {function(terrain:Terrain,entity:number)} [callback]
 * @returns {Terrain|null}
 */
export function obtainTerrain(ecd, callback) {
    assert.notEqual(ecd, null, 'ecd is null');
    assert.notEqual(ecd, undefined, 'ecd is undefined');

    let terrain = null;

    ecd.traverseComponents(Terrain, function (t, entity) {
        terrain = t;
        if (typeof callback === "function") {
            callback(t, entity);
        }
        return false;
    });

    return terrain;
}

/**
 *
 * @param {EntityManager} em
 * @param {EntityComponentDataset} ecd
 * @returns {Task}
 */
export function loadVisibleTerrainTiles(em, ecd) {

    let totalTiles = 0;
    let loadedTiles = 0;

    const task = new Task({
        name: "Building visible terrain tiles",
        initializer() {
            //force update by camera controller, to ensure correct focus is set
            em.getSystem(TopDownCameraControllerSystem).update(0);

            ecd.traverseComponents(Camera, function (c) {
                c.updateMatrices();
            });

            const tiles = [];

            const terrain = obtainTerrain(ecd);

            TerrainSystem.traverseVisibleTiles(ecd, terrain, function (tile) {
                tiles.push(tile);
            });

            totalTiles = tiles.length;
            const tileManager = terrain.tiles;

            function handleObtainedTile(t) {
                loadedTiles++;
            }

            if (totalTiles !== 0) {
                tiles.forEach(function (tile) {
                    tileManager.obtain(tile.gridPosition.x, tile.gridPosition.y, handleObtainedTile);
                });
            }
        },
        cycleFunction() {
            if (loadedTiles >= totalTiles) {
                return TaskSignal.EndSuccess;
            } else {
                return TaskSignal.Yield;
            }
        },
        computeProgress() {
            const fraction = totalTiles === 0 ? 1 : loadedTiles / totalTiles;

            return fraction;
        }
    });

    return task;
}

const TILE_SIZE = 7;

/**
 *
 * @param opt
 * @param {TerrainSystem} terrainSystem
 */
Terrain.prototype.fromJSON = function (opt, terrainSystem) {
    if (opt === undefined) {
        opt = {};
    }

    if (opt.preview !== undefined) {
        this.preview.fromJSON(opt.preview);
    }

    this.heightRange = opt.heightMapRange;

    this.resolution = opt.resolution !== undefined ? opt.resolution : 4;

    const size = this.size;

    if (opt.size !== undefined) {
        size.fromJSON(opt.size);
    }

    this.gridScale = opt.scale !== undefined ? opt.scale : 2;
    //

    this.heightMapURL = opt.heightMap;
    this.materialDesc = opt.material;


    // debugSamplers(this);
    this.build(terrainSystem.assetManager);
};

/**
 *
 * @param {AssetManager} assetManager
 */
Terrain.prototype.build = function (assetManager) {
    this.heightMap = null;
    /**
     *
     * @type {Clouds}
     */
    const clouds = this.clouds = new Clouds();
    clouds.enabled = true;

    this.buildWorker = makeTerrainWorkerProxy();

    const self = this;

    const pixelGridScale = this.gridScale;

    /**
     *
     * @type {Vector2}
     */
    this.worldGridScale = this.size.clone().multiplyScalar(this.gridScale).divide(this.size.clone().addScalar(-1));


    const heightMapURL = this.heightMapURL;
    const material = this.materialDesc;

    let renderer;

    const releaseRendererHooks = [];
    renderer = WebGLRendererPool.global.get();
    releaseRendererHooks.push(function () {
        WebGLRendererPool.global.release(renderer);
    });

    this.bvh = new BinaryNode();
    this.bvh.setNegativelyInfiniteBounds();
    //
    this.overlay = new TerrainOverlay(this.size);
    //
    this.samplerHeight = null;
    this.samplerNormal = null;
    //
    this.pSamplerHeight = promiseSamplerHeight(this.heightRange, heightMapURL, assetManager);

    this.pSamplerHeight.then(s => this.heightMap = s);


    this.pSamplerNormal = promiseSamplerNormal(renderer, this.pSamplerHeight, this.heightRange);
    const aoResolution = new Vector2(this.size.x * 4, this.size.y * 4);
    this.pSamplerAO = promiseSamplerAO(renderer, this.pSamplerNormal, this.pSamplerHeight, this.heightRange, aoResolution);

    this.pSamplerAO.then(function () {
        //release renderer
        releaseRendererHooks.forEach(function (cb) {
            cb();
        })
    });

    const pMaterial = promiseMaterial(this.pSamplerAO, material, this.size, this.overlay, assetManager);

    this.pMaterial = new Promise(function (resolve, reject) {
        pMaterial.then(function (description) {
            resolve(description.material);
        }, reject);
    });

    this.pSplats = new Promise(function (resolve, reject) {
        pMaterial.then(function (description) {
            const splat = description.splat;
            if (splat !== undefined) {

                Promise.all(splat.samplers).then(function (samplers) {
                    resolve(samplers.map(function (sampler) {
                        return {
                            sampler
                        };
                    }));
                }, reject);
            } else {
                reject("No splats");
            }
        }, reject);
    });

    this.splats = null;
    this.pSplats.then(function (splats) {
        self.splats = splats;
    }, function (e) {
        console.warn("Splats failed to load:", e);
        self.splats = null;
    });

    /**
     *
     * @type {Promise<TerrainTileManager>}
     */
    this.pTiles = new Promise(function (resolve, reject) {
        self.pSamplerHeight.then(function (samplerHeight) {
            //TODO rework this not to require a promise
            const tileManager = new TerrainTileManager({
                scale: new Vector2(pixelGridScale, pixelGridScale),
                totalSize: self.size,
                tileSize: new Vector2(TILE_SIZE, TILE_SIZE),
                resolution: self.resolution,
                samplerHeight: samplerHeight,
                heightRange: self.heightRange,
                buildWorker: self.buildWorker
            });
            self.tiles = tileManager;
            resolve(tileManager);
        });
    });

    Promise.all([this.pTiles, this.pMaterial]).then(function (values) {
        const tileManager = values[0];
        const material = values[1];
        tileManager.material.set(material);
    });

    this.pMaterial.then(function (mat) {
        self.clouds.addMaterial(mat);
    });
};

Terrain.prototype.toJSON = function () {
    return {
        size: this.size.toJSON(),
        heightMapRange: this.heightRange,
        scale: this.gridScale,
        resolution: this.resolution,
        heightMap: this.heightMapURL,
        material: this.materialDesc,
        preview: this.preview.toJSON()
    };
};

export default Terrain;

export class TerrainSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Terrain;
        this.version = 0;

        /**
         *
         * @type {TerrainSystem}
         */
        this.system = null;
    }

    initialize(system) {
        this.system = system;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Terrain} value
     */
    serialize(buffer, value) {

        value.size.toBinaryBuffer(buffer);
        buffer.writeFloat64(value.heightRange);

        buffer.writeUTF8String(value.heightMapURL);

        buffer.writeFloat64(value.gridScale);
        buffer.writeFloat64(value.resolution);

        buffer.writeUTF8String(JSON.stringify(value.materialDesc));

        value.preview.toBinaryBuffer(buffer);
    }


    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Terrain} value
     */
    deserialize(buffer, value) {
        value.size.fromBinaryBuffer(buffer);
        value.heightRange = buffer.readFloat64();
        value.heightMapURL = buffer.readUTF8String();

        value.gridScale = buffer.readFloat64();
        value.resolution = buffer.readFloat64();

        value.materialDesc = JSON.parse(buffer.readUTF8String());

        value.preview.fromBinaryBuffer(buffer);

        value.build(this.system.assetManager);
    }
}
