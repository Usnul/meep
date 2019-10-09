import { SimpleLifecycleStateType } from "./SimpleLifecycle.js";
import Signal from "../../../core/events/signal/Signal.js";

export class ModalStack {
    constructor() {
        /**
         *
         * @type {SimpleLifecycle[]}
         */
        this.elements = [];

        /**
         *
         * @type {SimpleLifecycle|null}
         * @private
         */
        this.__active = null;

        this.observers = new Map();

        this.on = {
            lastRemoved: new Signal(),
            firstAdded: new Signal(),
        };
    }

    hasActive() {
        return this.__active !== null;
    }


    update() {
        if (!this.hasActive()) {

            if (this.elements.length > 0) {
                const l = this.elements[0];

                this.activate(l);
            }
        }
    }

    /**
     *
     * @param {SimpleLifecycle} lifecycle
     */
    activate(lifecycle) {
        this.__active = lifecycle;

        lifecycle.makeActive();
    }

    /**
     *
     * @param {SimpleLifecycle} lifecycle
     */
    add(lifecycle) {
        const handleDestruction = () => {
            this.remove(lifecycle);
            this.update();
        };

        lifecycle.sm.addEventHandlerStateEntry(SimpleLifecycleStateType.Destroyed, handleDestruction);

        // push to the queue
        this.elements.push(lifecycle);

        // sort elements by priority
        this.elements.sort((a, b) => b.priority - a.priority);

        if (this.hasActive() && this.__active !== this.elements[0]) {
            // after sorting current active element is no longer the valid
            this.__active.makeReady();
            this.__active = null;
        }

        this.update();

        if (this.elements.length === 1) {
            this.on.firstAdded.dispatch();
        }
    }

    /**
     *
     * @param {SimpleLifecycle} lifecycle
     */
    remove(lifecycle) {

        //remove element from the queue
        const i = this.elements.indexOf(lifecycle);
        if (i !== -1) {

            if (lifecycle === this.__active) {
                this.__active = null;
            }

            this.elements.splice(i, 1);
            this.update();

            if (this.elements.length === 0) {
                this.on.lastRemoved.dispatch();
            }

            return true;
        } else {
            // element not found

            return false;
        }

    }
}
