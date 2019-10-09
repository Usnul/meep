import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveGreaterThan extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left > right;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveGreaterThan.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveGreaterThan.prototype.isComparativeExpression = true;


/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveGreaterThan}
 */
ReactiveGreaterThan.from = function (left, right) {
    const r = new ReactiveGreaterThan();

    r.connect(left, right);

    return r;
};
