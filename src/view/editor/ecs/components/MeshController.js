/**
 * Created by Alex on 16/01/2017.
 */
import GuiControl from '../../../ui/controller/controls/GuiControl';

import MeshPreview from '../../../ui/elements/MeshPreview';

import { clear } from "../../../ui/controller/dat/DatGuiUtils.js";
import DatGuiController from "./DatGuiController.js";
import Mesh from "../../../../model/graphics/ecs/mesh/Mesh.js";
import EmptyView from "../../../ui/elements/EmptyView.js";

class MeshController extends GuiControl {
    /**
     *
     * @param {AssetManager} assetManager
     * @constructor
     */
    constructor(assetManager) {
        super();

        this.addClass("ui-mesh-controller");

        this.assetManager = assetManager;

        this.vPreview = null;

        const self = this;

        this.vDat = new DatGuiController();

        const gui = this.vDat.gui;

        this.vPreviewContainer = new EmptyView();

        this.addChild(this.vPreviewContainer);

        this.addChild(this.vDat);

        function modelSet(meshNew, meshOld) {
            if (self.vPreview !== null) {
                self.vPreview.size.set(200, 200);
                self.removeChild(self.vPreview);
                self.vPreview = null;
            }

            clear(gui);

            if (meshNew !== null) {
                self.createPreview();

                gui.add(meshNew, 'url').onFinishChange(function () {
                    self.createPreview();
                    /**
                     * @type {EntityManager}
                     */
                    const entityManager = self.entityManager;

                    /**
                     *
                     * @type {MeshSystem}
                     */
                    const meshSystem = entityManager.getSystemByComponentClass(Mesh);

                    /**
                     *
                     * @type {Mesh}
                     */
                    const meshComponent = self.model.getValue();

                    meshComponent.mesh = null;

                    meshSystem.process(self.entity, meshComponent);
                });
                gui.add(meshNew, 'castShadow');
                gui.add(meshNew, 'receiveShadow');
                gui.add(meshNew, 'center');
                gui.add(meshNew, 'opacity').min(0).max(1).step(0.0001);
            }
        }

        this.model.onChanged.add(modelSet);

    }

    destroyPreview() {
        if (this.vPreview !== null) {
            this.vPreviewContainer.removeChild(this.vPreview);
            this.vPreview = null;
        }
    }

    createPreview() {
        this.destroyPreview();
        const mesh = this.model.get();
        if (mesh !== null) {
            this.vPreview = new MeshPreview({
                url: mesh.url,
                assetManager: this.assetManager
            });
            this.vPreview.size.set(200, 200);
            this.vPreviewContainer.addChild(this.vPreview);
        }
    }
}


export default MeshController;
