import List from "../../core/collection/List.js";
import RenderLayer from "./RenderLayer.js";

class RenderLayerManager {
    constructor() {
        this.layers = new List();
    }

    /**
     *
     * @param {string} name
     * @return {RenderLayer}
     */
    create(name) {
        const result = new RenderLayer();

        result.name = name;

        this.add(result);

        return result;
    }

    /**
     *
     * @param {RenderLayer} layer
     */
    add(layer) {

        const name = layer.name;

        const existingLayer = this.getLayerByName(name);

        if (existingLayer !== undefined) {
            throw new Error(`RenderLayer named '${name}' already exists`);
        }


        this.layers.add(layer);

    }

    /**
     *
     * @param {RenderLayer} layer
     * @returns {boolean}
     */
    remove(layer) {
        return this.layers.removeOneOf(layer);
    }

    /**
     *
     * @param {string} name
     * @returns {RenderLayer|undefined}
     */
    getLayerByName(name) {
        return this.layers.find(function (layer) {
            return layer.name === name;
        });
    }

    /**
     *
     * @param {function(RenderLayer)} visitor
     */
    traverse(visitor) {
        this.layers.forEach(visitor);
    }

    /**
     * @template {T}
     * @param {function(RenderLayer):T} mapper
     * @returns {T[]}
     */
    map(mapper) {
        return this.layers.map(mapper);
    }
}

export { RenderLayerManager };