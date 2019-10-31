import { MinimapWorldLayer } from "./MinimapWorldLayer.js";
import { Mesh, MeshBasicMaterial, PlaneBufferGeometry } from "three";
import ObservedValue from "../../../model/core/model/ObservedValue.js";
import Vector2 from "../../../model/core/geom/Vector2.js";
import { Cache } from "../../../model/core/Cache.js";
import { GameAssetType } from "../../../model/engine/asset/GameAssetType.js";

export class MinimapTerrainGL extends MinimapWorldLayer {
    /**
     *
     * @param {AssetManager} assetManager
     */
    constructor({ assetManager }) {
        super();

        const textureCache = new Cache({
            maxWeight: 2
        });

        const geometry = new PlaneBufferGeometry(1, 1, 1, 1);
        const material = new MeshBasicMaterial({ color: 0xFFFFFF });

        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI * 0.5;

        const self = this;

        /**
         *
         * @returns {TerrainPreview}
         */
        function getPreview() {
            const terrain = self.terrain.getValue();

            if (terrain === null) {
                return null;
            }

            /**
             *
             * @type {TerrainPreview}
             */
            const preview = terrain.preview;

            return preview;
        }

        function setTexture(texture) {


            material.map = texture;


            updateMesh();

            // trigger a render request
            self.needsRender = true;
        }

        function updateTexture() {
            const url = getPreview().url;

            //check cache
            const cachedTexture = textureCache.get(url);

            if (cachedTexture !== null) {
                //use cached texture
                setTexture(cachedTexture);
            } else {

                //get texture from asset manager
                assetManager.promise(url, GameAssetType.Texture)
                    .then(function (asset) {
                        /**
                         *
                         * @type {Texture}
                         */
                        const texture = asset.create();

                        // mipmaps are necessary for a decent performance when zooming out of the map
                        texture.generateMipamps = true;

                        material.needsUpdate = true;

                        setTexture(texture);

                        textureCache.put(url, texture);
                    });
            }
        }

        function updateMesh() {
            const terrain = self.terrain.getValue();

            if (terrain === null) {
                return null;
            }

            const resolution = new Vector2(2048, 2048);

            if (material.map !== null) {
                /**
                 * @type {Image}
                 */
                const image = material.map.image;

                const naturalWidth = image.naturalWidth;
                const naturalHeight = image.naturalHeight;

                resolution.set(naturalWidth, naturalHeight);
            }

            /**
             *
             * @type {TerrainPreview}
             */
            const preview = terrain.preview;

            const scale = preview.scale;
            const offset = preview.offset;

            const mLeft = offset.x * scale.x;
            const mTop = offset.y * scale.y;

            const nX = resolution.x * scale.x;
            const nY = resolution.y * scale.y;

            mesh.scale.set(nX, nY, 1);

            mesh.position.set(-mLeft + nX / 2, 1, -mTop + nY / 2);


            // trigger a render request
            self.needsRender = true;
        }

        this.object = mesh;

        /**
         *
         * @type {ObservedValue<Terrain>}
         */
        this.terrain = new ObservedValue(null);

        /**
         *
         * @param {Terrain} terrain
         * @param {Terrain} oldTerrain
         * @private
         */
        this.__setTerrain = function setTerrain(terrain, oldTerrain) {
            if (terrain !== null) {
                terrain.preview.offset.onChanged.add(updateMesh);
                terrain.preview.scale.onChanged.add(updateMesh);

                updateMesh();
                updateTexture();
            }

            if (oldTerrain !== null) {
                oldTerrain.preview.offset.onChanged.remove(updateMesh);
                oldTerrain.preview.scale.onChanged.remove(updateMesh);
            }
        };


    }

    startup() {
        this.terrain.onChanged.add(this.__setTerrain);

        this.__setTerrain(this.terrain.getValue(), null);
    }

    shutdown() {
        this.terrain.onChanged.remove(this.__setTerrain);

        this.__setTerrain(null, this.terrain.getValue());
    }
}
