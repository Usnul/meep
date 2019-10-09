import { Action } from "../Action.js";

class SelectionClearAction extends Action {
    /**
     * Created by Alex on 16/01/2017.
     */
    constructor() {
        super();
        this.oldState = null;
    }

    apply(editor) {
        this.oldState = editor.selection.clone();
        editor.selection.reset();
    }

    revert(editor) {
        editor.selection.copy(this.oldState);
    }
}

export default SelectionClearAction;