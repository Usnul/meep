import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveNotEquals extends ReactiveBinaryExpression {
    /**
     *
     * @param {number|boolean} left
     * @param {number|boolean} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left !== right;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveNotEquals.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveNotEquals.prototype.isComparativeExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveNotEquals.prototype.isReactiveNotEquals = true;


/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveNotEquals}
 */
ReactiveNotEquals.from = function (left, right) {
    const r = new ReactiveNotEquals();

    r.connect(left, right);

    return r;
};
