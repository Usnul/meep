/**
 * Created by Alex on 01/09/2014.
 */


import Graph from "../graph/Graph";
import Transition from "./Transition";
import { assert } from "../assert.js";
import Future from "../process/Future.js";
import { dispatchViaProxy } from "../events/signal/Signal.js";

/**
 *
 * @enum {number}
 */
export const StateMachineEventType = {
    StateEntered: 0,
    StateExited: 1
};

/**
 * @template {T}
 * @constructor
 */
function StateMachine() {
    this.graph = new Graph();
    this.state = null;
    this.isLocked = false;

    /**
     *
     * @type {Map<any, Array>}
     */
    this.stateProcessorMap = new Map();

    this.stateEntryHandlers = new Map();
    this.stateExitHandlers = new Map();

    /**
     * Used for debug mainly
     * @type {Array<T>}
     * @private
     */
    this.__history = [];
}

/**
 *
 * @param {T} source
 * @param {T} target
 * @param {Transition~action} action
 * @param {Transition~condition} [condition]
 * @returns {Transition}
 */
StateMachine.prototype.createTransition = function (source, target, action, condition) {
    const transition = new Transition(source, target, action, condition);
    this.addTransition(transition);
    return transition;
};

/**
 *
 * @param {T} state
 * @param {StateMachineEventType} type
 * @param {function} handler
 */
StateMachine.prototype.addEventHandler = function (state, type, handler) {
    let eventMap;

    if (type === StateMachineEventType.StateEntered) {
        eventMap = this.stateEntryHandlers;
    } else if (type === StateMachineEventType.StateExited) {
        eventMap = this.stateExitHandlers;
    } else {
        throw new Error(`Unknown event type '${type}'`);
    }

    const handlers = eventMap.get(state);
    if (handlers === undefined) {
        eventMap.set(state, [handler]);
    } else {
        handlers.push(handler);
    }
};

/**
 *
 * @param {T} state
 * @param {StateMachineEventType} type
 * @param {function} handler
 */
StateMachine.prototype.removeEventHandler = function (state, type, handler) {
    let eventMap;

    if (type === StateMachineEventType.StateEntered) {
        eventMap = this.stateEntryHandlers;
    } else if (type === StateMachineEventType.StateExited) {
        eventMap = this.stateExitHandlers;
    } else {
        throw new Error(`Unknown event type '${type}'`);
    }


    const handlers = eventMap.get(state);
    if (handlers === undefined) {
        //no handlers, clearly handler was not registered
        console.warn('No listeners registered');
    } else {
        const i = handlers.indexOf(handler);

        if (i === -1) {
            console.warn('Listener not found');
            return;
        }

        handlers.splice(i, 1);
    }
};

/**
 *
 * @param {Transition} t
 */
StateMachine.prototype.addTransition = function (t) {
    this.graph.addEdge(t);
};

/**
 *
 * @param {T} s
 */
StateMachine.prototype.addState = function (s) {
    this.graph.addNode(s);
};

/**
 *
 * @param {T} state
 * @param {function():Promise<T>} processor
 */
StateMachine.prototype.addStateProcessor = function (state, processor) {
    assert.notEqual(state, undefined, 'state was undefined');
    assert.equal(typeof processor, 'function', `processor must be a function, instead was '${typeof processor}'`)

    if (!this.graph.containsNode(state)) {
        throw new Error(`State ${state} is not found in the graph`);
    }

    const processors = this.stateProcessorMap.get(state);

    if (processors === undefined) {
        this.stateProcessorMap.set(state, [processor]);
    } else {
        processors.push(state);
    }
};

/**
 *
 * @param {Array.<*>} states
 */
StateMachine.prototype.addAllStates = function (states) {
    let i = 0;
    const l = states.length;
    for (; i < l; i++) {
        this.addState(states[i]);
    }
};


/**
 *
 * @param {T} s
 */
StateMachine.prototype.setState = function (s) {
    // console.warn('setState', s);

    const oldState = this.state;

    this.state = s;

    const exitHandlers = this.stateExitHandlers.get(oldState);

    if (exitHandlers !== undefined) {
        dispatchViaProxy(exitHandlers, [], [oldState, s]);
    }

    const entryHandlers = this.stateEntryHandlers.get(s);

    if (entryHandlers !== undefined) {
        dispatchViaProxy(entryHandlers, [], [s, oldState]);
    }

    this.__history.push(s);
};

/**
 *
 * @returns {T}
 */
StateMachine.prototype.getState = function () {
    return this.state;
};

/**
 * Causes the state machine to enter a given state
 * @param {T} s
 */
