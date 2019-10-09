import { SimpleStateMachineDescription } from "../../../core/fsm/simple/SimpleStateMachineDescription.js";
import { ToolState } from "./ToolState.js";
import { StateMachine } from "../../../core/fsm/StateMachine.js";

const smd = new SimpleStateMachineDescription();

smd.createState(ToolState.Initial);
smd.createState(ToolState.Ready);
smd.createState(ToolState.Running);

smd.createEdge(ToolState.Initial, ToolState.Ready);
smd.createEdge(ToolState.Ready, ToolState.Initial);
smd.createEdge(ToolState.Ready, ToolState.Running);
smd.createEdge(ToolState.Running, ToolState.Ready);


/**
 * @param {Tool} tool
 * @returns {StateMachine}
 */
export function buildToolStateMachine(tool) {
    const sm = new StateMachine(smd);

    sm.addState(ToolState.Initial);
    sm.addState(ToolState.Ready);
    sm.addState(ToolState.Running);


    sm.createTransition(ToolState.Initial, ToolState.Ready, () => {
        tool.initialize();
        return Promise.resolve();
    });

    sm.createTransition(ToolState.Ready, ToolState.Initial, () => {
        tool.shutdown();
        return Promise.resolve();
    });

    sm.createTransition(ToolState.Ready, ToolState.Running, () => {
        tool.start();
        return Promise.resolve();
    });

    sm.createTransition(ToolState.Running, ToolState.Ready, () => {
        tool.stop();
        return Promise.resolve();
    });

    sm.setState(ToolState.Initial);


    return sm;
}
