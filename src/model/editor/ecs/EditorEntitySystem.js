import { System } from "../../engine/ecs/System.js";
import EditorEntity from "./EditorEntity.js";

class EditorEntitySystem extends System {
    constructor() {
        super();

        this.componentClass = EditorEntity;
    }

    update(timeDelta) {
    }
}


export default EditorEntitySystem;