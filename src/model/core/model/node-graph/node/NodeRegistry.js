import { DataType } from "../DataType.js";
import { NodeDescription } from "./NodeDescription.js";
import { Port } from "./Port.js";
import { BitSet } from "../../../binary/BitSet.js";
import { assert } from "../../../assert.js";

export class NodeRegistry {
    constructor() {
        /**
         *
         * @type {Map<number, NodeDescription>}
         */
        this.nodes = new Map();

        /**
         *
         * @type {Map<number, DataType>}
         */
        this.types = new Map();
    }

    /**
     *
     * @param {NodeDescription} node
     */
    addNode(node) {
        assert.notEqual(node, undefined, 'node is undefined');
        assert.notEqual(node, null, 'node is null');

        if (this.nodes.has(node.id)) {
            console.warn(`Node with id ${node.id} already exists`);

            return false;
        }

        //extract types
        node.getPorts().forEach(port => {
            this.addType(port.dataType);
        });

        this.nodes.set(node.id, node);

        return true;
    }

    /**
     *
     * @param {DataType} type
     */
    addType(type) {
        if (this.types.has(type.id)) {
            return false;
        }

        this.types.set(type.id, type);
        return true;
    }

    /**
     *
     * @returns {number}
     */
    generateTypeId() {
        const ids = new BitSet();

        this.types.forEach((v, id) => ids.set(id, true));

        const id = ids.nextClearBit(0);

        if (id === -1) {
            return 0;
        } else {
            return id;
        }
    }

    /**
     *
     * @param {String} name
     * @returns {DataType}
     */
    createType(name) {
        const dataType = new DataType();

        dataType.name = name;

        dataType.id = this.generateTypeId();

        this.addType(dataType);

        return dataType;
    }

    /**
     *
     * @param {number} id
     * @returns {NodeDescription|undefined}
     */
    getNode(id) {
        return this.nodes.get(id);
    }

    /**
     *
     * @param json
     * @returns {Port}
     */
    parsePort(json) {
        const port = new Port();

        port.dataType = this.types.get(json.dataType);
        port.direction = json.direction;
        port.name = json.name;

        return port;
    }

    /**
     *
     * @param json
     * @returns {NodeDescription}
     */
    parseNode(json) {
        const node = new NodeDescription();

        node.name = json.name;

        const jPorts = json.ports;

        for (const p in jPorts) {
            const jPort = jPorts[p];

            const portId = parseInt(p);

            const port = this.parsePort(jPort);

            port.id = portId;

            node.ports.push(port);
        }

        return node;
    }

    fromJSON(json) {

        const jNodes = json.nodes;
        const jTypes = json.types;

        this.types.clear();
        this.nodes.clear();

        //parse types
        for (const p in jTypes) {
            const id = parseInt(p);

            const dataType = new DataType();

            dataType.id = id;
            dataType.name = jTypes[p];

            this.types.set(id, dataType);
        }

        for (const p in jNodes) {
            const id = parseInt(p);

            const jNode = jNodes[p];

            const node = this.parseNode(jNode);

            node.id = id;

            this.nodes.set(id, node);

        }

    }

    toJSON() {
        //write types
        const types = {};
        for (const [id, type] of this.types) {
            types[id] = type.name;
        }

        const nodes = {};
        for (const [id, node] of this.nodes) {
            const ports = {};

            node.getPorts().forEach(port => {
                ports[port.id] = {
                    dataType: port.dataType.id,
                    direction: port.direction,
                    name: port.name
                };
            });

            nodes[id] = {
                name: node.name,
                ports
            };
        }

        return {
            types,
            nodes
        };
    }
}
