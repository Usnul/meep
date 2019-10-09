import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveLessThanOrEqual extends ReactiveBinaryExpression {
    /**
     *
     * @param {number} left
     * @param {number} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left <= right;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveLessThanOrEqual.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveLessThanOrEqual.prototype.isComparativeExpression = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveLessThanOrEqual}
 */
ReactiveLessThanOrEqual.from = function (left, right) {
    const r = new ReactiveLessThanOrEqual();

    r.connect(left, right);

    return r;
};
