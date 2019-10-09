import { System } from "../System.js";
import { ParentEntity } from "../components/ParentEntity.js";

export class ParentEntitySystem extends System {
    constructor() {
        super();
        this.componentClass = ParentEntity;
    }
}


export { ParentEntitySystem };