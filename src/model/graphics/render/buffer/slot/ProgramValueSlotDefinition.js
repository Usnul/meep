import { ProgramValueSlotParameterSet } from "./parameter/ProgramValueSlotParameterSet.js";

export class ProgramValueSlotDefinition {
    /**
     *
     * @param {ProgramValueType} type
     * @param {ProgramValueDirectionKind} direction
     * @param {string} name
     */
    constructor({ type, direction, name }) {
        /**
         *
         * @type {string}
         */
        this.name = name;
        /**
         *
         * @type {ProgramValueType}
         */
        this.type = type;
        /**
         *
         * @type {ProgramValueDirectionKind}
         */
        this.direction = direction;

        /**
         *
         * @type {ProgramValueSlotParameterSet}
         */
        this.parameters = new ProgramValueSlotParameterSet();
    }
}