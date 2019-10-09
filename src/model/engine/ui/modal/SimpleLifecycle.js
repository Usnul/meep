import { SimpleStateMachine } from "../../../core/fsm/simple/SimpleStateMachine.js";
import { SimpleStateMachineDescription } from "../../../core/fsm/simple/SimpleStateMachineDescription.js";
import { IllegalStateException } from "../../../core/fsm/exceptions/IllegalStateException.js";
import { assert } from "../../../core/assert.js";

/**
 * @readonly
 * @enum {number}
 */
export const SimpleLifecycleStateType = {
    Initial: 0,
    Ready: 1,
    Active: 2,
    Destroyed: 3
};

const smDescription = new SimpleStateMachineDescription();

smDescription.createState(SimpleLifecycleStateType.Initial);
smDescription.createState(SimpleLifecycleStateType.Ready);
smDescription.createState(SimpleLifecycleStateType.Active);
smDescription.createState(SimpleLifecycleStateType.Destroyed);

smDescription.createEdge(SimpleLifecycleStateType.Initial, SimpleLifecycleStateType.Ready);
smDescription.createEdge(SimpleLifecycleStateType.Ready, SimpleLifecycleStateType.Active);
smDescription.createEdge(SimpleLifecycleStateType.Active, SimpleLifecycleStateType.Ready);
smDescription.createEdge(SimpleLifecycleStateType.Ready, SimpleLifecycleStateType.Destroyed);


smDescription.setAction(SimpleLifecycleStateType.Initial, () => SimpleLifecycleStateType.Ready);
smDescription.setAction(SimpleLifecycleStateType.Ready, a => a);
smDescription.setAction(SimpleLifecycleStateType.Active, () => SimpleLifecycleStateType.Ready);


export class SimpleLifecycle {
    constructor({ priority = 0 }) {
        this.sm = new SimpleStateMachine(smDescription);
        this.sm.setState(SimpleLifecycleStateType.Initial);

        this.priority = priority;
    }

    makeReady() {
        const s = this.sm.getState();
        if (s === SimpleLifecycleStateType.Ready) {
            return;
        }

        if (s === SimpleLifecycleStateType.Initial || s === SimpleLifecycleStateType.Active) {
            this.sm.advance();
            return;
        }

        throw new IllegalStateException(`expected Initial(=${SimpleLifecycleStateType.Initial}) or Active(=${SimpleLifecycleStateType.Active}) state, got ${s}`);
    }

    makeActive() {
        const s = this.sm.getState();
        if (s === SimpleLifecycleStateType.Active) {
            //do nothing
            return;
        }

        if (s !== SimpleLifecycleStateType.Ready) {
            this.makeReady();
        }

        // Direct SM to advance to Active state
        this.sm.advance(SimpleLifecycleStateType.Active);

        assert.equal(this.sm.getState(), SimpleLifecycleStateType.Active, `expected to get in state ${SimpleLifecycleStateType.Active}, instead was in ${this.sm.getState()}`);
    }

    makeDestroyed() {
        const s = this.sm.getState();
        if (s === SimpleLifecycleStateType.Destroyed) {
            //do nothing
            return;
        }

        if (s !== SimpleLifecycleStateType.Ready) {
            this.makeReady();
        }

        this.sm.advance(SimpleLifecycleStateType.Destroyed);
        assert.equal(this.sm.getState(), SimpleLifecycleStateType.Destroyed, `expected to get in state ${SimpleLifecycleStateType.Destroyed}, instead was in ${this.sm.getState()}`);
    }
}