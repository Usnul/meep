import { noop, returnTrue } from "../../../core/function/Functions.js";

export class VisibilityFilter {
    constructor({
                    name,
                    objectPredicateInitialize = noop,
                    objectPredicateFinalize = noop,
                    objectPredicateExecute = returnTrue,
                    layerPredicate = returnTrue
                }) {

        this.name = name;

        this.objectPredicateExecute = objectPredicateExecute;
        this.objectPredicateInitialize = objectPredicateInitialize;
        this.objectPredicateFinalize = objectPredicateFinalize;

        this.layerPredicate = layerPredicate;

        /**
         *
         * @type {boolean}
         */
        this.enabled = true;
    }
}