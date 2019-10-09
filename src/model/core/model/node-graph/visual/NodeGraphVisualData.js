import { NodeVisualData } from "./NodeVisualData.js";
import { Color } from "../../../color/Color.js";
import { forceLayout } from "../../../../diagram/graph/BoxLayouter.js";
import AABB2 from "../../../geom/AABB2.js";
import Graph from "../../../graph/Graph.js";

export class NodeGraphVisualData {
    constructor() {

        /**
         *
         * @type {Map<number, NodeVisualData>}
         */
        this.nodes = new Map();

        /**
         *
         * @type {Map<number, Color>}
         */
        this.dataColors = new Map();
    }

    /**
     *
     * @param {AABB2} result
     */
    computeBoundingBox(result) {

        this.nodes.forEach(node => {

            /**
             *
             * @type {Rectangle}
             */
            const dimensions = node.dimensions;

            const p = dimensions.position;
            const s = dimensions.size;

            result._expandToFit(p.x, p.y, p.x + s.x, p.y + s.y)

        });
    }

    /**
     *
     * @param {NodeGraph} graph
     */
    layout(graph) {
        //collect node data

        /**
         *
         * @type {NodeVisualData[]}
         */
        const nodes = [];

        this.nodes.forEach(v => {
            nodes.push(v);
        });

        const PADDING = 16;

        const boxes = nodes.map(v => {
            const d = v.dimensions;

            const p = d.position;
            const s = d.size;

            const aabb2 = new AABB2(
                p.x - PADDING,
                p.y - PADDING,
                p.x + s.x + PADDING,
                p.y + s.y + PADDING
            );

            aabb2.model = v.id;

            return aabb2;
        });

        //build a graph structure

        /**
         *
         * @type {Graph<number>}
         */
        const g = new Graph();

        graph.traverseNodes(nodeInstance => {

            g.addNode(nodeInstance.id);
        });

        graph.traverseConnections(connection => {

            g.createEdge(connection.source.instance.id, connection.target.instance.id);

        });

        forceLayout(boxes, g);


        boxes.forEach((box, i) => {
            const node = nodes[i];

            node.dimensions.position.set(box.x0 + PADDING, box.y0 + PADDING);
            node.dimensions.size.set(box.getWidth() - PADDING * 2, box.getHeight() - PADDING * 2);
        });
    }

    /**
     *
     * @param {number} id
     * @param {Color} color
     */
    addDataColor(id, color) {
        this.dataColors.set(id, color);
    }

    /**
     *
     * @param {number} id
     * @returns {Color}
     */
    getDataColor(id) {
        return this.dataColors.get(id);
    }

    /**
     *
     * @param {number} id
     * @param {NodeVisualData} node
     */
    addNode(id, node) {
        this.nodes.set(id, node);
    }

    /**
     *
     * @param {number} id
     * @returns {NodeVisualData|undefined}
     */
    getNode(id) {
        return this.nodes.get(id);
    }

    toJSON() {
        const nodes = {};

        for (const [id, node] of this.nodes) {
            nodes[id] = node.toJSON()
        }

        const dataColors = {};

        for (const [id, dataColor] of this.dataColors) {
            dataColors[id] = dataColor.toJSON();
        }

        return {
            nodes
        };
    }

    fromJSON(json) {
        this.nodes.clear();

        for (const prop in json.nodes) {
            const nodeElement = json.nodes[prop];

            const node = new NodeVisualData();

            node.fromJSON(nodeElement);

            this.nodes.set(node.id, node);
        }

        this.dataColors.clear();

        for (const prop in json.dataColors) {
            const id = parseInt(prop);

            const jColor = json.dataColors[prop];

            const color = new Color();

            color.fromJSON(jColor);

            this.dataColors.set(id, color);
        }
    }
}
