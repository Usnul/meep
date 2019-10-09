import { computeHashIntegerArray } from "../../../../../core/math/MathUtils.js";

export class ProgramValueSlotParameterSet {
    constructor() {
        /**
         *
         * @private
         * @type {ProgramValueSlotParameter[]}
         */
        this.data = [];

        /**
         * @private
         * @type {Map<string, ProgramValueSlotParameter>}
         */
        this.nameMap = new Map();
    }

    /**
     *
     * @param {ProgramValueSlotParameter} parameter
     */
    add(parameter) {
        this.data.push(parameter);
        this.nameMap.set(parameter.name, parameter);
    }

    /**
     *
     * @param {string} name
     * @return {ProgramValueSlotParameter|undefined}
     */
    getParameterByName(name) {
        return this.nameMap.get(name);
    }

    /**
     *
     * @return {number}
     */
    hash() {
        return computeHashIntegerArray.apply(null, this.data.map(p => p.hash()));
    }
}