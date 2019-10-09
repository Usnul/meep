import { ProgramValueDirectionKind } from "../buffer/slot/ProgramValueDirectionKind.js";
import { assert } from "../../../core/assert";

export class PostProcessingEffectInputCoupling {
    /**
     *
     * @param {string} outputName
     * @param {ProgramValueType} outputType
     * @param {ProgramValueSlotDefinition} input
     */
    constructor({ outputName, outputType, input }) {
        assert.notEqual(input.direction, ProgramValueDirectionKind.Out, `Supplied input slot has OUT direction (not an input slot)`);

        /**
         *
         * @type {ProgramValueSlotDefinition}
         */
        this.input = input;
        /**
         *
         * @type {string}
         */
        this.outputName = outputName;
        /**
         *
         * @type {ProgramValueType}
         */
        this.outputType = outputType;
    }

    /**
     *
     * @param {ProgramValueSlotDefinition} output
     * @returns {boolean}
     */
    matchOutput(output) {
        return (output.direction !== ProgramValueDirectionKind.In)
            && output.type === this.outputType
            && output.name === this.outputName;
    }
}