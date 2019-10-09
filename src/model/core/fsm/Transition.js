/**
 * Created by Alex on 24/03/2016.
 */


import { Edge, EdgeDirectionType } from "../graph/Edge";

const TransitionExecutionMode = {
    Synchronous: 0,
    Asynchronous: 1
};

/**
 * @callback Transition~action
 * @param {*} source Node of transition origin
 * @param {*} target Node of destination
 * @returns {Promise} Promise is evaluated to perform transition, and transition is not finished until promise is resolved
 */

/**
 * @callback Transition~condition
 * @param {*} source
 * @param {*} target
 * @returns {boolean} judgement on validity of transition from source to target
 */

/**
 *
 * @param {*} source
 * @param {*} target
 * @returns {boolean}
 */
function fTrue(source, target) {
    return true;
}

/**
 *
 * @param {*} source
 * @param {*} target
 * @param {Transition~action} action
 * @param {Transition~condition} condition
 * @constructor
 * @extends Edge
 */
function Transition(source, target, action, condition) {
    Edge.call(this, source, target);
    //make it a directed edge
    this.direction = EdgeDirectionType.Forward;

    this.action = action;
    this.condition = (typeof condition === "function") ? condition : fTrue;
}

/**
 * @inheritDoc Transition~action
 */
Transition.EmptyAction = function (source, target) {
    return Promise.resolve();
};


Transition.prototype = Object.create(Edge.prototype);

export default Transition;
