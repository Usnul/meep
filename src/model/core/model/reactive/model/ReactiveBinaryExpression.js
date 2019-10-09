import { ReactiveExpression } from "./ReactiveExpression.js";
import { assert } from "../../../assert.js";

/**
 * @extends {ReactiveExpression}
 */
export class ReactiveBinaryExpression extends ReactiveExpression {
    constructor() {
        super();

        /**
         *
         * @type {ReactiveExpression|null}
         */
        this.left = null;
        /**
         *
         * @type {ReactiveExpression|null}
         */
        this.right = null;

        this.update = () => {
            const result = this.getValue();

            this.onChanged.dispatch(result);
        };
    }

    transform(left, right) {
        throw new Error('ReactiveBinaryExpression.transform is not overridden');
    }

    /**
     *
     * @param {function} visitor
     */
    traverse(visitor) {
        visitor(this);

        this.left.traverse(visitor);
        this.right.traverse(visitor);
    }

    /**
     *
     * @param left
     * @param right
     */
    connect(left, right) {
        assert.notEqual(left, undefined, 'left is undefined');
        assert.notEqual(left, null, 'left is null');

        assert.notEqual(right, undefined, 'right is undefined');
        assert.notEqual(right, null, 'right is null');

        assert.notEqual(left.onChanged, undefined, 'left.onChanged is undefined');
        assert.notEqual(right.onChanged, undefined, 'right.onChanged is undefined');

        this.left = left;
        this.right = right;

        left.onChanged.add(this.update);
        right.onChanged.add(this.update);
    }

    disconnect() {
        this.left.onChanged.remove(this.update);
        this.right.onChanged.remove(this.update);

        this.right = null;
        this.left = null;
    }

    getValue() {

        const left = this.left;

        if (left === null) {
            //not linked
            throw new Error('left is null');
        }

        const right = this.right;

        if (right === null) {
            //not linked
            throw new Error('right is null');
        }

        const leftValue = left.getValue();
        const rightValue = right.getValue();

        return this.transform(leftValue, rightValue);
    }
}

/**
 * @readonly
 * @type {boolean}
 */
ReactiveBinaryExpression.prototype.isBinaryExpression = true;
