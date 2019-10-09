import View from "../../View.js";
import { NodeGraphCamera, NodeGraphView } from "./NodeGraphView.js";
import { NodeDescriptionVisualRegistry } from "../../../model/core/model/node-graph/visual/NodeDescriptionVisualRegistry.js";
import AABB2 from "../../../model/core/geom/AABB2.js";
import { min2 } from "../../../model/core/math/MathUtils.js";
import ButtonView from "../../ui/elements/button/ButtonView.js";
import EmptyView from "../../ui/elements/EmptyView.js";

export class NodeGraphEditorView extends View {
    /**
     *
     * @param {NodeGraph} graph
     * @param {NodeRegistry} nodeRegistry
     * @param {NodeGraphVisualData} visual
     * @param {NodeGraphCamera} camera
     */
    constructor({ graph, nodeRegistry, visual, camera }) {
        super();

        /**
         *
         * @type {NodeGraphCamera}
         */
        this.camera = camera;
        /**
         *
         * @type {NodeGraphVisualData}
         */
        this.visual = visual;

        /**
         *
         * @type {NodeGraph}
         */
        this.graph = graph;

        this.el = document.createElement('div');
        this.addClass('ui-node-graph-editor-view');


        const visualRegistry = new NodeDescriptionVisualRegistry();
        //generate visual descriptions for registry nodes
        nodeRegistry.nodes.forEach(node => {
            visualRegistry.generate(node);
        });


        const graphView = new NodeGraphView({
            graph: graph,
            visual: visual,
            camera,
            nodeVisualRegistry: visualRegistry
        });

        this.size.onChanged.add((x, y) => graphView.size.set(x, y));
        this.addChild(graphView);

        const self = this;


        //
        const vUserInterface = new EmptyView({
            classList: ['user-interface']
        });

        this.addChild(vUserInterface);

        vUserInterface.addChild(new ButtonView({
            action() {
                self.cameraContainAll()
            },
            classList: ["contain-all"]
        }));
    }

    layout() {
        this.visual.layout(this.graph);
    }

    cameraContainAll() {
        /**
         *
         * @type {NodeGraphCamera}
         */
        const camera = this.camera;
        /**
         *
         * @type {NodeGraphVisualData}
         */
        const visual = this.visual;

        //compute bounds of the graph
        const bounds = new AABB2();

        bounds.setNegativelyInfiniteBounds();

        visual.computeBoundingBox(bounds);

        if (bounds.x0 > bounds.x1) {
            bounds.x0 = 0;
            bounds.x1 = 0;
        }
        if (bounds.y0 > bounds.y1) {
            bounds.y0 = 0;
            bounds.y1 = 0;
        }

        //expand bounds a bit
        const PADDING = 32;
        bounds.grow(PADDING);


        //compute largest side scale
        const boundsWidth = bounds.getWidth();
        const boundsHeight = bounds.getHeight();

        const xScale = this.size.x / boundsWidth;
        const yScale = this.size.y / boundsHeight;

        const scale = min2(
            xScale,
            yScale
        );

        const xOffset = (boundsWidth - (this.size.x / scale)) / 2;
        const yOffset = (boundsHeight - (this.size.y / scale)) / 2;

        camera.position.set(bounds.x0 + xOffset, bounds.y0 + yOffset);


        camera.scale.set(scale);

    }
}
