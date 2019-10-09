import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

export class ConditionBehavior extends Behavior {
    /**
     *
     * @param {function():boolean} accessor
     */
    constructor(accessor) {
        super();

        /**
         *
         * @type {function(): boolean}
         * @private
         */
        this.__accessor = accessor;
    }

    tick(timeDelta) {
        const v = this.__accessor();

        const s = v ? BehaviorStatus.Succeeded : BehaviorStatus.Failed;

        this.__status = s;

        return s;
    }
}