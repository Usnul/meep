import { assert } from "../../../../core/assert";
import { ProgramValueDirectionKind } from "../slot/ProgramValueDirectionKind.js";
import { ProgramValueType } from "../slot/ProgramValueType.js";
import { FrameBufferPool } from "./FrameBufferPool.js";

/**
 *
 * @param {ProgramSlotValue} slot
 * @param {function(ProgramValueSlotConnectionEndpoint)} visitor
 */
function traverseInputBufferUsers(slot, visitor) {
    let i, il, j, jl;

    const connections0 = slot.connections;

    for (i = 0, il = connections0.length; i < il; i++) {
        const c0 = connections0[i];

        const sourceSlot = c0.source.node.getSlotValue(c0.source.slot);

        const connections1 = sourceSlot.connections;

        for (j = 0, jl = connections1.length; j < jl; j++) {

            const c1 = connections1[j];

            if (c1 === c0) {
                //ignore own connection
                return;
            }

            const continueFlag = visitor(c1.target);

            if (continueFlag === false) {
                //stop traversal
                return;
            }
        }
    }
}

/**
 *
 * @param {RenderGraph} graph
 * @returns {RenderProgramInstance[]}
 */
function computeExecutionOrder(graph) {

    const terminalNode = graph.getTerminalNode();

    assert.notEqual(terminalNode, null, 'terminal node must not be null');

    const closedNodeList = [];
    const openSet = [terminalNode];

    while (openSet.length > 0) {
        const head = openSet.shift();

        closedNodeList.push(head);

        const predecessorNodes = graph.getPredecessorNodes(head);

        predecessorNodes.forEach(n => {
            if (openSet.indexOf(n) === -1) {
                openSet.push(n);
            }

            if (closedNodeList.indexOf(n) !== -1) {
                //a loop exists
                throw new Error(`A loop was detected, graph is not an DAG`);
            }
        });
    }

    //reverse the order
    closedNodeList.reverse();

    return closedNodeList;
}

export class RenderGraphExecutor {
    constructor() {
        /**
         *
         * @type {RenderGraph|null}
         */
        this.graph = null;

        /**
         *
         * @type {FrameBufferPool}
         */
        this.frameBufferPool = new FrameBufferPool();
    }

    /**
     *
     * @param {RenderGraph} graph
     */
    initialize(graph) {
        /**
         *
         * @type {RenderGraph}
         */
        this.graph = graph;

        //clear frame buffers
        this.frameBufferPool.reset();
    }

    build() {
        //find screen output slot
        const graph = this.graph;

        const executionOrder = computeExecutionOrder(graph);

        // At this point we have the execution order for nodes


    }

    execute(renderer, scene, camera) {
        const frameBufferPool = this.frameBufferPool;
        const graph = this.graph;

        const executed = [];
        //put all nodes into open set
        const open = graph.nodes.slice();
        //
        const scheduled = [];

        function attemptScheduling() {
            let i, j, numOpenNodes;

            numOpenNodes = open.length;

            open_loop:for (i = 0; i < numOpenNodes; i++) {
                const node = open[i];
                const predecessorNodes = graph.getPredecessorNodes(node);

                const numPredecessors = predecessorNodes.length;
                for (j = 0; j < numPredecessors; j++) {
                    const predecessorNode = predecessorNodes[j];

                    if (executed.indexOf(predecessorNode) === -1) {
                        //predecessor has not been executed yet
                        continue open_loop;
                    }
                }

                //all predecessors have been satisfied, schedule node
                open.splice(i, 1);

                i--;
                numOpenNodes--;

                //add to scheduled set
                scheduled.push(node);
            }
        }


        /**
         *
         * @param {RenderProgramInstance} n
         */
        function executeNode(n) {
            //assign output buffers to slots

            /**
             *
             * @type {RenderProgramDefinition}
             */
            const programDefinition = n.definition;

            /**
             *
             * @type {ProgramSlotValue[]}
             */
            const outputBufferValues = [];
            /**
             *
             * @type {ProgramSlotValue[]}
             */
            const inputBufferValues = [];

            n.slotValues.forEach(s => {
                if (s.definition.type !== ProgramValueType.FrameBuffer) {
                    return;
                }
                if (s.definition.direction === ProgramValueDirectionKind.Out) {
                    outputBufferValues.push(s);
                } else {
                    inputBufferValues.push(s);
                }
            });

            outputBufferValues.forEach(v => {
                /**
                 *
                 * @type {ProgramValueSlotDefinition}
                 */
                const valueSlotDefinition = v.definition;

                const renderTarget = frameBufferPool.get(valueSlotDefinition.parameters);

                v.setValue(renderTarget);
            });

            programDefinition.execute(n, renderer, camera, scene);

            //write slot values along the connections
            n.slotValues
                .filter(s => s.definition.direction === ProgramValueDirectionKind.Out)
                .forEach(s => {
                    s.connections.forEach(c => {
                        const targetSlot = c.target.node.getSlotValue(c.target.slot);

                        targetSlot.setValue(s.getValue());
                    });
                });


            //release buffers that may have become unnecessary
            inputBufferValues.forEach(i => {
                let stillInUse = false;
                traverseInputBufferUsers(i, endpoint => {
                    if (executed.indexOf(endpoint.node) === -1) {
                        //has not yet been executed
                        stillInUse = true;

                        //signal to stop traversal
                        return false;
                    }
                });

                if (!stillInUse) {
                    //release buffer so it can be reused
                    frameBufferPool.release(i.getValue());
                }
            });
        }

        while (open.length > 0) {
            attemptScheduling();

            if (scheduled.length <= 0) {
                throw new Error(`no nodes scheduled from open set (length=${open.length})`);
            }

            while (scheduled.length > 0) {
                const node = scheduled.pop();

                executeNode(node);

                //move to executed set
                executed.push(node);
            }
        }
    }
}