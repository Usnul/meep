import { CompositeBehavior } from "./CompositeBehavior.js";
import { BehaviorStatus } from "../BehaviorStatus";
import { BitSet } from "../../../../core/binary/BitSet";

/**
 *
 * @enum {number}
 */
export const ParallelBehaviorPolicy = {
    RequireOne: 0,
    RequireAll: 1
};

export class ParallelBehavior extends CompositeBehavior {
    /**
     *
     * @param {ParallelBehaviorPolicy} successPolicy
     * @param {ParallelBehaviorPolicy} failurePolicy
     */
    constructor(successPolicy, failurePolicy) {
        super();

        /**
         * @private
         * @type {ParallelBehaviorPolicy}
         */
        this.successPolicy = successPolicy;

        /**
         * @private
         * @type {ParallelBehaviorPolicy}
         */
        this.failurePolicy = failurePolicy;

        /**
         * @private
         * @type {BitSet}
         */
        this.activeSet = new BitSet();

        /**
         * @private
         * @type {number}
         */
        this.successCount = 0;
        /**
         * @private
         * @type {number}
         */
        this.failureCount = 0;
    }

    /**
     *
     * @param {number} timeDelta
     * @returns {BehaviorStatus|number}
     */
    tick(timeDelta) {

        const activeSet = this.activeSet;

        /**
         *
         * @type {Behavior[]}
         */
        const children = this.__children;

        const numChildren = children.length;

        let i;

        for (i = 0; i < numChildren; i++) {
            if (!activeSet.get(i)) {
                continue;
            }

            const child = children[i];

            const status = child.tick(timeDelta);

            if (status === BehaviorStatus.Succeeded) {
                activeSet.set(i, false);

                this.successCount++;

                child.finalize();

                if (this.successPolicy === ParallelBehaviorPolicy.RequireOne) {
                    return BehaviorStatus.Succeeded;
                }

            } else if (status === BehaviorStatus.Failed) {
                activeSet.set(i, false);

                this.failureCount++;

                child.finalize();

                if (this.failurePolicy === ParallelBehaviorPolicy.RequireOne) {
                    return BehaviorStatus.Failed;
                } else if (this.successPolicy === ParallelBehaviorPolicy.RequireAll) {
                    return BehaviorStatus.Failed;
                }

            }
        }

        if (this.successCount === numChildren && this.successPolicy === ParallelBehaviorPolicy.RequireAll) {
            return BehaviorStatus.Succeeded;
        } else if (this.failureCount === numChildren && this.failurePolicy === ParallelBehaviorPolicy.RequireAll) {
            return BehaviorStatus.Failed;
        } else if ((this.failureCount + this.successCount) === numChildren) {
            return BehaviorStatus.Failed;
        } else {
            return BehaviorStatus.Running;
        }
    }

    initialize() {
        const children = this.__children;
        const numChildren = children.length;

        for (let i = 0; i < numChildren; i++) {
            const behavior = children[i];

            behavior.initialize();

            this.activeSet.set(i, true);
        }

        super.initialize();
    }


    finalize() {
        //finalize remaining active behaviours
        const children = this.__children;

        const activeSet = this.activeSet;

        for (let i = activeSet.nextSetBit(0); i !== -1; i = activeSet.nextSetBit(i + 1)) {
            const behavior = children[i];


            behavior.finalize();
        }
    }

    /**
     *
     * @param {Behavior[]} elements
     * @returns {ParallelBehavior}
     */
    static from(elements) {
        const r = new ParallelBehavior(ParallelBehaviorPolicy.RequireAll, ParallelBehaviorPolicy.RequireOne);

        elements.forEach(e => r.addChild(e));

        return r;
    }
}
