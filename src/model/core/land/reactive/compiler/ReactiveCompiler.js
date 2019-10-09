import { ReactiveLexer } from "../ReactiveLexer.js";
import { ReactiveParser } from "../ReactiveParser.js";
import { ReactiveVisitor } from "../ReactiveVisitor.js";
import { ReactiveReference } from "../../../model/reactive/model/terminal/ReactiveReference.js";
import { ReactiveLiteralNumber } from "../../../model/reactive/model/terminal/ReactiveLiteralNumber.js";
import { ReactiveLiteralBoolean } from "../../../model/reactive/model/terminal/ReactiveLiteralBoolean.js";
import { ReactiveNot } from "../../../model/reactive/model/logic/ReactiveNot.js";
import { ReactiveNegate } from "../../../model/reactive/model/arithmetic/ReactiveNegate.js";
import { ReactiveMultiply } from "../../../model/reactive/model/arithmetic/ReactiveMultiply.js";
import { ReactiveDivide } from "../../../model/reactive/model/arithmetic/ReactiveDivide.js";
import { ReactiveAdd } from "../../../model/reactive/model/arithmetic/ReactiveAdd.js";
import { ReactiveSubtract } from "../../../model/reactive/model/arithmetic/ReactiveSubtract.js";
import { ReactiveGreaterThan } from "../../../model/reactive/model/comparative/ReactiveGreaterThan.js";
import { ReactiveLessThan } from "../../../model/reactive/model/comparative/ReactiveLessThan.js";
import { ReactiveGreaterThanOrEqual } from "../../../model/reactive/model/comparative/ReactiveGreaterThanOrEqual.js";
import { ReactiveLessThanOrEqual } from "../../../model/reactive/model/comparative/ReactiveLessThanOrEqual.js";
import { ReactiveEquals } from "../../../model/reactive/model/comparative/ReactiveEquals.js";
import { ReactiveNotEquals } from "../../../model/reactive/model/comparative/ReactiveNotEquals.js";
import { ReactiveAnd } from "../../../model/reactive/model/logic/ReactiveAnd.js";
import { ReactiveOr } from "../../../model/reactive/model/logic/ReactiveOr.js";
import { assert } from "../../../assert.js";
import { ParseTreeVisitor } from "antlr4ts/tree/Tree.js";
import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor.js";
import { ANTLRInputStream } from "antlr4ts/ANTLRInputStream";
import { CommonTokenStream } from "antlr4ts/CommonTokenStream";


class CompilingVisitor extends AbstractParseTreeVisitor {
    constructor() {
        super();
    }

    visit(ctx) {
        return super.visit(ctx);
    }

    visitFirstChild(ctx) {
        return this.visit(ctx.children[0]);
    }

// Visit a parse tree produced by ReactiveParser#groupExpression.
    visitGroupExpression(ctx) {
        return this.visit(ctx._exp);
    };

    /**
     *
     * @param {ParserRuleContext} ctx
     * @returns {ReactiveExpression}
     */
    visitAtomic(ctx) {
        const children = ctx.children;
        const child = children[0];
        return this.visitAtomicExpression(child);
    };

    /**
     *
     * @param ctx
     * @returns {ReactiveNot}
     */
    visitUnaryExpressionNot(ctx) {
        const result = new ReactiveNot();

        this._buildUnaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveNegate}
     */
    visitUnaryExpressionNegate(ctx) {
        const result = new ReactiveNegate();

        this._buildUnaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param {RuleContext} ctx
     * @param {ReactiveUnaryExpression} node
     * @private
     */
    _buildUnaryExpression(ctx, node) {
        const exp = ctx._exp;

        const source = this.visit(exp);


        node.connect(source);

    }

    /**
     *
     * @param {RuleContext} ctx
     * @param {ReactiveBinaryExpression} node
     * @private
     */
    _buildBinaryExpression(ctx, node) {
        const left = this.visit(ctx._left);
        const right = this.visit(ctx._right);


        node.connect(left, right);
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveMultiply}
     */
    visitBinaryExpressionMultiply(ctx) {
        const result = new ReactiveMultiply();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveDivide}
     */
    visitBinaryExpressionDivide(ctx) {
        const result = new ReactiveDivide();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveAdd}
     */
    visitBinaryExpressionAdd(ctx) {
        const result = new ReactiveAdd();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveSubtract}
     */
    visitBinaryExpressionSubtract(ctx) {
        const result = new ReactiveSubtract();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveGreaterThan}
     */
    visitBinaryExpressionGreaterThan(ctx) {
        const result = new ReactiveGreaterThan();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveLessThan}
     */
    visitBinaryExpressionLessThan(ctx) {
        const result = new ReactiveLessThan();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveGreaterThanOrEqual}
     */
    visitBinaryExpressionGreaterThanOrEqual(ctx) {
        const result = new ReactiveGreaterThanOrEqual();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveLessThanOrEqual}
     */
    visitBinaryExpressionLessThanOrEqual(ctx) {
        const result = new ReactiveLessThanOrEqual();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveEquals}
     */
    visitBinaryExpressionEqual(ctx) {
        const result = new ReactiveEquals();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveNotEquals}
     */
    visitBinaryExpressionNotEqual(ctx) {
        const result = new ReactiveNotEquals();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveAnd}
     */
    visitBinaryExpressionAnd(ctx) {
        const result = new ReactiveAnd();

        this._buildBinaryExpression(ctx, result);

        return result;
    }

    /**
     *
     * @param ctx
     * @returns {ReactiveOr}
     */
    visitBinaryExpressionOr(ctx) {
        const result = new ReactiveOr();

        this._buildBinaryExpression(ctx, result);

        return result;
    }


// Visit a parse tree produced by ReactiveParser#reference.
    visitReference(ctx) {
        const text = ctx.text;
        return new ReactiveReference(text);
    }


// Visit a parse tree produced by ReactiveParser#atomicExpression.
    /**
     *
     * @param ctx
     * @returns {ReactiveExpression}
     */
    visitAtomicExpression(ctx) {
        return this.visitFirstChild(ctx);
    }


// Visit a parse tree produced by ReactiveParser#literal.
    visitLiteral(ctx) {
        return this.visitFirstChild(ctx);
    }


// Visit a parse tree produced by ReactiveParser#integerLiteral.
    visitIntegerLiteral(ctx) {
        const text = ctx.text;
        const value = parseInt(text, 10);
        return new ReactiveLiteralNumber(value);
    }


// Visit a parse tree produced by ReactiveParser#floatingLiteral.
    visitFloatingLiteral(ctx) {
        const text = ctx.text;
        const value = parseFloat(text);
        return new ReactiveLiteralNumber(value);
    }


// Visit a parse tree produced by ReactiveParser#booleanLiteral.
    visitBooleanLiteral(ctx) {
        const text = ctx.text;
        const value = text === 'true';
        return new ReactiveLiteralBoolean(value);
    };

}

/**
 *
 * @param {string} code
 * @returns {ReactiveExpression}
 */
export function compileReactiveExpression(code) {
    assert.typeOf(code, 'string', 'code');

    const chars = new ANTLRInputStream(code);

    // break the character string input into tokens
    const lexer = new ReactiveLexer(chars);

    // create a token stream
    const tokens = new CommonTokenStream(lexer);

    // Initialize parser with a token stream
    const parser = new ReactiveParser(tokens);

    // Request parse tree to be built
    parser.buildParseTrees = true;

    // Build a parse tree from 'expression' rule
    const tree = parser.expression();

    // Initialize compiler visitor
    const visitor = new CompilingVisitor();

    // Compile CST
    const node = visitor.visit(tree);

    return node;
}

