/**
 * Created by Alex on 16/01/2017.
 */

import { Action } from "../Action.js";

/**
 * @extends {Action<Editor>}
 */
class EntityRemoveAction extends Action {
    constructor(entity) {
        super();
        this.entity = entity;
        this.components = [];
    }

    /**
     *
     * @param {Editor} editor
     */
    apply(editor) {
        const em = editor.engine.entityManager;

        const ecd = em.dataset;

        this.components = ecd.getAllComponents(this.entity);

        ecd.removeEntity(this.entity);
    }

    /**
     *
     * @param {Editor} editor
     */
    revert(editor) {
        const em = editor.engine.entityManager;

        const ecd = em.dataset;

        ecd.createEntitySpecific(this.entity);

        for (let i = 0; i < this.components.length; i++) {
            const c = this.components[i];
            if (c !== undefined) {
                ecd.addComponentToEntityByIndex(this.entity, i, c);
            }
        }
    }
}

export default EntityRemoveAction;
