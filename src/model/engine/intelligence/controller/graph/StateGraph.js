export class StateGraph {
    /**
     *
     * @param {SimpleStateMachine} graph
     */
    constructor(graph) {
        /**
         *
         * @type {SimpleStateMachine}
         */
        this.graph = graph;

        this.inputs = [];
    }

    declareInputs(state, events) {
        this.inputs[state] = events;
    }
}