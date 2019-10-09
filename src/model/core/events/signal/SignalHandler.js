import { assert } from "../../assert.js";

/**
 *
 * @enum {number}
 */
export const SignalHandlerFlags = {
    /**
     * Handler should be de-registered after it is executed
     */
    RemoveAfterExecution: 1
};

export class SignalHandler {
    /**
     *
     * @param {function} handle
     * @param {*} [context]
     */
    constructor(handle, context) {
        assert.notEqual(handle, undefined, 'handle must be defined');
        assert.typeOf(handle, 'function', 'handle');


        this.handle = handle;
        this.context = context;

        /**
         * @private
         * @type {number|SignalHandlerFlags}
         */
        this.flags = 0;
    }

    /**
     *
     * @param {number|SignalHandlerFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|SignalHandlerFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|SignalHandlerFlags} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|SignalHandlerFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

}

/**
 * @readonly
 * @type {boolean}
 */
SignalHandler.prototype.isSignalHandler = true;
