import { Behavior } from "../Behavior";
import { BehaviorStatus } from "../BehaviorStatus";

export class FailingBehavior extends Behavior {
    constructor(delayTicks = 0) {
        super();

        this.delayTicks = delayTicks;
    }

    tick() {
        if (this.delayTicks === 0) {
            this.__status = BehaviorStatus.Failed;

            return BehaviorStatus.Failed;
        } else {
            this.delayTicks--;

            return BehaviorStatus.Running;
        }
    }
}
