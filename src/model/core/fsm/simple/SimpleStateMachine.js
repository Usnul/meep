import { assert } from "../../assert.js";
import { dispatchViaProxy, findSignalHandlerIndexByHandle } from "../../events/signal/Signal.js";
import { noop } from "../../function/Functions.js";
import { SimpleStateMachineDescription } from "./SimpleStateMachineDescription.js";
import { SignalHandler } from "../../events/signal/SignalHandler.js";

export class SimpleStateMachine {
    /**
     *
     * @param {SimpleStateMachineDescription} description
     */
    constructor(description) {
        assert.ok(description instanceof SimpleStateMachineDescription, 'description is not an instance of SimpleStateMachineDescription');

        /**
         *
         * @type {SimpleStateMachineDescription}
         */
        this.description = description;

        /**
         *
         * @type {number}
         * @private
         */
        this.__state = -1;

        /**
         *
         * @type {Array}
         * @private
         */
        this.__eventHandlersStateEntry = [];

        /**
         *
         * @type {Array}
         * @private
         */
        this.__eventHandlersStateExit = [];
    }

    /**
     *
     * @param {number} state
     * @param {function} handler
     * @param {*} [thisArg]
     */
    addEventHandlerStateEntry(state, handler, thisArg) {
        assert.ok(this.description.stateExists(state), `state ${state} doesn't exist`);

        const handlers = this.__eventHandlersStateEntry[state];

        const signalHandler = new SignalHandler(handler, thisArg);

        if (handlers === undefined) {
            this.__eventHandlersStateEntry[state] = [signalHandler];
        } else {
            handlers.push(signalHandler);
        }
    }

    /**
     *
     * @param {number} state
     * @param {function} handler
     * @param {*} [thisArg]
     */
    removeEventHandlerStateEntry(state, handler, thisArg) {
        assert.ok(this.description.stateExists(state), `state ${state} doesn't exist`);

        const handlers = this.__eventHandlersStateEntry[state];

        if (handlers !== undefined) {
            const i = findSignalHandlerIndexByHandle(handlers, handler, thisArg);

            if (i !== -1) {
                handlers.splice(i, 1);
            }
        }
    }

    /**
     *
     * @param {number} state
     * @param {function} handler
     * @param {*} [thisArg]
     */
    addEventHandlerStateExit(state, handler, thisArg) {
        assert.ok(this.description.stateExists(state), `state ${state} doesn't exist`);

        const handlers = this.__eventHandlersStateExit[state];

        const signalHandler = new SignalHandler(handler, thisArg);

        if (handlers === undefined) {
            this.__eventHandlersStateExit[state] = [signalHandler];
        } else {
            handlers.push(signalHandler);
        }
    }

    /**
     *
     * @param {number} state
     * @param {function} handler
     */
    removeEventHandlerStateExit(state, handler) {
        assert.ok(this.description.stateExists(state), `state ${state} doesn't exist`);

        const handlers = this.__eventHandlersStateExit[state];

        if (handlers !== undefined) {

            const i = findSignalHandlerIndexByHandle(handlers, handler);

            if (i !== -1) {
                handlers.splice(i, 1);
            }
        }
    }

    /**
     *
     * @param {number} s
     */
    setState(s) {
        assert.ok(this.description.stateExists(s), `state ${s} doesn't exist`);

        const oldState = this.__state;


        const exitHandlers = this.__eventHandlersStateExit[oldState];

        if (exitHandlers !== undefined) {
            dispatchViaProxy(exitHandlers, [], [oldState, s]);
        }

        this.__state = s;

        //process event handlers
        const handlers = this.__eventHandlersStateEntry[s];

        if (handlers !== undefined) {
            dispatchViaProxy(handlers, [], [s, oldState]);
        }

    }

    /**
     *
     * @returns {number}
     */
    getState() {
        return this.__state;
    }

    /**
     * @template X
     * @param {X} [input] value will be fed into selector
     * @param {function} [preStateChangeHook]
     * @return {boolean}
     */
    advance(input, preStateChangeHook = noop) {
        const description = this.description;

        //get active selector
        const selector = description.__actions[this.__state];

        let targetState;

        if (selector === undefined) {

            //no selector
            const targetNodes = description.getOutgoingStates(this.__state);

            if (targetNodes.length !== 1) {
                //no selector, and number of targets is ambiguous
                return false;
            }

            //
            targetState = targetNodes[0];

        } else {
            targetState = selector(input);
            assert.ok(description.stateExists(targetState), `targetState ${targetState} does not exist`);
        }

        assert.ok(description.edgeExists(this.__state, targetState), `no edge exists from ${this.__state} to ${targetState}`);

        preStateChangeHook(targetState, input);

        this.setState(targetState);

        return true;
    }
}
