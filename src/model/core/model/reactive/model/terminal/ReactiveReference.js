import { ReactiveExpression } from "../ReactiveExpression.js";
import { assert } from "../../../../assert.js";


/**
 * @extends ReactiveExpression
 */
export class ReactiveReference extends ReactiveExpression {
    constructor(name) {
        super();

        this.name = name;

        this.source = null;

        this.update = (v, oldV) => {
            this.onChanged.dispatch(v, oldV);
        };
    }

    connect(source) {
        assert.notEqual(source, null, 'source is null');
        assert.notEqual(source, undefined, 'source is undefined');
        assert.typeOf(source.onChanged, 'object', 'source.onChanged');
        assert.typeOf(source.onChanged.add, 'function', 'source.onChanged.add');

        if (this.source !== null) {
            throw new Error('source is already set. Already connected');
        }

        this.source = source;

        source.onChanged.add(this.update);
    }

    disconnect() {
        if (this.source === null) {
            return;
        }

        this.source.onChanged.remove(this.update);

        this.source = null;
    }

    getValue() {
        return this.source.getValue();
    }
}

/**
 * @readonly
 * @type {boolean}
 */
ReactiveReference.prototype.isTerminal = true;

/**
 * @readonly
 * @type {boolean}
 */
ReactiveReference.prototype.isReference = true;

/**
 *
 * @param {ObservedBoolean|Vector1} source
 * @param {string} [name]
 * @returns {ReactiveReference}
 */
ReactiveReference.from = function (source, name = 'undefined') {
    const r = new ReactiveReference(name);

    r.connect(source);

    return r;
};
