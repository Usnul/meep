import { ReactiveReference } from "../../../model/reactive/model/terminal/ReactiveReference.js";
import { ReactiveLiteralNumber } from "../../../model/reactive/model/terminal/ReactiveLiteralNumber.js";
import { ReactiveNegate } from "../../../model/reactive/model/arithmetic/ReactiveNegate.js";
import { ReactiveSubtract } from "../../../model/reactive/model/arithmetic/ReactiveSubtract.js";
import { ReactiveNot } from "../../../model/reactive/model/logic/ReactiveNot.js";
import { ReactiveGreaterThan } from "../../../model/reactive/model/comparative/ReactiveGreaterThan.js";
import { ReactiveAdd } from "../../../model/reactive/model/arithmetic/ReactiveAdd.js";
import { compileReactiveExpression } from "./ReactiveNearlyCompiler.js";
import { ReactiveOr } from "../../../model/reactive/model/logic/ReactiveOr.js";
import { ReactiveAnd } from "../../../model/reactive/model/logic/ReactiveAnd.js";
import { ReactiveLessThan } from "../../../model/reactive/model/comparative/ReactiveLessThan.js";
import { ReactiveLessThanOrEqual } from "../../../model/reactive/model/comparative/ReactiveLessThanOrEqual.js";
import { ReactiveEquals } from "../../../model/reactive/model/comparative/ReactiveEquals.js";
import { ReactiveNotEquals } from "../../../model/reactive/model/comparative/ReactiveNotEquals.js";
import { ReactiveMultiply } from "../../../model/reactive/model/arithmetic/ReactiveMultiply.js";
import { ReactiveDivide } from "../../../model/reactive/model/arithmetic/ReactiveDivide.js";
import { ReactiveGreaterThanOrEqual } from "../../../model/reactive/model/comparative/ReactiveGreaterThanOrEqual.js";

test('compile: REFERENCE', () => {
    const expression = compileReactiveExpression('a');

    expect(expression instanceof ReactiveReference).toBe(true);
    expect(expression.name).toBe('a');
});

test('compile: LITERAL_NUBMER', () => {
    const expression = compileReactiveExpression("42");

    expect(expression instanceof ReactiveLiteralNumber).toBe(true);
    expect(expression.getValue()).toBe(42);
});

test('compile: MINUS REFERENCE', () => {
    const expression = compileReactiveExpression("-x");

    expect(expression instanceof ReactiveNegate).toBe(true);
    expect(expression.source instanceof ReactiveReference).toBe(true);
});

test('compile: REFERENCE MINUS MINUS REFERENCE', () => {
    const expression = compileReactiveExpression('x - - x');

    expect(expression instanceof ReactiveSubtract).toBe(true);
    expect(expression.left instanceof ReactiveReference).toBe(true);
    expect(expression.right instanceof ReactiveNegate).toBe(true);
    expect(expression.right.source instanceof ReactiveReference).toBe(true);
});

test('compile: NOT REFERENCE', () => {
    const expression = compileReactiveExpression('!x');

    expect(expression instanceof ReactiveNot).toBe(true);
    expect(expression.source instanceof ReactiveReference).toBe(true);
});

test('compile: NOT NOT REFERENCE', () => {
    const expression = compileReactiveExpression('!!x');

    expect(expression instanceof ReactiveNot).toBe(true);
    expect(expression.source instanceof ReactiveNot).toBe(true);
    expect(expression.source.source instanceof ReactiveReference).toBe(true);
});

test('compile: REFERENCE > REFERENCE', () => {
    const expression = compileReactiveExpression('x > y');

    expect(expression instanceof ReactiveGreaterThan).toBe(true);
    expect(expression.left instanceof ReactiveReference).toBe(true);
    expect(expression.left.name).toBe('x');
    expect(expression.right.name).toBe('y');
});

test('compile: ( REFERENCE )', () => {
    const expression = compileReactiveExpression('(x)');

    expect(expression instanceof ReactiveReference).toBe(true);
});

test('compile: REFERENCE > ( REFERENCE + REFERENCE )', () => {
    const expression = compileReactiveExpression('x > ( y + z )');

    expect(expression instanceof ReactiveGreaterThan).toBe(true);
    expect(expression.left instanceof ReactiveReference).toBe(true);
    expect(expression.right instanceof ReactiveAdd).toBe(true);
});

test('compile: a || b', () => {
    const expression = compileReactiveExpression('a || b');

    expect(expression instanceof ReactiveOr).toBe(true);
});

test('compile: a && b', () => {
    const expression = compileReactiveExpression('a && b');

    expect(expression instanceof ReactiveAnd).toBe(true);
});

test('compile: a > b', () => {
    const expression = compileReactiveExpression('a > b');

    expect(expression instanceof ReactiveGreaterThan).toBe(true);
});

test('compile: a >= b', () => {
    const expression = compileReactiveExpression('a >= b');

    expect(expression instanceof ReactiveGreaterThanOrEqual).toBe(true);
});

test('compile: a < b', () => {
    const expression = compileReactiveExpression('a < b');

    expect(expression instanceof ReactiveLessThan).toBe(true);
});

test('compile: a <= b', () => {
    const expression = compileReactiveExpression('a <= b');

    expect(expression instanceof ReactiveLessThanOrEqual).toBe(true);
});

test('compile: a == b', () => {
    const expression = compileReactiveExpression('a == b');

    expect(expression instanceof ReactiveEquals).toBe(true);
});

test('compile: a != b', () => {
    const expression = compileReactiveExpression('a != b');

    expect(expression instanceof ReactiveNotEquals).toBe(true);
});

test('compile: a + b', () => {
    const expression = compileReactiveExpression('a + b');

    expect(expression instanceof ReactiveAdd).toBe(true);
});

test('compile: a - b', () => {
    const expression = compileReactiveExpression('a - b');

    expect(expression instanceof ReactiveSubtract).toBe(true);
});

test('compile: a * b', () => {
    const expression = compileReactiveExpression('a * b');

    expect(expression instanceof ReactiveMultiply).toBe(true);
});

test('compile: a / b', () => {
    const expression = compileReactiveExpression('a / b');

    expect(expression instanceof ReactiveDivide).toBe(true);
});

test('compile: !a', () => {
    const expression = compileReactiveExpression('!a');

    expect(expression instanceof ReactiveNot).toBe(true);
});

test('compile: -a', () => {
    const expression = compileReactiveExpression('-a');

    expect(expression instanceof ReactiveNegate).toBe(true);
});