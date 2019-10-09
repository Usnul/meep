import { System } from "../../ecs/System.js";
import { Blackboard } from "./Blackboard.js";

export class BlackboardSystem extends System {
    constructor() {
        super();

        this.componentClass = Blackboard;
    }
}