/**
 * Created by Alex on 13/04/2016.
 */

import { System } from '../../../engine/ecs/System';
import Team from './Team';

class TeamSystem extends System {
    constructor() {
        super();
        this.componentClass = Team;
    }
}

export default TeamSystem;
