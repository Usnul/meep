import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveAdd extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {number}
     */
    transform(left, right) {
        return left + right;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveAdd.prototype.dataType = DataType.Number;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveAdd.prototype.isArithmeticExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveAdd.prototype.isReactiveAdd = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveAdd}
 */
ReactiveAdd.from = function (left, right) {
    const r = new ReactiveAdd();

    r.connect(left, right);

    return r;
};
