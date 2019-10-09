import { ReactiveExpression } from "../ReactiveExpression.js";
import Signal from "../../../../events/signal/Signal.js";
import DataType from "../../../../parser/simple/DataType.js";
import { assert } from "../../../../assert.js";

const dummySignal = new Signal();

export class ReactiveLiteralNumber extends ReactiveExpression {
    /**
     *
     * @param {number} v
     */
    constructor(v) {
        super();

        assert.typeOf(v, "number", 'v');

        //save some ram by using a dummy signal, it never fires anyway since value is constant
        this.onChanged = dummySignal;

        /**
         * @private
         * @readonly
         * @type {number}
         */
        this.value = v;
    }

    getValue() {
        return this.value;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveLiteralNumber.prototype.dataType = DataType.Number;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveLiteralNumber.prototype.isTerminal = true;

/**
 *
 * @param {number} v
 * @returns {ReactiveLiteralNumber}
 */
ReactiveLiteralNumber.from = function (v) {
    const r = new ReactiveLiteralNumber(v);

    return r;
};
