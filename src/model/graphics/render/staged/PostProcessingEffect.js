import { PostProcessingEffectInputCoupling } from "./PostProcessingEffectInputCoupling.js";

class PostProcessingEffect {
    /**
     *
     * @param {RenderProgramInstance} node
     */
    constructor({ node }) {
        /**
         *
         * @type {RenderProgramInstance}
         */
        this.node = node;
        /**
         *
         * @type {PostProcessingEffectInputCoupling[]}
         */
        this.inputWiring = [];
    }

    /**
     *
     * @param {string} outputName
     * @param {ProgramValueType} outputType
     * @param {ProgramValueSlotDefinition} input
     */
    couple(outputName, outputType, input) {
        const inputCoupling = new PostProcessingEffectInputCoupling({ outputType, outputName, input });

        this.inputWiring.push(inputCoupling);
    }
}