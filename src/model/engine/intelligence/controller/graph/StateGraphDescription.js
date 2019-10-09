import { SimpleStateMachineDescription } from "../../../../core/fsm/simple/SimpleStateMachineDescription.js";

class StateGraphDescription {
    constructor() {
        /**
         *
         * @type {SimpleStateMachineDescription}
         */
        this.stateMachineDescriptior = new SimpleStateMachineDescription();

        this.transitions = [];
    }

    createTransition(source, target, event) {
        if (this.transitions[source] === undefined) {
            this.transitions[source] = [];
        }

        this.transitions[source].push({
            target,
            event
        });
    }

    createState() {
        this.stateMachineDescriptior.createState();
    }

    build() {

    }
}