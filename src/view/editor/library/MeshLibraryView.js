import View from "../../View.js";
import { makeModelView } from "../../ui/renderModel.js";
import Vector2 from "../../../model/core/geom/Vector2.js";
import domify from "../../DOM.js";
import { computePathBase } from "../../../model/core/FilePath.js";
import LabelView from "../../ui/common/LabelView.js";
import List from "../../../model/core/collection/List.js";
import AABB2 from "../../../model/core/geom/AABB2.js";
import { DragEvents } from "../../../model/engine/input/devices/events/DragEvents.js";
import { MouseEvents } from "../../../model/engine/input/devices/events/MouseEvents.js";
import { TouchEvents } from "../../../model/engine/input/devices/events/TouchEvents.js";


const ICON_SIZE = 50;

class MeshAssetView extends View {
    /**
     *
     * @param {string} url
     * @param {Promise.<AssetManager>} assetManager
     * @param {Promise.<WebGLRenderer>} renderer
     * @constructor
     */
    constructor({ url, assetManager, renderer }) {
        super();

        const $el = domify();

        $el.addClass('ui-mesh-library-asset-view');

        this.el = $el.el;

        Promise.all([assetManager, renderer])
            .then(function ([assetManager, renderer]) {
                const imagePromise = makeModelView(url, assetManager, new Vector2(ICON_SIZE, ICON_SIZE), renderer, new AABB2(0, 0, 1, 1));

                imagePromise.then(function (image) {
                    $el.append(image);
                });
            });

        const pathBase = computePathBase(url);

        const lastIndexOfDot = pathBase.lastIndexOf('.');

        let fileName;
        if (lastIndexOfDot !== -1) {
            fileName = pathBase.substring(0, lastIndexOfDot);
        } else {
            fileName = pathBase;
        }

        const vName = new LabelView(fileName);

        this.addChild(vName);

        $el.attr({ draggable: true });

        $el.on(DragEvents.DragStart, function (event) {
            console.log('dragstart', event);
            event.stopPropagation();

            event.dataTransfer.setData('text/json', JSON.stringify({
                type: "Mesh",
                url
            }));
        });

        $el.on(MouseEvents.Down, function (event) {
            event.stopPropagation();
        });

        $el.on(TouchEvents.Start, function (event) {
            event.stopPropagation();
        });

        $el.on(MouseEvents.Move, function (event) {
            event.stopPropagation();
        });

        $el.on(TouchEvents.Move, function (event) {
            event.stopPropagation();
        });
    }
}


class MeshLibraryView extends View {
    /**
     *
     * @param {MeshLibrary} library
     * @param {Promise.<AssetManager>} assetManager
     * @param {Promise.<WebGLRenderer>} renderer
     * @constructor
     */
    constructor(library, assetManager, renderer) {
        super();

        const $el = domify();

        $el.addClass('ui-mesh-library-view');

        this.el = $el.el;

        this.assets = new List();

        const self = this;

        function layout() {
            const width = self.size.x;

            const columnSpacing = 16;

            const minRowSpacing = 8;

            const rowLength = Math.floor(width / (ICON_SIZE + minRowSpacing));

            const spareRowWidth = width - ICON_SIZE * rowLength;

            const rowSpacing = spareRowWidth / Math.max(1, rowLength - 1);

            const assets = self.assets;

            const numAssets = assets.length;

            let rowIndex = 0;
            let columnIndex = 0;
            for (let i = 0; i < numAssets; i++) {
                const assetView = assets.get(i);

                assetView.position.set(rowIndex * (ICON_SIZE + rowSpacing), columnIndex * (ICON_SIZE + columnSpacing));

                rowIndex++;
                if (rowIndex >= rowLength) {
                    //start new row
                    rowIndex = 0;
                    columnIndex++;
                }
            }
        }

        function addAsset(url) {
            const assetView = new MeshAssetView({ url, assetManager, renderer });

            self.assets.add(assetView);

            self.addChild(assetView);
        }

        library.assets.forEach(addAsset);
        library.assets.on.added.add(addAsset);

        this.layout = layout;

        this.bindSignal(this.size.onChanged, layout);

        this.on.linked.add(layout);
    }
}




export default MeshLibraryView;
