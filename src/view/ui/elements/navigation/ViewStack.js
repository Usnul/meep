/**
 * Created by Alex on 04/11/2016.
 */

import View from "../../../View";
import domify from "../../../DOM.js";

/**
 *
 * @param {View} view
 * @param {string} name
 * @constructor
 */
function StackFrame(view, name) {
    /**
     *
     * @type {View}
     */
    this.view = view;
    /**
     *
     * @type {string}
     */
    this.name = name;
}

export class ViewStack extends View {
    /**
     *
     * @constructor
     * @class
     * @extends {View}
     */
    constructor() {
        super();

        const $el = domify('div').css({
            position: "absolute",
            left: 0,
            top: 0,
            pointerEvents: "none"
        });

        this.el = $el.el;

        this.__stack = [];
        /**
         *
         * @type {StackFrame | null}
         * @private
         */
        this.__activeFrame = null;

        //automatically resize the active frame when own size changes
        this.bindSignal(this.size.onChanged, this.updateActiveFrameSize.bind(this));
    }

    /**
     * @private
     */
    updateActiveFrameSize() {
        const activeFrame = this.__activeFrame;
        if (activeFrame !== null) {
            activeFrame.view.size.copy(this.size);
        }
    }

    link() {
        super.link();

        this.updateActiveFrameSize();
    }

    /**
     * @private
     * @param {int} index
     */
    setActiveFrame(index) {
        const stack = this.__stack;

        if (index >= stack.length) {
            throw  new Error("Index is too high, stack overflow");
        }
        if (this.__activeFrame !== null) {
            //clear old active frame
            this.removeChild(this.__activeFrame.view);
        }
        if (index >= 0) {
            const stackFrame = stack[index];
            this.__activeFrame = stackFrame;
            const child = stackFrame.view;
            this.addChild(child);
            //resize child
            child.size.copy(this.size);
            //ensure position is aligned o origin
            child.position.set(0, 0);
        } else {
            this.__activeFrame = null;
        }
    }

    /**
     *
     * @param {View} view
     * @param {string} name
     */
    push(view, name) {
        const stack = this.__stack;
        const stackFrame = new StackFrame(view, name);
        stack.push(stackFrame);
        const index = stack.length - 1;
        this.setActiveFrame(index);
    }

    /**
     * Works in the same way as "pop", keeps reducing stack size until it's size is equal to supplied size.
     * @param {number} size desired stack size
     * @returns {StackFrame[]} dropped frames
     */
    unwind(size) {
        const stack = this.__stack;
        const originalStackSize = stack.length;
        const droppedFrames = stack.splice(size, originalStackSize - size);
        this.setActiveFrame(size - 1);
        return droppedFrames;
    }

    /**
     * Pops view from the stack
     * @returns {StackFrame|undefined}
     */
    pop() {
        const droppedFrames = this.unwind(this.__stack.length - 1);
        return droppedFrames[0];
    }
}
