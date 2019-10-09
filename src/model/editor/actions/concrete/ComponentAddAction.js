import { Action } from "../Action.js";

class ComponentAddAction extends Action {
    /**
     * Created by Alex on 16/01/2017.
     */
    constructor(entity, component) {
        super();
        this.entity = entity;
        this.component = component;
        this.dataset = null;
    }

    apply(editor) {
        const em = editor.engine.entityManager;
        const dataset = em.dataset;
        this.dataset = dataset;

        dataset.addComponentToEntity(this.entity, this.component);
    }

    revert(editor) {
        const clazz = this.component.constructor;
        this.dataset.removeComponentFromEntity(this.entity, clazz);
    }
}

export default ComponentAddAction;