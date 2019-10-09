import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

/**
 * @extends {Behavior}
 */
export class RepeatBehavior extends Behavior {
    /**
     *
     * @param {Behavior} source
     * @param {number} [count=Infinity]
     */
    constructor(source, count = Infinity) {
        super();

        /**
         *
         * @type {number}
         * @private
         */
        this.__limit = count;

        /**
         *
         * @type {Behavior}
         * @private
         */
        this.__source = source;

        /**
         *
         * @type {number}
         * @private
         */
        this.__iterator = 0;
    }

    tick(timeDelta) {
        const s = this.__source.tick(timeDelta);

        if (s !== BehaviorStatus.Succeeded && s !== BehaviorStatus.Failed) {

            this.__status = s;

            return s;

        }

        this.__iterator++;

        if (this.__iterator >= this.__limit) {
            this.__status = BehaviorStatus.Succeeded;

            return BehaviorStatus.Succeeded;
        } else {
            //re-initialize the source behavior
            this.__source.initialize();

            return BehaviorStatus.Running;
        }
    }

    initialize() {
        this.__source.initialize();

        this.__status = BehaviorStatus.Running;
    }

    finalize() {
        this.__source.finalize();
    }
}