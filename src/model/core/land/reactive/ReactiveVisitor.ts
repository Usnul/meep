// Generated from app/src/lang/Reactive.g4 by ANTLR 4.6-SNAPSHOT


import {ParseTreeVisitor} from "antlr4ts/tree/ParseTreeVisitor";

import {
    AtomicContext,
    AtomicExpressionContext,
    BinaryExpressionAddContext,
    BinaryExpressionAndContext,
    BinaryExpressionDivideContext,
    BinaryExpressionEqualContext,
    BinaryExpressionGreaterThanContext,
    BinaryExpressionGreaterThanOrEqualContext,
    BinaryExpressionLessThanContext,
    BinaryExpressionLessThanOrEqualContext,
    BinaryExpressionMultiplyContext,
    BinaryExpressionNotEqualContext,
    BinaryExpressionOrContext,
    BinaryExpressionSubtractContext,
    BooleanLiteralContext,
    ExpressionContext,
    FloatingLiteralContext,
    GroupExpressionContext,
    IntegerLiteralContext,
    LiteralContext,
    ReferenceContext,
    UnaryExpressionNegateContext,
    UnaryExpressionNotContext
} from "./ReactiveParser";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `ReactiveParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export interface ReactiveVisitor<Result> extends ParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by the `BinaryExpressionDivide`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionDivide?: (ctx: BinaryExpressionDivideContext) => Result;

    /**
     * Visit a parse tree produced by the `UnaryExpressionNot`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitUnaryExpressionNot?: (ctx: UnaryExpressionNotContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionLessThan`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionLessThan?: (ctx: BinaryExpressionLessThanContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionAnd`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionAnd?: (ctx: BinaryExpressionAndContext) => Result;

    /**
     * Visit a parse tree produced by the `Atomic`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAtomic?: (ctx: AtomicContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionGreaterThanOrEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionGreaterThanOrEqual?: (ctx: BinaryExpressionGreaterThanOrEqualContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionOr`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionOr?: (ctx: BinaryExpressionOrContext) => Result;

    /**
     * Visit a parse tree produced by the `GroupExpression`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGroupExpression?: (ctx: GroupExpressionContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionSubtract`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionSubtract?: (ctx: BinaryExpressionSubtractContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionGreaterThan`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionGreaterThan?: (ctx: BinaryExpressionGreaterThanContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionNotEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionNotEqual?: (ctx: BinaryExpressionNotEqualContext) => Result;

    /**
     * Visit a parse tree produced by the `UnaryExpressionNegate`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitUnaryExpressionNegate?: (ctx: UnaryExpressionNegateContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionEqual?: (ctx: BinaryExpressionEqualContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionMultiply`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionMultiply?: (ctx: BinaryExpressionMultiplyContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionLessThanOrEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionLessThanOrEqual?: (ctx: BinaryExpressionLessThanOrEqualContext) => Result;

    /**
     * Visit a parse tree produced by the `BinaryExpressionAdd`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBinaryExpressionAdd?: (ctx: BinaryExpressionAddContext) => Result;

    /**
     * Visit a parse tree produced by `ReactiveParser.expression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExpression?: (ctx: ExpressionContext) => Result;

    /**
     * Visit a parse tree produced by `ReactiveParser.reference`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitReference?: (ctx: ReferenceContext) => Result;

    /**
     * Visit a parse tree produced by `ReactiveParser.atomicExpression`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAtomicExpression?: (ctx: AtomicExpressionContext) => Result;

    /**
     * Visit a parse tree produced by `ReactiveParser.literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLiteral?: (ctx: LiteralContext) => Result;

    /**
     * Visit a parse tree produced by `ReactiveParser.integerLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIntegerLiteral?: (ctx: IntegerLiteralContext) => Result;

    /**
     * Visit a parse tree produced by `ReactiveParser.floatingLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFloatingLiteral?: (ctx: FloatingLiteralContext) => Result;

    /**
     * Visit a parse tree produced by `ReactiveParser.booleanLiteral`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitBooleanLiteral?: (ctx: BooleanLiteralContext) => Result;
}

