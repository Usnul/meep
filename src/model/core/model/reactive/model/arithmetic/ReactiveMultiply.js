import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveMultiply extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {number}
     */
    transform(left, right) {
        return left * right;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveMultiply.prototype.dataType = DataType.Number;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveMultiply.prototype.isArithmeticExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveMultiply.prototype.isReactiveMultiply = true;


/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveMultiply}
 */
ReactiveMultiply.from = function (left, right) {
    const r = new ReactiveMultiply();

    r.connect(left, right);

    return r;
};
