import Signal from "../../../events/signal/Signal.js";
import DataType from "../../../parser/simple/DataType.js";

/**
 * @template T
 */
export class ReactiveExpression {
    constructor() {
        this.onChanged = new Signal();
    }

    /**
     * @returns {T}
     */
    getValue() {
        throw new Error('ReactiveExpression.getValue not overridden');
    }

    /**
     *
     * @param {function(node:ReactiveExpression)} visitor
     */
    traverse(visitor) {
        visitor(this);
    }

    /**
     *
     * @param {function} handler
     */
    process(handler) {
        handler(this.getValue());

        this.onChanged.add(handler);
    }
}

ReactiveExpression.prototype.dataType = DataType.Any;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveExpression.prototype.isReactiveExpression = true;
