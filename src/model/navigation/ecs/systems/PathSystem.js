/**
 * Created by Alex on 17/10/2016.
 */


import { System } from '../../../engine/ecs/System';
import Path from '../components/Path';

class PathSystem extends System {
    constructor() {
        super();
        this.componentClass = Path;
        //
        this.entityManager = null;
    }
}


export default PathSystem;
