import { BehaviorStatus } from "./BehaviorStatus.js";
import { assert } from "../../../core/assert.js";

export class Behavior {
    constructor() {
        /**
         *
         * @type {BehaviorStatus}
         * @protected
         */
        this.__status = BehaviorStatus.Initial;
    }

    /**
     *
     * @returns {BehaviorStatus}
     */
    getStatus() {
        return this.__status;
    }

    /**
     * NOTE: Be careful when setting this directly, make sure that finalization and initialization are handled properly
     * @param {BehaviorStatus} s
     */
    setStatus(s) {
        assert.ok(Object.values(BehaviorStatus).includes(s), `'${s}' is not a valid BehaviorStatus`);

        this.__status = s;
    }

    /**
     * @param {number} timeDelta
     * @returns {BehaviorStatus}
     */
    tick(timeDelta) {
        throw new Error('Abstract method, needs to be overridden');
    }

    initialize() {
        this.__status = BehaviorStatus.Running;
    }

    finalize() {
    }
}
