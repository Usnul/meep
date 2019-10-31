import View from "../../../../../view/View.js";

export class ViewEntity extends View {
    constructor() {
        super();

    }

    /**
     *
     * @param {Object} parameters
     * @param {EntityComponentDataset} dataset
     * @param {number} entity
     * @param {Engine} engine
     */
    initialize(parameters, entity, dataset, engine) {
        //override as necessary
    }

    /**
     * Release resources and bring view to initial state ready to be destroyed or re-used
     */
    finalize() {
        //override as necessary
    }
}

/**
 * @readonly
 * @type {boolean}
 */
ViewEntity.prototype.isViewEntity = true;
