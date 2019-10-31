import { System } from "../../../model/engine/ecs/System.js";
import { Name } from "./Name.js";

export class NameSystem extends System {
    constructor() {
        super();

        this.componentClass = Name;
    }
}
