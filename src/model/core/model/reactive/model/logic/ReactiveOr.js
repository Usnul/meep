import { ReactiveBinaryExpression } from "../ReactiveBinaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveOr extends ReactiveBinaryExpression {
    /**
     *
     * @param {boolean} left
     * @param {boolean} right
     * @returns {boolean}
     */
    transform(left, right) {
        return left || right;
    }
}

/**
 * @readonly
 * @type {DataType|string}
 */
ReactiveOr.prototype.dataType = DataType.Boolean;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveOr.prototype.isLogicExpression = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveOr.prototype.isReactiveOr = true;

/**
 *
 * @param {ReactiveExpression} left
 * @param {ReactiveExpression} right
 * @returns {ReactiveOr}
 */
ReactiveOr.from = function (left, right) {
    const r = new ReactiveOr();

    r.connect(left, right);

    return r;
};
