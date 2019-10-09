import nearley from "nearley";

import grammar from '../nearley/ReactiveNearley.js';
import { ReactiveReference } from "../../../model/reactive/model/terminal/ReactiveReference.js";
import { ReactiveLiteralNumber } from "../../../model/reactive/model/terminal/ReactiveLiteralNumber.js";
import { ReactiveAdd } from "../../../model/reactive/model/arithmetic/ReactiveAdd.js";
import { ReactiveSubtract } from "../../../model/reactive/model/arithmetic/ReactiveSubtract.js";
import { ReactiveMultiply } from "../../../model/reactive/model/arithmetic/ReactiveMultiply.js";
import { ReactiveDivide } from "../../../model/reactive/model/arithmetic/ReactiveDivide.js";
import { ReactiveGreaterThan } from "../../../model/reactive/model/comparative/ReactiveGreaterThan.js";
import { ReactiveLessThan } from "../../../model/reactive/model/comparative/ReactiveLessThan.js";
import { ReactiveLessThanOrEqual } from "../../../model/reactive/model/comparative/ReactiveLessThanOrEqual.js";
import { ReactiveEquals } from "../../../model/reactive/model/comparative/ReactiveEquals.js";
import { ReactiveNotEquals } from "../../../model/reactive/model/comparative/ReactiveNotEquals.js";
import { ReactiveAnd } from "../../../model/reactive/model/logic/ReactiveAnd.js";
import { ReactiveOr } from "../../../model/reactive/model/logic/ReactiveOr.js";
import { ReactiveLiteralBoolean } from "../../../model/reactive/model/terminal/ReactiveLiteralBoolean.js";
import { ReactiveNot } from "../../../model/reactive/model/logic/ReactiveNot.js";
import { ReactiveNegate } from "../../../model/reactive/model/arithmetic/ReactiveNegate.js";
import { ReactiveGreaterThanOrEqual } from "../../../model/reactive/model/comparative/ReactiveGreaterThanOrEqual.js";
import { assert } from "../../../assert.js";

const compilers = {
    Reference: ({ value }) => new ReactiveReference(value.join('.')),
    LiteralNumber: ({ value }) => new ReactiveLiteralNumber(value),
    LiteralBoolean: ({ value }) => new ReactiveLiteralBoolean(value),
    BinaryAdd: ({ left, right }) => {
        const result = new ReactiveAdd();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinarySubtract: ({ left, right }) => {
        const result = new ReactiveSubtract();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinaryMultiply: ({ left, right }) => {
        const result = new ReactiveMultiply();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinaryDivide: ({ left, right }) => {
        const result = new ReactiveDivide();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinaryGreater: ({ left, right }) => {
        const result = new ReactiveGreaterThan();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinaryGreaterOrEqual: ({ left, right }) => {
        const result = new ReactiveGreaterThanOrEqual();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinaryLess: ({ left, right }) => {
        const result = new ReactiveLessThan();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinaryLessOrEqual: ({ left, right }) => {
        const result = new ReactiveLessThanOrEqual();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinaryEqual: ({ left, right }) => {
        const result = new ReactiveEquals();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinaryNotEqual: ({ left, right }) => {
        const result = new ReactiveNotEquals();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinaryAnd: ({ left, right }) => {
        const result = new ReactiveAnd();

        compileBinaryExpression(result, left, right);

        return result;
    },
    BinaryOr: ({ left, right }) => {
        const result = new ReactiveOr();

        compileBinaryExpression(result, left, right);

        return result;
    },
    UnaryNot: ({ value }) => {
        const result = new ReactiveNot();

        compileUnaryExpression(result, value);

        return result;
    },
    UnaryNegate: ({ value }) => {
        const result = new ReactiveNegate();

        compileUnaryExpression(result, value);

        return result;
    },
};

/**
 *
 * @param {ReactiveBinaryExpression} result
 * @param left
 * @param right
 */
function compileBinaryExpression(result, left, right) {
    const lExp = compile(left);
    const rExp = compile(right);

    result.connect(lExp, rExp);
}

/**
 *
 * @param {ReactiveUnaryExpression} result
 * @param value
 */
function compileUnaryExpression(result, value) {
    const exp = compile(value);

    result.connect(exp);
}

function compile(node) {
    const type = node.type;

    const compiler = compilers[type];

    if (compiler === undefined) {
        throw new Error(`Unsupported node type '${type}'`);
    }

    return compiler(node);
}

const rules = nearley.Grammar.fromCompiled(grammar);


/**
 *
 * @param {String} code
 * @returns {ReactiveExpression}
 */
export function compileReactiveExpression(code) {
    assert.notEqual(code.trim(), "", 'code is empty');

    const parser = new nearley.Parser(rules);

    parser.feed(code);

    const results = parser.results;

    if (results.length > 1) {
        console.warn(`Multiple parses of '${code}'`, results);
    }

    return compile(results[0]);
}
