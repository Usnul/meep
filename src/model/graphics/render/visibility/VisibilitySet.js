import { Frustum } from "three";
import { frustumFromCamera } from "../../ecs/camera/CameraSystem.js";
import { assert } from "../../../core/assert.js";

const frustum = new Frustum();

export class VisibilitySet {
    constructor() {
        /**
         *
         * @type {VisibilityFilter[]}
         */
        this.filters = [];
        /**
         *
         * @type {Camera}
         */
        this.camera = null;
    }

    /**
     *
     * @param {VisibilityFilter} filter
     */
    addFilter(filter) {
        if (this.filters.find(f => f.name === filter.name)) {
            throw new Error(`Filter named '${filter.name}' already exists`);
        }

        this.filters.push(filter);
    }

    /**
     *
     * @param {VisibilityFilter} filter
     * @returns {boolean}
     */
    removeFilter(filter) {
        const i = this.filters.indexOf(filter);

        if (i === -1) {
            //not present
            return false;
        }

        //cut
        this.filters.splice(i, 1);
        return true;
    }

    /**
     *
     * @param {Camera} camera
     */
    setCamera(camera) {
        this.camera = camera;
    }

    /**
     *
     * @param {RenderLayerManager} renderLayers
     */
    build(renderLayers) {

        const filters = this.filters;

        const camera = this.camera;

        frustumFromCamera(camera, frustum);

        const frustums = [frustum];

        /**
         *
         * @param {RenderLayer} layer
         */
        function processLayer(layer) {
            if (!layer.visible) {
                //whole layer is hidden
                return;
            }

            //clear visible set
            layer.visibleSet.length = 0;

            /**
             *
             * @type {VisibilityFilter[]}
             */
            const objectFilters = filters
                .filter(f => f.enabled && f.layerPredicate(layer));

            const objectFilterExecutors = objectFilters
                .map(f => f.objectPredicateExecute);

            /**
             *
             * @param {Object3D} object3d
             */
            function visitPreFiltered(object3d) {
                assert.equal(object3d.isObject3D, true, `expected isObject3D to be true, instead was '${object3d.isObject3D}'`);

                //object passed all filters, add it to visible set
                layer.visibleSet.push(object3d);
            }

            //prepare filters
            objectFilters.forEach(f => f.objectPredicateInitialize(camera));

            layer.buildVisibleSet(frustums, objectFilterExecutors, visitPreFiltered);


            //finalize filters
            objectFilters.forEach(f => f.objectPredicateFinalize());

        }

        renderLayers.traverse(processLayer);
    }
}
