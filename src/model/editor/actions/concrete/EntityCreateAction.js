import { Action } from "../Action.js";

class EntityCreateAction extends Action {
    /**
     * Created by Alex on 16/01/2017.
     */
    constructor() {
        super();
        /**
         *
         * @type {number|null}
         */
        this.entity = null;
    }

    apply(editor) {
        const em = editor.engine.entityManager;
        if (this.entity === null) {
            this.entity = em.createEntity();
        } else {
            em.createEntitySpecific(this.entity);
        }
    }

    revert(editor) {
        editor.engine.entityManager.removeEntity(this.entity);
    }
}

export default EntityCreateAction;