StateMachine.prototype.enterState = function (s) {
    if (this.isLocked) {
        throw new Error(`State Machine is locked, unable to set state from '${this.state}' to '${s}'`);
    }

    this.setState(s);

    //try all state processors in turn until all have been tried and failed or one has succeeded
    const processors = this.stateProcessorMap.get(s);

    const self = this;


    function executeStateProcessors(sm, processors) {

        let i = 0;
        const numProcessors = processors.length;

        function lockSM() {
            sm.isLocked = true;
        }

        function unlockSM() {
            sm.isLocked = false;
        }

        function executeNext() {

            const processor = processors[i];

            i++;

            let pendingProcess;

            try {
                pendingProcess = processor();
            } catch (e) {
                console.warn('Exception in state processor function, treating as failure and continuing.', e);
                handleTaskFailure();
                return;
            }

            assert.ok((pendingProcess instanceof Promise || pendingProcess instanceof Future), `processor must return a promise or a future, instead returned something else (${pendingProcess})`);

            self.__pendingProcess = pendingProcess;

            pendingProcess.then(handleTaskCompletion, handleTaskFailure);
        }

        function handleTaskCompletion(newState) {
            if (!self.graph.containsNode(newState)) {
                //produced state is not contained in the graph, treat as failure
                console.error(`Processor produced state that is not present in the graph, treating as failure.`);

                handleTaskFailure();
            } else {
                let foundTraversableEdge = false;

                self.graph.findTraversableEdges(s, newState, function (edge) {
                    foundTraversableEdge = true;
                });

                if (!foundTraversableEdge) {
                    console.error(`Processor requests an illegal move from state '${s}' to '${newState}', no valid transition exists. Treating as failure`);
                    handleTaskFailure();
                } else {
                    //unlock
                    unlockSM();
                    //transition
                    self.enterState(newState);
                }
            }
        }

        function handleTaskFailure() {
            if (i === numProcessors) {
                //we're done
                unlockSM();
            } else {
                executeNext();
            }
        }

        lockSM();

        executeNext();
    }

    if (processors === undefined || processors.length === 0) {
        //no state processors
    } else {
        executeStateProcessors(this, processors);
    }
};

StateMachine.prototype.canTransitionTo = function (nextState) {
    const source = this.state;
    let result = false;
    this.traverseValidTransitions(function (node, edge) {
        if (node === nextState && edge.condition(source, node)) {
            result = true;
            //stop traversal
            return false;
        }
    });
    return result;
};

/**
 *
 * @param {Graph~visitor} visitor
 */
StateMachine.prototype.traverseValidTransitions = function (visitor) {
    const source = this.state;
    this.graph.traverseSuccessors(source, function (node, edge) {
        if (edge.condition(source, node)) {
            return visitor(node, edge);
        }
    });
};


/**
 *
 * @param {Transition} transition
 * @param {T} targetState
 * @returns {Promise}
 */
StateMachine.prototype.transitionOn = function (transition, targetState) {
    assert.equal(transition.second, targetState, `transition destination is not equal to targetState`);

    const sm = this;
    return new Promise(function (resolve, reject) {
        if (transition === null) {
            //no transition was found
            reject("no transition found");
        }
        //check lock on state machine
        if (sm.isLocked) {
            reject("state machine is locked, can not execute transition");
        }

        const stateFrom = sm.state;

        //lock state machine
        sm.isLocked = true;

        const promise = transition.action(stateFrom, targetState);

        function handleTransitionSuccess() {
            sm.isLocked = false;
            sm.enterState(targetState);
            resolve();
        }

        function handleTransitionFailed(e) {
            sm.isLocked = false;
            reject(e);
        }

        promise.then(handleTransitionSuccess, handleTransitionFailed);
    });
};

/**
 *
 * @param {T} nextState Adjacent state
 * @returns {Promise}
 */
StateMachine.prototype.transitionTo = function (nextState) {
    const sm = this;
    const state = sm.state;

    return new Promise(function (resolve, reject) {
        if (state === nextState) {
            //already there
            resolve();
        }
        let transition = null;

        sm.traverseValidTransitions(function (target, t) {
            if (t.second !== nextState) {
                //wrong target
                return;
            }

            transition = t;
            //stop traversal
            return false;
        });

        sm.transitionOn(transition, nextState).then(resolve, reject);
    });
};

/**
 *
 * @param {*} targetState
 * @returns {Promise}
 */
StateMachine.prototype.navigateTo = function (targetState) {
    //find path
    const graph = this.graph;

    const start = this.state;

    const path = graph.findPath(start, targetState);

    if (path === null) {
        return Promise.reject(`no path found from ${start} to '${targetState}'`);
    }

    let result = Promise.resolve();

    let i = 1;
    const l = path.length;
    for (; i < l; i++) {
        const next = path[i];
        result = result.then(this.transitionTo(next));
    }

    return result;
};

export { StateMachine };
