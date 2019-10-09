import { ReactiveExpression } from "./ReactiveExpression.js";
import { assert } from "../../../assert.js";

/**
 * @template T,R
 */
export class ReactiveUnaryExpression extends ReactiveExpression {
    constructor() {
        super();

        /**
         *
         * @type {ReactiveExpression}
         */
        this.source = null;

        this.sourceChangeHandler = (v) => {
            const result = this.transform(v);

            this.onChanged.dispatch(result);
        }
    }

    /**
     *
     * @param {function} visitor
     */
    traverse(visitor) {
        visitor(this);
        this.source.traverse(visitor);
    }

    connect(source) {
        assert.equal(this.source, null, 'source is already set');

        this.source = source;

        this.source.onChanged.add(this.sourceChangeHandler);
    }

    disconnect() {
        this.source.onChanged.remove(this.sourceChangeHandler);

        this.source = null;
    }

    /**
     * @protected
     * @param {T} v
     * @returns {R}
     */
    transform(v) {
        throw new Error('ReactiveUnaryExpression.transform is not overridden');
    }


    /**
     *
     * @returns {R}
     */
    getValue() {
        return this.transform(this.source.getValue());
    }
}

ReactiveUnaryExpression.prototype.isUnaryExpression = true;