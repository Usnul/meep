import { Action } from "../Action.js";

/**
 * Created by Alex on 16/01/2017.
 * TODO update
 */
class ComponentRemoveAction extends Action {
    constructor(entity, componentType) {
        super();

        this.entity = entity;
        this.componentType = componentType;
        this.component = null;
    }

    apply(editor) {
        const em = editor.engine.entityManager;
        const systemId = em.getSystemIdByComponentClass(this.componentType);
        this.component = em.removeComponentFromEntity(this.entity, systemId);
    }

    revert(editor) {
        const em = editor.engine.entityManager;
        em.addComponentToEntity(this.entity, this.component);
    }
}

export default ComponentRemoveAction;
