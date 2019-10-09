export class RenderProgramDefinition {
    constructor() {
        /**
         *
         * @type {ProgramValueSlotDefinition[]}
         */
        this.slots = [];
    }

    build() {

    }

    /**
     *
     * @param {RenderProgramInstance} instance
     */
    execute(instance) {
        throw  new Error(`Not implemented. Needs to be overridden`);
    }
}