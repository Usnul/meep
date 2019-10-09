import DatGuiController from "./DatGuiController.js";
import { clear } from "../../../ui/controller/dat/DatGuiUtils.js";
import { GameAssetType } from "../../../../model/engine/asset/GameAssetType.js";
import { LineView } from "./common/LineView.js";
import LabelView from "../../../ui/common/LabelView.js";
import Vector2Control from "../../../ui/controller/controls/Vector2Control.js";

export class TerrainController extends DatGuiController {
    /**
     *
     * @param {AssetManager} assetManager
     */
    constructor(assetManager) {
        super();

        const self = this;

        function updateMaterial() {
            /**
             *
             * @type {Terrain}
             */
            const terrain = self.model.getValue();

            const desc = terrain.materialDesc;
            if (desc.type === 'splat') {
                const diffuse = desc.textures.diffuse;

                terrain.pMaterial.then(m => {
                    diffuse.forEach((url, index) => {
                        assetManager.get(url, GameAssetType.DeferredTexture, asset => {

                            const uniform = m.uniforms["diffuseMap" + index];

                            const oldTexture = uniform.value;

                            const texture = asset.create();

                            if (oldTexture !== null) {
                                texture.repeat.copy(oldTexture.repeat);
                                texture.wrapS = oldTexture.wrapS;
                                texture.wrapT = oldTexture.wrapT;
                                texture.minFilter = oldTexture.minFilter;
                                texture.magFilter = oldTexture.magFilter;
                            }

                            uniform.value = texture;

                        }, console.error);
                    });
                });
            }
        }

        function updateTerrain() {

            /**
             *
             * @type {Terrain}
             */
            const terrain = self.model.getValue();

            terrain.build(assetManager);
        }


        /**
         *
         * @param {Terrain} model
         */
        function setModel(model) {
            const gui = self.gui;
            clear(gui);

            if (model !== null) {
                if (model.materialDesc.type === 'splat') {
                    const textures = model.materialDesc.textures;
                    self.addControl(textures.diffuse, '0').name('diffuse0').onChange(updateMaterial);
                    self.addControl(textures.diffuse, '1').name('diffuse1').onChange(updateMaterial);
                    self.addControl(textures.diffuse, '2').name('diffuse2').onChange(updateMaterial);
                    self.addControl(textures.diffuse, '3').name('diffuse3').onChange(updateMaterial);

                    self.addControl(textures.splat, '0').name('splat0').onChange(updateMaterial);
                    self.addControl(textures.splat, '1').name('splat1').onChange(updateMaterial);
                    self.addControl(textures.splat, '2').name('splat2').onChange(updateMaterial);
                    self.addControl(textures.splat, '3').name('splat3').onChange(updateMaterial);

                    self.addControl(model, 'heightMapURL').name('height map').onChange(updateTerrain);
                    self.addControl(model, 'heightRange').name('height range').onChange(updateTerrain);

                    const vSize = new Vector2Control();

                    vSize.model.set(model.size);

                    self.addChild(new LineView({
                        elements: [new LabelView("size"), vSize]
                    }));
                }
            }
        }

        this.model.onChanged.add(setModel);
    }
}
