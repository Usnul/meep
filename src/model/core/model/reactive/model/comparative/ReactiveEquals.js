import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveEquals extends ReactiveBinaryExpression {
    /**
     *
     * @param {number|boolean} left
     * @param {number|boolean} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left === right;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveEquals.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveEquals.prototype.isComparativeExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveEquals.prototype.isReactiveEquals = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveEquals}
 */
ReactiveEquals.from = function (left, right) {
    const r = new ReactiveEquals();

    r.connect(left, right);

    return r;
};
