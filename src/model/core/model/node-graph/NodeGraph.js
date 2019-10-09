import { NodeInstance } from "./node/NodeInstance.js";
import IdPool from "../../IdPool.js";
import { Connection } from "./Connection.js";
import List from "../../collection/List.js";

export class NodeGraph {
    constructor() {
        /**
         * @private
         * @type {List<NodeInstance>}
         */
        this.nodes = new List();

        /**
         * @private
         * @type {List<Connection>}
         */
        this.connections = new List();

        /**
         *
         * @type {IdPool}
         * @private
         */
        this.__idpNodes = new IdPool();

        /**
         *
         * @type {IdPool}
         * @private
         */
        this.__idpConnections = new IdPool();
    }

    /**
     *
     * @param {function(NodeInstance)} visitor
     * @param [thisArg]
     */
    traverseNodes(visitor, thisArg) {
        this.nodes.forEach(visitor, thisArg);
    }

    /**
     *
     * @param {function(Connection)} visitor
     * @param [thisArg]
     */
    traverseConnections(visitor, thisArg) {
        this.connections.forEach(visitor, thisArg);
    }

    /**
     *
     * @param {number} id
     * @returns {NodeInstance}
     */
    getNode(id) {
        return this.nodes.find(node => node.id === id);
    }

    /**
     *
     * @param {number} id
     * @returns {Connection}
     */
    getConnection(id) {
        return this.connections.find(connection => connection.id === id);
    }

    /**
     *
     * @param {NodeDescription} node
     * @returns {number} ID of the new node
     */
    createNode(node) {
        const nodeInstance = new NodeInstance();

        const id = this.__idpNodes.get();

        nodeInstance.id = id;
        nodeInstance.setDescription(node);

        //record the node
        this.nodes.add(nodeInstance);

        return id;
    }

    /**
     *
     * @param {number} id
     * @returns {boolean} True if deleted, false if node was not found
     */
    deleteNode(id) {

        const instance = this.getNode(id);

        if (instance === undefined) {
            //not found
            return false;
        }

        //find attached connections
        const deadConnections = [];

        this.getConnectionsAttachedToNode(id, deadConnections);

        //remove connections
        for (const deadConnection of deadConnections) {
            this.deleteConnection(deadConnection);
        }

        //delete the node
        this.nodes.removeOneOf(instance);

        //release id
        this.__idpNodes.release(id);

        return true;
    }

    /**
     *
     * @param {number} sourceNode
     * @param {number} sourcePort
     * @param {number} targetNode
     * @param {number} targetPort
     * @returns {number} ID of created or already existing connection
     */
    createConnection(sourceNode, sourcePort, targetNode, targetPort) {
        //TODO validate if connection already exists

        const sourceNodeInstance = this.getNode(sourceNode);

        if (sourceNodeInstance === undefined) {
            throw new Error(`Source node '${sourceNode}' not found`);
        }

        const targetNodeInstance = this.getNode(targetNode);

        if (targetNodeInstance === undefined) {
            throw new Error(`Target node '${targetNode}' not found`);
        }

        //get endpoints
        const sourceEndpoint = sourceNodeInstance.getEndpoint(sourcePort);

        if (sourceEndpoint === null) {
            throw new Error(`Source port '${sourcePort}' not found`);
        }

        const targetEndpoint = targetNodeInstance.getEndpoint(targetPort);

        if (targetEndpoint === null) {
            throw new Error(`Target port '${targetPort}' not found`);
        }

        //create connection
        const connection = new Connection();

        connection.setSource(sourceEndpoint);
        connection.setTarget(targetEndpoint);

        const id = this.__idpConnections.get();
        connection.id = id;

        this.connections.add(connection);

        return id;
    }

    /**
     *
     * @param {number} id
     * @returns {boolean} True if delete, false if connection was not found
     */
    deleteConnection(id) {

        const connection = this.getConnection(id);

        if (connection === undefined) {
            return false;
        }

        this.connections.removeOneOf(connection);

        return true;
    }

    /**
     *
     * @param {number} id
     * @param {number[]} result IDs of attached connections
     */
    getConnectionsAttachedToNode(id, result) {
        let count = 0;

        for (let i = 0, l = this.connections.length; i < l; i++) {

            const connection = this.connections.get(i);

            if (connection.isAttachedToNode(id)) {
                result.push(id);

                count++;
            }
        }

        return count;
    }
}
