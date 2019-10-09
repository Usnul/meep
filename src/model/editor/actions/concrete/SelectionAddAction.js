/**
 * Created by Alex on 16/01/2017.
 */
import { Action } from "../Action.js";


class SelectionAddAction extends Action {
    /**
     *
     * @param {int[]} entities
     * @constructor
     */
    constructor(entities) {
        super();
        this.oldState = null;
        /**
         *
         * @type {int[]}
         */
        this.entities = entities;
    }

    apply(editor) {
        this.oldState = editor.selection.clone();

        const selection = editor.selection;

        selection.addAllUnique(this.entities);
    }

    revert(editor) {
        editor.selection.copy(this.oldState);
    }
}

export default SelectionAddAction;