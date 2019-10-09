import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

/**
 * Inverts result of the source behavior, success becomes failure, failure becomes success
 */
export class InverterBehavior extends Behavior {
    /**
     *
     * @param {Behavior} source
     */
    constructor(source) {
        super();

        /**
         *
         * @type {Behavior}
         * @private
         */
        this.__source = source;
    }

    tick(timeDelta) {
        let r = this.__source.tick(timeDelta);

        if (r === BehaviorStatus.Succeeded) {
            r = BehaviorStatus.Failed;
        } else if (r === BehaviorStatus.Failed) {
            r = BehaviorStatus.Succeeded;
        }

        this.__status = r;

        return r;
    }

    initialize() {
        this.__source.initialize();
        this.__status = this.__source.getStatus();
    }

    finalize() {
        this.__source.finalize();
    }
}