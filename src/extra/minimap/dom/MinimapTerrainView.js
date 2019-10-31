import View from "../../../view/View.js";
import domify from "../../../view/DOM.js";
import EmptyView from "../../../view/ui/elements/EmptyView.js";
import Vector2 from "../../../model/core/geom/Vector2.js";
import ObservedValue from "../../../model/core/model/ObservedValue.js";


export class MinimapTerrainView extends View {
    /**
     *
     * @param {Rectangle} camera
     * @param {Vector2} worldScale
     * @constructor
     */
    constructor({ camera, worldScale }) {
        super();

        let self = this;

        const $el = domify('div');
        $el.addClass("ui-terrain-view");

        this.el = $el.el;

        const vPreview = new EmptyView();
        vPreview.el.classList.add('ui-terrain-preview');

        const vPreviewImage = new EmptyView();
        vPreviewImage.el = domify('img').el;

        vPreviewImage.el.classList.add('ui-terrain-preview-image');
        vPreview.addChild(vPreviewImage);

        this.addChild(vPreview);

        /**
         *
         * @type {TerrainPreview}
         */
        this.preview = null;

        function updateTransform() {

            /**
             *
             * @type {Terrain}
             */
            const terrain = self.terrain.getValue();

            if (terrain === null) {
                return;
            }

            //compute terrain size
            const terrainSizeX = terrain.size.x * terrain.gridScale;
            const terrainSizeY = terrain.size.y * terrain.gridScale;

            //compute world scale
            const worldScaleX = worldScale.x;
            const worldScaleY = worldScale.y;


            //compute scale
            const scaleX = worldScaleX;
            const scaleY = worldScaleY;

            const offsetX = camera.position.x * worldScaleX;


            //TODO offset of 13 is a fudge factor, i don't know why it's like that
            const fudgeFactor = 0;
            const offsetY = (camera.position.y + fudgeFactor) * worldScaleY;

            vPreview.scale.set(scaleX, scaleY);
            vPreview.position.set(-offsetX, -offsetY);
        }

        /**
         *
         * @param {TerrainPreview} preview
         */
        function setPreview(preview) {
            self.preview = preview;

            const $el = domify(vPreviewImage.el);


            function imageLoaded() {
                $el.off('load', imageLoaded);
                const el = $el.el;

                const v = new Vector2(el.naturalWidth, el.naturalHeight);
                v.multiply(preview.scale);


                vPreviewImage.size.copy(v);

                vPreviewImage.position.copy(preview.offset.clone().negate().multiply(preview.scale));
            }

            $el.on('load', imageLoaded);

            $el.attr({
                src: preview.url
            });

        }

        function updatePreview() {
            /**
             * @type {Terrain}
             */
            const terrain = self.terrain.getValue();
            if (terrain !== null) {
                setPreview(terrain.preview);
            }
        }

        this.size.onChanged.add(function (x, y) {
            vPreview.size.set(x, y);
        });


        this.terrain = new ObservedValue(null);

        this.terrain.onChanged.add(this.__setTerrain);

        this.bindSignal(camera.position.onChanged, updateTransform);
        this.bindSignal(camera.size.onChanged, updateTransform);
        this.bindSignal(worldScale.onChanged, updateTransform);
    }

    __setTerrain(terrain, oldTerrain) {
            terrain.preview.offset.onChanged.add(updatePreview);
            terrain.preview.scale.onChanged.add(updatePreview);

            if (oldTerrain !== null) {
                oldTerrain.preview.offset.onChanged.remove(updatePreview);
                oldTerrain.preview.scale.onChanged.remove(updatePreview);
            }

            updatePreview();
        }
}


