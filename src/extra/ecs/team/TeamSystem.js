/**
 * Created by Alex on 13/04/2016.
 */

import { System } from "../../../model/engine/ecs/System.js";
import { Team } from "./Team.js";

export class TeamSystem extends System {
    constructor() {
        super();
        this.componentClass = Team;
    }
}
