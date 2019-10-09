import { Port } from "./Port.js";
import { BitSet } from "../../../binary/BitSet.js";
import { assert } from "../../../assert.js";
import { NodeParameterDataType } from "./parameter/NodeParameterDataType.js";
import { NodeParameterDescription } from "./parameter/NodeParameterDescription.js";


/**
 * @private
 * @param {{id:number}[]} things
 * @returns {number}
 */
function pickNewSetId(things) {
    const ids = new BitSet();

    things.forEach((v, id) => ids.set(id, true));

    const id = ids.nextClearBit(0);

    if (id === -1) {
        return 0;
    } else {
        return id;
    }
}

export class NodeDescription {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.name = "";

        /**
         *
         * @type {number}
         */
        this.id = 0;

        /**
         * @protected
         * @type {Port[]}
         */
        this.ports = [];

        /**
         *
         * @type {NodeParameterDescription[]}
         */
        this.parameters = [];
    }

    /**
     *
     * @param {string} name
     * @param {NodeParameterDataType} type
     * @param {number|boolean|string} [defaultValue]
     * @returns {number}
     */
    createParameter(name, type, defaultValue) {

        assert.typeOf(name, 'string', 'name');
        assert.ok(Object.values(NodeParameterDataType).includes(type), `Unknown type '${type}'`);


        //if default value is not given, pick one
        if (defaultValue === undefined) {
            switch (type) {
                case NodeParameterDataType.Integer:
                //intended fallthrough
                case  NodeParameterDataType.Float:
                    defaultValue = 0;
                    break;
                case NodeParameterDataType.Boolean:
                    defaultValue = false;
                    break;
                case NodeParameterDataType.String:
                    defaultValue = "";
                    break;
                default:
                    throw new Error(`Unknown data type '${type}'`);
            }
        }


        const id = pickNewSetId(this.parameters);

        const pd = new NodeParameterDescription();

        pd.name = name;
        pd.type = type;
        pd.defaultValue = defaultValue;
        pd.id = id;

        assert.ok(pd.validate(console.error), 'parameter is not valid');

        this.parameters.push(pd);

        return id;
    }

    /**
     *
     * @param {number} id
     * @returns {NodeParameterDescription}
     */
    getParameter(id) {

        const paramDescriptors = this.parameters;

        for (let i = 0; i < paramDescriptors.length; i++) {
            const paramDescriptor = paramDescriptors[i];

            if (paramDescriptor.id === id) {
                return paramDescriptor;
            }
        }

        //not found
        return null;
    }


    /**
     *
     * @param {DataType} type
     * @param {String} name
     * @param {PortDirection} direction
     */
    createPort(type, name, direction) {
        const port = new Port();

        const id = pickNewSetId(this.ports);

        port.id = id;

        port.dataType = type;
        port.name = name;
        port.direction = direction;

        this.ports.push(port);

        return id;
    }

    /**
     *
     * @param {number} id
     * @returns {Port|null}
     */
    getPortById(id) {
        for (const port of this.ports) {
            if (port.id === id) {
                return port;
            }
        }

        //not found
        return null;
    }

    /**
     *
     * @returns {Port[]}
     */
    getPorts() {
        return this.ports
    }
}
