import { CompositeBehavior } from "./composite/CompositeBehavior.js";
import { BehaviorStatus } from "./BehaviorStatus.js";

export class SelectorBehavior extends CompositeBehavior {
    constructor() {
        super();

        /**
         *
         * @type {Behavior}
         * @private
         */
        this.__currentBehaviour = null;

        /**
         *
         * @type {number}
         * @private
         */
        this.__currentBehaviourIndex = -1;
    }

    tick(timeDelta) {
        //keep going until a child behavior says it's running
        while (true) {
            const s = this.__currentBehaviour.tick(timeDelta);

            //if child succeeds or keeps running, do the same
            if (s !== BehaviorStatus.Failed) {
                this.__status = s;
                return s;
            }

            //Continue search for a fallback until the last child
            const children = this.__children;
            if (this.__currentBehaviourIndex + 1 >= children.length) {
                this.__status = BehaviorStatus.Failed;
                return BehaviorStatus.Failed;
            }

            this.__currentBehaviourIndex++;
            this.__currentBehaviour = children[this.__currentBehaviourIndex];
        }
    }

    initialize() {
        this.__currentBehaviourIndex = 0;
        this.__currentBehaviour = this.__children[0];

        this.__currentBehaviour.initialize();

        this.__status = BehaviorStatus.Running;
    }
}