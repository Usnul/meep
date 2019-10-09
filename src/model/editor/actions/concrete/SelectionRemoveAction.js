import { Action } from "../Action.js";

class SelectionRemoveAction extends Action {
    /**
     * Created by Alex on 16/01/2017.
     */
    constructor(entities) {
        super();
        this.oldState = null;
        this.entities = entities;
    }

    apply(editor) {
        const selection = editor.selection;
        this.oldState = selection.clone();
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            const index = selection.indexOf(entity);
            if (index !== -1) {
                selection.remove(index);
            }
        }
    }

    revert(editor) {
        editor.selection.copy(this.oldState);
    }
}

export default SelectionRemoveAction;