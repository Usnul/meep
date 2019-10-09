import List from "../../../collection/List.js";
import { PortVisualData } from "./PortVisualData.js";
import Rectangle from "../../../geom/Rectangle.js";

export class NodeVisualData {
    constructor() {
        /**
         *
         * @type {number}
         */
        this.id = 0;

        /**
         *
         * @type {Rectangle}
         */
        this.dimensions = new Rectangle();

        /**
         *
         * @type {List<PortVisualData>}
         */
        this.ports = new List();
    }

    /**
     *
     * @param {number} id
     * @returns {PortVisualData|undefined}
     */
    getPort(id) {
        return this.ports.find(port => port.id === id);
    }

    /**
     *
     * @param {NodeVisualData} other
     */
    copy(other) {
        this.id = other.id;
        this.dimensions.copy(other.dimensions);
        this.ports.deepCopy(other.ports, PortVisualData);
    }

    /**
     *
     * @returns {NodeVisualData}
     */
    clone() {
        const r = new NodeVisualData();

        r.copy(this);

        return r;
    }

    toJSON() {
        return {
            id: this.id,
            dimensions: this.dimensions.toJSON(),
            ports: this.ports.toJSON()
        };
    }

    fromJSON(json) {
        this.id = json.id;
        this.dimensions.fromJSON(json.dimensions);
        this.ports.fromJSON(json, PortVisualData);
    }
}
