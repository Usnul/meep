import { assert } from "../../../../core/assert";
import { ProgramValueDirectionKind } from "../slot/ProgramValueDirectionKind.js";

export class ProgramValueSlotConnection {
    /**
     *
     * @param {ProgramValueSlotConnectionEndpoint} source
     * @param {ProgramValueSlotConnectionEndpoint} target
     */
    constructor({ source, target }) {
        assert.notEqual(source, undefined, 'source is undefined');
        assert.notEqual(target, undefined, 'target is undefined');

        assert.typeOf(source, 'object', 'source');
        assert.typeOf(target, 'object', 'target');

        assert.equal(source.slot.direction, ProgramValueDirectionKind.Out, `expected source slot direction to be Out, instead was '${source.slot.direction}'`);
        assert.equal(target.slot.direction, ProgramValueDirectionKind.In, `expected source slot direction to be In, instead was '${target.slot.direction}'`);

        assert.equal(source.slot.type, target.slot.type, `source(${source.slot.type}) and target(${target.slot.type}) slot types do not match`)

        /**
         *
         * @type {ProgramValueSlotConnectionEndpoint}
         */
        this.source = source;

        /**
         *
         * @type {ProgramValueSlotConnectionEndpoint}
         */
        this.target = target;
    }

    /**
     *
     * @param {ProgramValueSlotConnection} other
     * @returns {boolean}
     */
    equals(other) {
        return this.source.equals(other.source) && this.target.equals(other.target);
    }
}