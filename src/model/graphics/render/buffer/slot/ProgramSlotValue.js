export class ProgramSlotValue {
    /**
     *
     * @param {ProgramValueSlotDefinition} definition
     */
    constructor(definition) {
        /**
         *
         * @type {ProgramValueSlotDefinition}
         */
        this.definition = definition;
        this.value = null;
        /**
         *
         * @type {ProgramValueSlotConnection[]}
         */
        this.connections = [];
    }

    /**
     *
     * @param {ProgramValueSlotConnection} connection
     */
    addConnection(connection) {
        this.connections.push(connection);
    }

    getValue() {
        return this.value;
    }

    setValue(v) {
        this.value = v;
    }
}