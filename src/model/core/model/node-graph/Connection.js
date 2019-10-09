import { ConnectionEndpoint } from "./ConnectionEndpoint.js";
import { noop } from "../../function/Functions.js";
import { PortDirection } from "./node/PortDirection.js";
import { objectKeyByValue } from "../ObjectUtils.js";
import { assert } from "../../assert.js";

export class Connection {
    constructor() {
        /**
         *
         * @type {ConnectionEndpoint}
         */
        this.source = null;
        /**
         *
         * @type {ConnectionEndpoint}
         */
        this.target = null;
    }

    /**
     *
     * @param {function} [problemConsumer]
     * @returns {boolean} true if connection is valid
     */
    validate(problemConsumer = noop) {
        const source = this.source;
        const target = this.target;

        let result = true;

        if (source === null) {
            problemConsumer(`Source port is not set`);

            result = false;
        } else if (source.port.direction !== PortDirection.Out) {
            problemConsumer(`Source port must be directed OUT, instead was ${objectKeyByValue(PortDirection, source.port.direction)}`);

            result = false;
        }

        if (target === null) {
            problemConsumer(`Target port is not set`);

            result = false;
        } else if (target.port.direction !== PortDirection.In) {
            problemConsumer(`Target port must be directed IN, instead was ${objectKeyByValue(PortDirection, target.port.direction)}`);

            result = false;
        }

        if (
            (source !== null && target !== null)
            && (source.port.dataType !== target.port.dataType)
        ) {
            problemConsumer(`Source and Target port data types don't match`);

            result = false;
        }

        return result;
    }

    /**
     *
     * @param {ConnectionEndpoint} endpoint
     */
    setSource(endpoint) {
        assert.notEqual(endpoint, undefined, 'endpoint is undefined');
        assert.notEqual(endpoint, null, 'endpoint is null');

        this.source = endpoint;
    }

    /**
     *
     * @param {ConnectionEndpoint} endpoint
     */
    setTarget(endpoint) {
        assert.notEqual(endpoint, undefined, 'endpoint is undefined');
        assert.notEqual(endpoint, null, 'endpoint is null');

        this.target = endpoint;
    }

    /**
     *
     * @param {number} id Id of {@link NodeInstance}
     * @returns {boolean}
     */
    isAttachedToNode(id) {
        assert.typeOf(id, 'number', 'id');
        assert.ok(Number.isInteger(id), `id must be an integer, instead was '${id}'`);

        return this.source.instance.id === id || this.target.instance.id === id;
    }
}
