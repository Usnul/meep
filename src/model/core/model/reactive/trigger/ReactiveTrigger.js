import { inferReactiveExpressionTypes } from "../transform/ReactiveTypeInferrence.js";
import DataType from "../../../parser/simple/DataType.js";
import { compileReactiveExpression } from "../../../land/reactive/compiler/ReactiveNearlyCompiler.js";
import { assert } from "../../../assert.js";

export class ReactiveTrigger {
    /**
     *
     * @param {string} code
     */
    constructor(code) {

        assert.typeOf(code, "string", code);

        /**
         *
         * @type {ReactiveExpression}
         */
        this.expression = compileReactiveExpression(code);

        //infer types
        inferReactiveExpressionTypes(this.expression);

        if (this.expression.dataType === DataType.Any) {
            //enforce top level type
            this.expression.dataType = DataType.Boolean;
        }

        /**
         *
         * @type {ReactiveReference[]}
         */
        this.references = [];

        this.expression.traverse((node) => {
            if (node.isReference) {
                this.references.push(node);
            }
        });

    }

    /**
     *
     * @param {function(ReactiveReference)} visitor
     * @param {*} [thisArg]
     */
    traverseReferences(visitor, thisArg) {
        this.references.forEach(visitor, thisArg);
    }

    /**
     * Given a dictionary-style object, connect references in the expression to values of properties with matching names.
     * @example given object {a: Vector1} and expression a > 7, value of A will be taken from that input object
     * @param {Object} data
     */
    connect(data) {
        this.references.forEach(ref => {
            const refName = ref.name;
            const datum = data[refName];

            ref.connect(datum);
        });
    }

    disconnect() {
        this.references.forEach(ref => ref.disconnect());
    }
}
