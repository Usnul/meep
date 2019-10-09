import { CursorType } from "./CursorType.js";
import { arrayPickBestElement } from "../../../core/collection/ArrayUtils.js";

export class CursorCoalescence {
    constructor() {

        /**
         *
         * @type {CursorType[]}
         */
        this.cursorPriorities = [
            CursorType.Normal,
            CursorType.Move,
            CursorType.Pointer,
            CursorType.Attack
        ];

        this.cursors = [];
    }

    /**
     *
     * @param {CursorType[]} priorities
     */
    setPriorities(priorities) {
        this.cursorPriorities = priorities;
    }

    reset() {
        this.cursors.splice(0, this.cursors.length);
    }

    /**
     *
     * @param {CursorType} cursor
     */
    add(cursor) {
        if (this.cursors.indexOf(cursor) === -1) {
            this.cursors.push(cursor);
        }
    }

    /**
     * @returns {CursorType}
     */
    get() {
        //pick best
        return arrayPickBestElement(this.cursors, c => this.cursorPriorities.indexOf(c));
    }
}
