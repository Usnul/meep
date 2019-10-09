import Tool from "./engine/Tool.js";
import Vector1 from "../../core/geom/Vector1";
import ObservedValue from "../../core/model/ObservedValue";
import { parseHex } from "../../core/color/ColorUtils";
import Vector4 from "../../core/geom/Vector4";
import loadSampler2D from "../../graphics/texture/sampler/loadSampler2D";
import convertSampler2D2Canvas from "../../graphics/texture/sampler/Sampler2D2Canvas";
import { Foliage2 } from "../../level/foliage/ecs/Foliage2.js";
import { obtainTerrain } from "../../level/terrain/ecs/Terrain.js";

class FoliagePaintTool extends Tool {
    constructor() {
        super();
        this.name = "foliage_paint";

        this.settings.layer = new Vector1(0);
        this.settings.value = new Vector1(1);
        this.settings.alphaMultiplier = new Vector1(1);
        this.settings.color = new ObservedValue("#FFFFFF");

        this.settings.baseColor = new ObservedValue("#000000");
        this.settings.baseColorAlpha = new Vector1(0.6);

        const self = this;

    }

    updateSelection() {
        self.paint();
    }

    buildColor() {

        const color = new Vector4();
        const baseColor = parseHex(this.settings.color.get());
        color.set(baseColor.r, baseColor.g, baseColor.b, 0);
        color.multiplyScalar(1 / 255);

        return color;
    }

    buildBaseColor() {

        const color = new Vector4();
        const baseColor = parseHex(this.settings.baseColor.get());
        color.set(baseColor.r, baseColor.g, baseColor.b, 0);
        color.multiplyScalar(1 / 255);

        color.w = this.settings.baseColorAlpha.getValue();

        return color;
    }

    initialize() {
        super.initialize();

        const engine = this.engine;
        const editor = this.editor;

        this.terrain = obtainTerrain(engine.entityManager.dataset, function (t, entity) {
            self.terrainEntity = entity;
        });

        this.terrain.overlay.push();

        this.terrain.overlay.borderWidth.set(0);

        this.paint();

        editor.selection.on.added.add(this.updateSelection);
        editor.selection.on.removed.add(this.updateSelection);
    }

    shutdown() {
        this.terrain.overlay.pop();

        this.editor.selection.on.added.remove(this.updateSelection);
        this.editor.selection.on.removed.remove(this.updateSelection);

        this.settings.value.onChanged.remove(this.updateSelection);
        this.settings.alphaMultiplier.onChanged.remove(this.updateSelection);
        this.settings.color.onChanged.remove(this.updateSelection);

        super.shutdown();
    }

    paint() {

        const alphaMultiplier = this.settings.alphaMultiplier.getValue();
        const overlay = this.terrain.overlay;
        overlay.clear();

        const layer = this.settings.layer.getValue();

        const color = this.buildColor();

        const baseColor = this.buildBaseColor();

        const engine = this.engine;

        /**
         *
         * @param {Foliage2} foliage
         * @param {Number} entity
         */
        function visit(foliage, entity) {
            const foliageLayer = foliage.layers.get(layer);
            loadSampler2D(foliageLayer.densityMap.get(), engine.assetManager).then(function (sampler) {

                overlay.size.set(sampler.width, sampler.height);
                overlay.clear();

                const v4c = new Vector4(0, 0, 0, 0);

                function mappingFunction(index, array, x, y) {
                    const address = index;
                    const alpha = sampler.data[address / 4] * alphaMultiplier;
                    color.w = alpha;

                    Vector4.lerp(color, baseColor, (1 - alpha), v4c);

                    //scale to unsigned byte value
                    v4c.multiplyScalar(255);


                    array[address] = v4c.x;
                    array[address + 1] = v4c.y;
                    array[address + 2] = v4c.z;
                    //alpha
                    array[address + 3] = v4c.w;
                }

                convertSampler2D2Canvas(sampler, 1, 0, overlay.canvas, mappingFunction);

                overlay.update();
            });
        }

        //initialize overlay
        this.traverse(visit);
    }

    traverse(callback) {
        /**
         * @type {EntityManager}
         */
        const entityManger = this.engine.entityManager;
        this.editor.selection.forEach(function (entity) {

            /**
             *
             * @type {Foliage2}
             */
            const foliage = entityManger.getComponent(entity, Foliage2);


            if (foliage === null) {
                //do nothing
                return;
            }

            callback(foliage, entity);
        });
    }
}


export default FoliagePaintTool;
