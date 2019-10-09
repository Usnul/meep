import { Behavior } from "../Behavior.js";
import { CompositeBehavior } from "./CompositeBehavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

export class SequenceBehavior extends CompositeBehavior {
    constructor() {
        super();

        /**
         *
         * @type {number}
         * @protected
         */
        this.__currentBehaviourIndex = -1;

        /**
         *
         * @type {Behavior}
         * @protected
         */
        this.__currentBehaviour = undefined;
    }

    initialize() {
        this.__currentBehaviourIndex = 0;
        this.__currentBehaviour = this.__children[this.__currentBehaviourIndex];

        //initialize first behaviour
        this.__currentBehaviour.initialize();

        super.initialize();
    }

    /**
     *
     * @param {number} timeDelta
     * @returns {BehaviorStatus}
     */
    tick(timeDelta) {
        const s = this.__currentBehaviour.tick(timeDelta);

        if (s !== BehaviorStatus.Succeeded) {
            return s;
        }

        //current behaviour succeeded, move onto the next one
        this.__currentBehaviour.finalize();

        this.__currentBehaviourIndex++;

        if (this.__currentBehaviourIndex < this.__children.length) {
            this.__currentBehaviour = this.__children[this.__currentBehaviourIndex];

            this.__currentBehaviour.initialize();

            return BehaviorStatus.Running;
        } else {
            //all behaviours completed
            return BehaviorStatus.Succeeded;
        }
    }

    finalize() {
        if (this.__currentBehaviourIndex !== this.__children.length) {
            //sequence has not been finished

            if (this.__currentBehaviour !== undefined) {
                this.__currentBehaviour.finalize();
            }
        }
    }

    /**
     *
     * @param {Behavior[]} list
     * @return {SequenceBehavior}
     */
    static from(list) {
        const r = new SequenceBehavior();

        list.forEach(b => r.addChild(b));

        return r;
    }
}
