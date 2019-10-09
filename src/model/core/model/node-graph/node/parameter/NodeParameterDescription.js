import { NodeParameterDataType } from "./NodeParameterDataType.js";
import { noop } from "../../../../function/Functions.js";

export class NodeParameterDescription {
    constructor() {
        this.name = "";
        this.id = 0;
        this.type = NodeParameterDataType.Float;

        /**
         *
         * @type {string|number|boolean}
         */
        this.defaultValue = undefined;
    }

    /**
     *
     * @param {function(string)} [problemConsumer]
     * @returns {boolean}
     */
    validate(problemConsumer = noop) {
        let result = true;

        const defaultValue = this.defaultValue;

        if (defaultValue === undefined) {
            problemConsumer(`default value is undefined`);
            result = false;
        }

        switch (this.type) {
            //intended fallthrough
            case  NodeParameterDataType.Number:
                if (typeof defaultValue !== "number") {
                    problemConsumer(`expected default value to be a number, instead was '${typeof defaultValue}'`);
                    result = false;
                }
                break;
            case NodeParameterDataType.Boolean:
                if (typeof defaultValue !== "boolean") {
                    problemConsumer(`expected default value to be a boolean, instead was '${typeof defaultValue}'`);
                    result = false;
                }

                break;
            case NodeParameterDataType.String:
                if (typeof defaultValue !== "string") {
                    problemConsumer(`expected default value to be a string, instead was '${typeof defaultValue}'`);
                    result = false;
                }
                break;
            default:

                problemConsumer(`Unexpected data type '${type}'`);
                result = false;
        }

        return result;
    }
}
