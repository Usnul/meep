import { NodeVisualData } from "./NodeVisualData.js";
import { PortVisualData } from "./PortVisualData.js";
import { PortDirection } from "../node/PortDirection.js";
import { assert } from "../../../assert.js";
import { max3 } from "../../../math/MathUtils.js";

export class NodeDescriptionVisualRegistry {
    constructor() {

        /**
         *
         * @type {Map<number,NodeVisualData>}
         */
        this.data = new Map();

    }

    /**
     *
     * @param {NodeDescription} node
     * @returns {NodeVisualData}
     */
    generate(node) {

        //collect inputs and outputs
        const inputs = [];
        const outputs = [];
        const other = [];

        node.getPorts().forEach(port => {
            if (port.direction === PortDirection.In) {
                inputs.push(port);
            } else if (port.direction === PortDirection.Out) {
                outputs.push(port);
            } else {
                other.push(port);
            }
        });

        //determine dimensions
        let width = 10;

        if (node.parameters.length > 0) {
            width += 245;
        }

        if (inputs.length > 0) {
            width += 65;
        }

        if (outputs.length > 0) {
            width += 65;
        }

        const headerOffset = 20;

        const PORT_HEIGHT = 20;

        const height = headerOffset + max3(inputs.length, outputs.length, node.parameters.length) * PORT_HEIGHT;

        const visual = new NodeVisualData();


        let i, l;

        for (i = 0, l = inputs.length; i < l; i++) {
            const offset = headerOffset + PORT_HEIGHT * i + PORT_HEIGHT / 2;

            const portVisualData = new PortVisualData();
            portVisualData.id = inputs[i].id;

            portVisualData.position.set(8, offset);

            visual.ports.add(portVisualData);
        }

        for (i = 0, l = outputs.length; i < l; i++) {
            const offset = headerOffset + PORT_HEIGHT * i + PORT_HEIGHT / 2;

            const portVisualData = new PortVisualData();
            portVisualData.id = outputs[i].id;

            portVisualData.position.set(width - 8, offset);

            visual.ports.add(portVisualData);
        }

        for (i = 0, l = other.length; i < l; i++) {
            const offset = (width) * (i + 1) / (l + 1);

            const portVisualData = new PortVisualData();
            portVisualData.id = other[i].id;

            portVisualData.position.set(offset, height);

            visual.ports.add(portVisualData);
        }

        visual.dimensions.size.set(width, height);

        this.add(node.id, visual);

        return visual;
    }

    /**
     *
     * @param {number} id
     * @param {NodeVisualData} visual
     */
    add(id, visual) {
        assert.typeOf(id, 'number', 'id');

        this.data.set(id, visual);
    }

    /**
     *
     * @param {number} id
     * @returns {NodeVisualData|undefined}
     */
    get(id) {
        return this.data.get(id);
    }
}
