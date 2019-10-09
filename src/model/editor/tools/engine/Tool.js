/**
 * Created by Alex on 14/01/2017.
 */


import ObservedValue from '../../../core/model/ObservedValue.js';
import { buildToolStateMachine } from "./ToolStateMachine.js";
import { ToolState } from "./ToolState.js";

class Tool {
    /**
     *
     * @constructor
     * @property {ObservedValue.<String>} mode
     */
    constructor() {
        this.name = null;
        this.mode = new ObservedValue();
        this.settings = {};
        this.modifiers = {
            shift: false
        };
        /**
         *
         * @type {Engine|null}
         */
        this.engine = null;
        /**
         *
         * @type {Editor|null}
         */
        this.editor = null;

        /**
         *
         * @type {StateMachine}
         */
        this.stateMachine = buildToolStateMachine(this);
    }

    /**
     *
     * @returns {ToolState|number}
     */
    getState() {
        return this.stateMachine.getState();
    }

    isRunning() {
        return this.getState() === ToolState.Running;
    }

    /**
     *
     * @param {ToolState} s
     * @returns {Promise}
     */
    moveToState(s) {
        const sm = this.stateMachine;

        return sm.navigateTo(s);
    }

    /**
     * Activate the tool and prepare it for usage
     */
    initialize() {
    }

    /**
     * Deactivate the tool and remove and influence it may have
     */
    shutdown() {

    }

    /**
     * Update loop
     */
    update() {

    }

    /**
     * Start usage of the tool.
     * @example Start painting with a brush
     */
    start() {
    }

    /**
     * Finish usage of the tool
     * @example Finish brush stroke
     */
    stop() {

    }

    handleKeyboardEvent(e) {

    }
}


export default Tool;
