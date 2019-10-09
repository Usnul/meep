import { assert } from "../../../../core/assert";

export class ProgramValueSlotConnectionEndpoint {
    /**
     *
     * @param {RenderProgramInstance} node
     * @param {ProgramValueSlotDefinition} slot
     */
    constructor({ node, slot }) {
        assert.notEqual(node, undefined, 'node is undefined');
        assert.notEqual(slot, undefined, 'slot is undefined');

        assert.typeOf(node, 'object', 'node');
        assert.typeOf(slot, 'object', 'slot');

        assert.notEqual(node.definition.slots.indexOf(slot), -1, 'node does not contain specified slot');

        /**
         *
         * @type {RenderProgramInstance}
         */
        this.node = node;
        /**
         *
         * @type {ProgramValueSlotDefinition}
         */
        this.slot = slot;
    }

    /**
     *
     * @param {ProgramValueSlotConnectionEndpoint} other
     * @returns {boolean}
     */
    equals(other) {
        return (this.node === other.node) && (this.slot === other.slot)
    }

}