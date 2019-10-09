/**
 *
 * @param entity
 * @param {Transform} modified
 * @constructor
 */
import Transform from "../../../engine/ecs/components/Transform.js";
import { Action } from "../Action.js";

class TransformModifyAction extends Action {
    /**
     *
     * @param entity
     * @param {Transform} modified
     * @constructor
     */
    constructor(entity, modified) {
        super();

        this.oldState = null;
        this.modified = modified;
        this.entity = entity;
    }

    /**
     *
     * @param {Editor} editor
     */
    apply(editor) {
        const entityManager = editor.engine.entityManager;

        const component = entityManager.getComponent(this.entity, Transform);

        this.oldState = component.clone();

        component.copy(this.modified);
    }

    revert(editor) {
        const entityManager = editor.engine.entityManager;

        const component = entityManager.getComponent(this.entity, Transform);

        component.copy(this.oldState);
    }
}

export default TransformModifyAction;