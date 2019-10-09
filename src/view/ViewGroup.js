import { collectIteratorValueToArray } from "../model/core/collection/IteratorUtils.js";

export class ViewGroup {
    constructor() {
        /**
         * @private
         * @type {Set<View>}
         */
        this.elements = new Set();


        /**
         * @private
         * @type {View|null}
         */
        this.container = null;
    }

    /**
     *
     * @param {View} view
     */
    add(view) {
        this.elements.add(view);

        if (this.container !== null) {
            this.container.addChild(view);
        }
    }

    /**
     *
     * @param {View} view
     */
    remove(view) {
        const removedElement = this.elements.remove(view);

        if (removedElement) {
            if (this.container !== null) {
                this.container.removeChild(view);
            }

            return true;
        } else {
            return false;
        }
    }

    /**
     *
     * @param {View} container
     */
    connect(container) {
        const oldContainer = this.container;

        if (oldContainer !== null) {
            this.disconnect();
        }

        this.container = container;

        const iterator = this.elements.values();

        const views = [];

        collectIteratorValueToArray(views, iterator);

        const l = views.length;

        for (let i = 0; i < l; i++) {

            const view = views[i];

            container.addChild(view);
        }
    }

    disconnect() {
        const iterator = this.elements.values();

        const views = [];

        collectIteratorValueToArray(views, iterator);

        const l = views.length;

        for (let i = 0; i < l; i++) {

            const view = views[i];

            this.container.addChild(view);
        }

        this.container = null;
    }
}
