import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import { assert } from "../../../../core/assert.js";

export class ActionBehavior extends Behavior {
    /**
     *
     * @param {function} action
     */
    constructor(action) {
        super();

        assert.typeOf(action, 'function', "action");

        this.__action = action;
    }

    tick(timeDelta) {

        this.__action(timeDelta);

        this.__status = BehaviorStatus.Succeeded;

        return this.__status;
    }
}
