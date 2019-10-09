/**
 * @author Alex Goldring on 27/06/2017.
 * @copyright Alex Goldring 2017
 */


import List from '../../core/collection/List';
import { assert } from "../../core/assert.js";

/**
 * @template D
 * @param {number} index
 * @param {D} description
 * @constructor
 */
function Mark(index, description) {
    assert.typeOf(index, 'number', 'index');

    /**
     *
     * @type {number}
     */
    this.index = index;
    /**
     *
     * @type {D}
     */
    this.description = description;
}

/**
 * @template C, M
 * @param {C} context
 * @constructor
 */
function ActionProcessor(context) {
    /**
     *
     * @type {List<Action>}
     */
    this.history = new List();
    /**
     *
     * @type {C}
     */
    this.context = context;
    /**
     *
     * @type {Array<Mark<M>>}
     */
    this.marks = [];
    /**
     *
     * @type {number}
     */
    this.cursor = 0;

    /**
     * History beyond this limit will be dropped when a new mark is added
     * @type {number}
     */
    this.historyMarkLimit = 10000;
}

/**
 * Drop records beyond a given limit. records are dropped in batches between marks.
 *
 * NOTE valid use-cases for this method from the outside are: 1) memory management and 1) removing access to a set of previous actions
 * NOTE this method is used internally by {@link #mark} method
 *
 * @example if there are 2 marks A at record 9 and B at record 11, and requested limit is 10 - 9 records will be kept as records 10 and 11 belong to the same batch and will be removed together.
 * @param {number} limit maximum number of records to keep
 */
ActionProcessor.prototype.dropHistory = function (limit) {
    const recordsToDrop = Math.min(limit, this.history.length);
    if (recordsToDrop <= 0) {
        return;
    }

    //update marks
    let i = 0;
    let markCount = this.marks.length;
    for (; i < markCount && this.marks[i].index <= recordsToDrop; i++) {
        //find the cur-off point for marks to keep
    }

    //drop the marks
    this.marks.splice(0, i);
    //update mark count
    markCount = this.marks.length;

    //update remaining marks
    for (i = 0; i < markCount; i++) {
        const mark = this.marks[i];
        mark.index -= recordsToDrop;
    }

    //update cursor
    this.cursor -= recordsToDrop;
};

/**
 * Insert a mark into the timeline, all actions between marks are grouped logically for UNDO and REDO mechanism
 * @param {*} description
 */
ActionProcessor.prototype.mark = function (description) {
    const marks = this.marks;
    const numMarks = marks.length;

    //check current cursor, we might need to drop some marks
    if (numMarks > 0) {
        const lastMarkIndex = marks[numMarks - 1].index;
        if (lastMarkIndex >= this.cursor) {
            //drop marks also
            let markIndexToKeep;
            for (markIndexToKeep = numMarks - 1; markIndexToKeep >= 0; markIndexToKeep--) {
                if (marks[markIndexToKeep].index <= this.cursor) {
                    break;
                }
            }
            marks.splice(markIndexToKeep, numMarks - markIndexToKeep);
        }
    }

    const mark = new Mark(this.cursor, description);

    marks.push(mark);

    if (marks.length > this.historyMarkLimit) {
        const marksToDrop = marks.length - this.historyMarkLimit;

        //get first mark to keep
        const newFirstMark = marks[marksToDrop];

        //drop history before first mark's index
        this.dropHistory(newFirstMark.index);

        assert.equal(newFirstMark.index, 0, "New First Mark's index must be 0");
    }

};

ActionProcessor.prototype.undo = function () {
    let mark = 0;

    //find mark
    for (let i = this.marks.length - 1; i >= 0; i--) {
        const m = this.marks[i];
        mark = m.index;
        if (mark < this.cursor) {
            break;
        }
    }

    if (this.cursor === mark) {
        //this only happens when cursor sits on the last mark
        mark = 0;
    }

    //keep rewinding until we hit mark
    while (this.cursor > mark && this.cursor > 0) {
        this.cursor--;
        const action = this.history.get(this.cursor);
        action.revert(this.context);
    }
};

/**
 * redo previous sequence of actions on the timeline, up to the next mark
 */
ActionProcessor.prototype.redo = function () {

    let mark = this.history.length;
    //find mark
    for (let i = this.marks.length - 1; i >= 0; i--) {
        const m = this.marks[i];
        const mI = m.index;
        if (mI > this.cursor) {
            mark = mI;
        } else {
            break;
        }
    }

    //keep apply action until we hit the mark
    while (this.cursor < mark) {
        const action = this.history.get(this.cursor);
        action.apply(this.context);
        this.cursor++;
    }
};

/**
 * Execute a given action and add it to the timeline
 * @param {Action} action
 * @returns {ActionProcessor} this instance, useful for call chaining
 */
ActionProcessor.prototype.do = function (action) {
    action.apply(this.context);

    //doing action invalidates "future" branch of history, we need to clear all actions beyond cursor
    if (this.cursor < this.history.length) {
        this.history.crop(0, this.cursor);
    }

    this.history.add(action);
    this.cursor++;

    return this;
};

export default ActionProcessor;