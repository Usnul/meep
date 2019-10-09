import { ProgramSlotValue } from "../slot/ProgramSlotValue.js";

export class RenderProgramInstance {
    /**
     *
     * @param {RenderProgramDefinition} definition
     */
    constructor({ definition }) {
        /**
         *
         * @type {RenderProgramDefinition}
         */
        this.definition = definition;

        /**
         *
         * @type {ProgramSlotValue[]}
         */
        this.slotValues = definition.slots.map(s => new ProgramSlotValue(s));
    }

    /**
     *
     * @param {ProgramValueSlotDefinition} definition
     * @return {ProgramSlotValue}
     */
    getSlotValue(definition) {
        return this.slotValues.find(v => v.definition === definition);
    }
}