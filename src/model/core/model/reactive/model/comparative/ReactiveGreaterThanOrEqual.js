import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveGreaterThanOrEqual extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left >= right;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveGreaterThanOrEqual.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveGreaterThanOrEqual.prototype.isComparativeExpression = true;


/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveGreaterThanOrEqual}
 */
ReactiveGreaterThanOrEqual.from = function (left, right) {
    const r = new ReactiveGreaterThanOrEqual();

    r.connect(left, right);

    return r;
};
