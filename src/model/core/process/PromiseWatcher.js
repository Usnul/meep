import List from "../collection/List.js";
import Vector1 from "../geom/Vector1.js";

export class PromiseWatcher {
    constructor() {
        /**
         *
         * @type {List<Promise>}
         */
        this.unresolved = new List();

        /**
         *
         * @type {Vector1}
         */
        this.unresolvedCount = new Vector1(0);

        this.unresolved.on.added.add(() => this.unresolvedCount.increment());
        this.unresolved.on.removed.add(() => this.unresolvedCount.decrement());
    }

    /**
     *
     * @param {Promise} promise
     */
    add(promise) {
        this.unresolved.add(promise);

        promise.finally(() => {
            this.unresolved.removeOneOf(promise);
        });
    }
}
