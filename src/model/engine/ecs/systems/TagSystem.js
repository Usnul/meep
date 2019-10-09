/**
 * Created by Alex on 23/04/2014.
 */
import { System } from '../System';
import Tag from '../components/Tag';


class TagSystem extends System {
    constructor() {
        super();
        this.componentClass = Tag;
        this.entityManager = null;
    }
}


export default TagSystem;
