/**
 * Created by Alex on 02/04/2014.
 */
import { System } from '../System';
import Transform from '../components/Transform';


class TransformSystem extends System {
    constructor() {
        super();

        this.componentClass = Transform;
    }
}

export default TransformSystem;
