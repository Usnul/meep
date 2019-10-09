import { System } from "../../../engine/ecs/System";
import { InstancedFoliage } from "../InstancedFoliage";
import { Cache } from "../../../core/Cache";
import { Foliage2 } from "./Foliage2";
import { guessAssetType } from "../../../engine/asset/GameAssetManager.js";


/**
 *
 * @param {{state:FoliageLayerState, instances: InstancedFoliage}} layerData
 * @param {RenderLayer} renderLayer
 */
function cleanupLayer(layerData, renderLayer) {
    if (layerData.state === FoliageLayerState.Live) {
        layerData.state = FoliageLayerState.Removed;
        //need to remove from visible set
        const mesh = layerData.instances.instances.mesh;

        const visibleSet = renderLayer.visibleSet;

        const i = visibleSet.indexOf(mesh);

        if (i !== -1) {
            visibleSet.splice(i, 1);
        }
    }
}


/**
 *
 * @param {FoliageLayer} layer
 * @param {AssetManager} assetManager
 * @returns {Promise<InstancedFoliage>}
 */
export function loadFoliageLayer(layer, assetManager) {
    const instancedFoliage = layer.data;

    /**
     * @type {THREE.Mesh}
     */
    const threeMesh = instancedFoliage.instances.mesh;

    threeMesh.castShadow = layer.castShadow.getValue();
    threeMesh.receiveShadow = layer.receiveShadow.getValue();

    const modelURL = layer.modelURL.getValue();

    const mesh = new Promise(function (resolve, reject) {
        const assetType = guessAssetType(modelURL);

        if (assetType === null) {
            reject(`Undetermined asset type for url='${modelURL}'`);
        }

        assetManager.get(modelURL, assetType, function (asset) {
            const mesh = asset.create();
            instancedFoliage.setInstance(mesh.geometry, mesh.material);

            resolve();
        }, reject);
    });

    const result = mesh.then(function () {
        return instancedFoliage;
    });

    return result;
}

/**
 *
 * @param {FoliageLayer} layer
 * @param {Cache<string, Promise<InstancedFoliage>>} cache
 * @param {AssetManager} assetManager
 * @returns {Promise<InstancedFoliage>}
 */
function obtainLayer(layer, cache, assetManager) {
    const key = JSON.stringify(layer.toJSON());

    if (cache.contains(key)) {
        return cache.get(key);
    } else {
        const result = loadFoliageLayer(layer, assetManager);
        cache.put(key, result);
        return result;
    }
}

export class Foliage2System extends System {
    /**
     *
     * @param {AssetManager} assetManager
     * @param {GraphicsEngine} graphicsEngine
     * @constructor
     * @extends {System.<Foliage2>}
     */
    constructor(assetManager, graphicsEngine) {
        super();

        this.graphics = graphicsEngine;

        /**
         *
         * @type {RenderLayer|null}
         */
        this.renderLayer = null;

        this.componentClass = Foliage2;

        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = assetManager;
        this.data = [];

        this.layerCache = new Cache({ maxWeight: 10 });

    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        this.renderLayer = this.graphics.layers.create('foliage2-system');
        this.renderLayer.buildVisibleSet = (frustums, filters, visitObject) => {
            const data = this.data;

            this.renderLayer.visibleSet.length = 0;

            for (let entity in data) {

                const layers = data[entity];

                for (let i = 0, numLayers = layers.length; i < numLayers; i++) {
                    /**
                     * @type {{instances:InstancedFoliage}}
                     */
                    const layerData = layers[i];

                    if (layerData.state === FoliageLayerState.Live) {
                        layerData.instances.update(frustums, filters);

                        const mesh = layerData.instances.instances.mesh;
                        visitObject(mesh);
                        this.renderLayer.visibleSet.push(mesh);
                    }

                }
            }
        };

        readyCallback();
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.graphics.layers.remove(this.renderLayer);

        readyCallback();
    }

    reset() {
        this.renderLayer.visibleSet.length = 0;
        //drop data
        this.data.length = 0;
    }

    /**
     *
     * @param {Foliage2} foliage
     * @param entity
     */
    link(foliage, entity) {
        const layers = [];
        const data = this.data;

        data[entity] = layers;

        const renderLayer = this.renderLayer;

        for (let i = 0; i < foliage.layers.length; i++) {
            const layer = foliage.layers.get(i);

            const promise = obtainLayer(layer, this.layerCache, this.assetManager);

            const layerData = {
                instances: null,
                state: FoliageLayerState.Loading
            };

            layers.push(layerData);

            promise.then(function (instances) {
                layerData.instances = instances;

                if (layerData.state !== FoliageLayerState.Removed) {
                    //add to render layer
                    renderLayer.visibleSet.push(instances.instances.mesh);
                    layerData.state = FoliageLayerState.Live;
                }
            });
        }

        //TODO need to expose InstancedMesh BVH to let camera frustum calculation work correctly

    }

    unlink(foliage, entity) {
        const renderLayer = this.renderLayer;
        const layers = this.data[entity];

        layers.forEach(function (layerData) {
            cleanupLayer(layerData, renderLayer);
        });

        delete this.data[entity];
    }

    update() {
    }
}


/**
 *
 * @enum {number}
 */
const FoliageLayerState = {
    Loading: 0,
    Live: 1,
    Removed: 2
};