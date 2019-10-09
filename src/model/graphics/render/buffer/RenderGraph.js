import { RenderProgramInstance } from "./node/RenderProgramInstance";
import { ProgramValueSlotConnectionEndpoint } from "./conection/ProgramValueSlotConnectionEndpoint";
import { ProgramValueSlotConnection } from "./conection/ProgramValueSlotConnection";
import { assert } from "../../../core/assert";
import { ProgramValueType } from "./slot/ProgramValueType";

export class RenderGraph {
    constructor() {
        /**
         *
         * @type {RenderProgramInstance[]}
         */
        this.nodes = [];
        /**
         *
         * @type {ProgramValueSlotConnection[]}
         */
        this.connections = [];

        /**
         *
         * @type {ProgramValueSlotConnectionEndpoint|null}
         */
        this.finalOutput = null;
    }

    /**
     *
     * @param {RenderProgramInstance} node
     * @param {ProgramValueSlotDefinition} slot
     */
    setFinalOutput(node, slot) {
        assert.ok(this.containsNode(node), 'Node is not contained in the graph');

        assert.equal(slot.type, ProgramValueType.FrameBuffer, `expected slot type to be FrameBuffer, instead was '${slot.type}'`);

        this.finalOutput = new ProgramValueSlotConnectionEndpoint({ node, slot });
    }

    /**
     *
     * @param {RenderProgramInstance} node
     * @returns {boolean}
     */
    containsNode(node) {
        return this.nodes.some(n => n === node);
    }

    /**
     *
     * @param {RenderProgramDefinition} definition
     */
    createNode(definition) {
        const instance = new RenderProgramInstance({ definition });

        this.addNode(instance);

        return instance;
    }

    /**
     *
     * @param {RenderProgramInstance} node
     * @returns {boolean}
     */
    addNode(node) {
        if (this.containsNode(node)) {
            //graph already contains the node
            return false;
        }

        this.nodes.push(node);

        return true;
    }

    /**
     *
     * @param {RenderProgramInstance} sourceInstance
     * @param {ProgramValueSlotDefinition} sourceSlot
     * @param {RenderProgramInstance} targetInstance
     * @param {ProgramValueSlotDefinition} targetSlot
     * @returns {ProgramValueSlotConnection}
     */
    createConnection(sourceInstance, sourceSlot, targetInstance, targetSlot) {
        const sourceEndpoint = new ProgramValueSlotConnectionEndpoint({ node: sourceInstance, slot: sourceSlot });
        const targetEndpoint = new ProgramValueSlotConnectionEndpoint({ node: targetInstance, slot: targetSlot });

        const connection = new ProgramValueSlotConnection({ source: sourceEndpoint, target: targetEndpoint });

        this.addConnection(connection);

        return connection;
    }

    /**
     *
     * @param {ProgramValueSlotConnection} connection
     */
    addConnection(connection) {
        assert.ok(this.containsNode(connection.source.node), 'Connection source node is not a part of the graph');
        assert.ok(this.containsNode(connection.target.node), 'Connection target node is not a part of the graph');

        //add connection to source and target instance slots
        connection.source.node.getSlotValue(connection.source.slot).addConnection(connection);
        connection.target.node.getSlotValue(connection.target.slot).addConnection(connection);

        this.connections.push(connection);
    }

    /**
     * Returns node that contains screen output
     * @returns {RenderProgramInstance|null}
     */
    getTerminalNode() {
        return this.finalOutput.node;
    }

    /**
     *
     * @param {RenderProgramInstance} node
     * @returns {ProgramValueSlotConnection[]}
     */
    getConnectionsByNode(node) {
        return this.connections.filter(function (c) {
            return c.source.node === node || c.target.node === node;
        });
    }

    /**
     * Computes set of nodes that produce inputs for parameter node
     * @param {RenderProgramInstance} node
     * @returns {RenderProgramInstance[]}
     */
    getPredecessorNodes(node) {
        return this.connections.filter(function (c) {
            return c.target.node === node;
        }).map(function (c) {
            return c.source.node;
        });
    }

    /**
     *
     * @param {RenderProgramInstance} node
     * @return {number}
     */
    computeNodeDepth(node) {
        const predecessors = this.getPredecessorNodes(node);

        if (predecessors.length === 0) {
            return 0;
        } else {
            return Math.max.apply(null, predecessors.map(p => this.computeNodeDepth(p)));
        }
    }

    /**
     *
     * @param {function} visitor
     */
    traverseNodes(visitor) {
        const nodes = this.nodes;

        const numNodes = nodes.length;

        for (let i = 0; i < numNodes; i++) {
            const programInstance = nodes[i];

            const continueFlag = visitor(programInstance);

            if (continueFlag === false) {
                return;
            }
        }
    }
}