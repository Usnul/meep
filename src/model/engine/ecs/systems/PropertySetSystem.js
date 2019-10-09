/**
 * Created by Alex on 13/04/2017.
 */


import { System } from '../System';
import PropertySet from '../components/PropertySet';

class PropertySetSystem extends System {
    constructor() {
        super();
        this.componentClass = PropertySet;
    }
}


export default PropertySetSystem;