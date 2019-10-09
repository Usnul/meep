import List from "../../../core/collection/List.js";
import { RenderGraph } from "../buffer/RenderGraph.js";
import { RenderProgramDefinition } from "../buffer/node/RenderProgramDefinition.js";
import { ProgramValueSlotConnection } from "../buffer/conection/ProgramValueSlotConnection.js";
import { ProgramValueSlotConnectionEndpoint } from "../buffer/conection/ProgramValueSlotConnectionEndpoint.js";
import { ProgramValueType } from "../buffer/slot/ProgramValueType.js";
import { ProgramValueDirectionKind } from "../buffer/slot/ProgramValueDirectionKind.js";
import { RenderGraphExecutor } from "../buffer/executor/RenderGraphExecutor.js";
import { DeferredRenderProgramDefinition } from "../buffer/node/DeferredRenderProgramDefinition.js";


/**
 *
 * @param {PostProcessingEffectInputCoupling} coupling
 * @param {RenderGraph} graph
 * @returns {ProgramValueSlotConnectionEndpoint}
 */
function satisfyPostProcessCoupling(coupling, graph) {
    let bestSlot = null;
    let bestNode = null;
    let bestDepth = Number.NEGATIVE_INFINITY;

    graph.traverseNodes(n => {
        /**
         *
         * @type {RenderProgramDefinition}
         */
        const definition = n.definition;

        const matchingSlot = definition.slots.find(s => coupling.matchOutput(s));

        if (matchingSlot !== undefined) {

            const depth = graph.computeNodeDepth(n);

            if (depth > bestDepth) {
                //get slot on the node with the longest chain
                bestDepth = depth;
                bestSlot = matchingSlot;
                bestNode = n;
            }

        }
    });


    if (bestSlot === null) {
        //no matching slot found
        return null;
    }

    return new ProgramValueSlotConnectionEndpoint({
        node: bestNode,
        slot: bestSlot
    });
}

/**
 *
 * @param {PostProcessingEffect} effect
 * @param {RenderGraph} graph
 */
function buildWiringForPostProcessEffect(effect, graph) {
    const node = effect.node;
    const inputWiring = effect.inputWiring;

    const connections = inputWiring.map(c => {

        const sourceEndpoint = satisfyPostProcessCoupling(c);

        if (sourceEndpoint === null) {
            throw new Error(`Input Coupling ${c} of effect ${effect} could not be satisfied`);
        }

        const targetEndpoint = new ProgramValueSlotConnectionEndpoint({
            node: node,
            slot: c.input
        });

        const connection = new ProgramValueSlotConnection({
            source: sourceEndpoint,
            target: targetEndpoint
        });

        return connection;
    });

    return connections;
}

export class StagedRenderer {
    constructor() {
        /**
         *
         * @type {List<PostProcessingEffect>}
         */
        this.postprocess = new List();

        const self = this;

        function update() {
            self.graphNeedsUpdate = true;
        }

        this.postprocess.on.added.add(update);
        this.postprocess.on.removed.add(update);

        this.graphNeedsUpdate = true;
        this.graphExecutor = new RenderGraphExecutor();
    }

    buildGraph() {
        const graph = new RenderGraph();

        const pDeferred = new DeferredRenderProgramDefinition();


        const piDeferred = graph.createNode(pDeferred);

        if (this.postprocess.isEmpty()) {
            graph.setFinalOutput(piDeferred, DeferredRenderProgramDefinition.OutputColor);
        } else {
            this.postprocess.forEach(function (effect) {
                const connections = buildWiringForPostProcessEffect(effect, graph);

                //add effect node to the graph
                graph.addNode(effect.node);

                //add connections to the graph
                connections.forEach(connection => graph.addConnection(connection));
            });

            const lastNode = this.postprocess.last().node;
            const outputSlot = lastNode.definition.slots.find(s => s.type === ProgramValueType.FrameBuffer && s.direction === ProgramValueDirectionKind.Out);

            graph.setFinalOutput(lastNode, outputSlot);
        }

        //attach graph to the executor
        this.graphExecutor.initialize(graph);
    }

    /**
     *
     * @param {WebGLRenderer} renderer
     * @param {PerspectiveCamera|OrthographicCamera} camera
     * @param {Scene} scene
     */
    render(renderer, camera, scene) {
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
        renderer.autoClear = true;
        renderer.clearAlpha = 0;

        if (this.graphNeedsUpdate) {
            this.buildGraph();
            this.graphNeedsUpdate = false;
        }
        this.graphExecutor.execute(renderer, scene, camera);
    }
}