import { Behavior } from "../Behavior";
import { BehaviorStatus } from "../BehaviorStatus";

export class SucceedingBehavior extends Behavior {
    constructor(delayTicks = 0) {
        super();

        this.delayTicks = delayTicks;
    }

    tick() {
        if (this.delayTicks === 0) {
            return BehaviorStatus.Succeeded;
        } else {
            this.delayTicks--;
            return BehaviorStatus.Running;
        }
    }
}