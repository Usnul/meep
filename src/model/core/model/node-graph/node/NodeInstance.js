import { ConnectionEndpoint } from "../ConnectionEndpoint.js";
import List from "../../../collection/List.js";
import { PortDirection } from "./PortDirection.js";

export class NodeInstance {
    constructor() {
        /**
         *
         * @type {number}
         */
        this.id = 0;

        /**
         *
         * @type {NodeDescription}
         */
        this.description = null;

        /**
         *
         * @type {ConnectionEndpoint[]}
         */
        this.endpoints = [];


        /**
         * Internal instance data
         * @type {[]}
         */
        this.parameters = [];


        /**
         *
         * @type {[]}
         */
        this.outputsValues = [];

        /**
         *
         * @type {List<Connection>}
         */
        this.connections = new List();
    }

    /**
     *
     * @param {number} id
     * @param {PortDirection} direction
     * @param {Connection[]} result
     * @returns {number} number of connections matched
     */
    getConnectionsByPort(id, direction, result) {
        let count = 0;

        const connections = this.connections;
        const l = connections.length;

        for (let i = 0; i < l; i++) {
            const connection = connections.get(i);

            if (
                (direction === PortDirection.In && connection.target.port.id === id)
                || (direction === PortDirection.Out && connection.source.port.id === id)
            ) {
                result[count] = connection;

                count++;
            }
        }

        return count;
    }

    /**
     *
     * @param {number} id
     * @param {*} value
     */
    setOutputValue(id, value) {
        this.outputsValues[id] = value;
    }

    /**
     *
     * @param {number} id
     * @returns {*}
     */
    getOutputValue(id) {
        return this.outputsValues[id];
    }

    /**
     *
     * @param {number} id
     * @returns {string|number|boolean}
     */
    getParameterValue(id) {
        return this.parameters[id];
    }

    /**
     *
     * @param {number} id
     * @param {string|number|boolean} value
     */
    setParameterValue(id, value) {
        this.parameters[id] = value;
    }

    /**
     *
     * @param {NodeDescription} node
     */
    setDescription(node) {
        this.description = node;

        //generate endpoints
        this.endpoints = node.getPorts().map(port => {
            const endpoint = new ConnectionEndpoint();

            endpoint.port = port;
            endpoint.instance = this;

            return endpoint;
        });

        //clear parameters
        this.parameters.splice(0, this.parameters.length);

        //populate parameter defaults
        node.parameters.forEach(pd => {
            this.parameters[pd.id] = pd.defaultValue;
        });
    }

    /**
     *
     * @param {number} port Port Id
     * @returns {ConnectionEndpoint|null}
     */
    getEndpoint(port) {
        const endpoints = this.endpoints;

        for (const endpoint of endpoints) {
            if (endpoint.port.id === port) {
                return endpoint;
            }
        }

        //not found
        return null;
    }
}
