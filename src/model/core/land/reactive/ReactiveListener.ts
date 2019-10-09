// Generated from app/src/lang/Reactive.g4 by ANTLR 4.6-SNAPSHOT


import {ParseTreeListener} from "antlr4ts/tree/ParseTreeListener";

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
 * This interface defines a complete listener for a parse tree produced by
 * `ReactiveParser`.
 */
export interface ReactiveListener extends ParseTreeListener {
    /**
     * Enter a parse tree produced by the `BinaryExpressionDivide`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionDivide?: (ctx: BinaryExpressionDivideContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionDivide`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionDivide?: (ctx: BinaryExpressionDivideContext) => void;

    /**
     * Enter a parse tree produced by the `UnaryExpressionNot`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterUnaryExpressionNot?: (ctx: UnaryExpressionNotContext) => void;
    /**
     * Exit a parse tree produced by the `UnaryExpressionNot`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitUnaryExpressionNot?: (ctx: UnaryExpressionNotContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionLessThan`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionLessThan?: (ctx: BinaryExpressionLessThanContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionLessThan`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionLessThan?: (ctx: BinaryExpressionLessThanContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionAnd`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionAnd?: (ctx: BinaryExpressionAndContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionAnd`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionAnd?: (ctx: BinaryExpressionAndContext) => void;

    /**
     * Enter a parse tree produced by the `Atomic`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterAtomic?: (ctx: AtomicContext) => void;
    /**
     * Exit a parse tree produced by the `Atomic`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitAtomic?: (ctx: AtomicContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionGreaterThanOrEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionGreaterThanOrEqual?: (ctx: BinaryExpressionGreaterThanOrEqualContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionGreaterThanOrEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionGreaterThanOrEqual?: (ctx: BinaryExpressionGreaterThanOrEqualContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionOr`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionOr?: (ctx: BinaryExpressionOrContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionOr`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionOr?: (ctx: BinaryExpressionOrContext) => void;

    /**
     * Enter a parse tree produced by the `GroupExpression`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterGroupExpression?: (ctx: GroupExpressionContext) => void;
    /**
     * Exit a parse tree produced by the `GroupExpression`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitGroupExpression?: (ctx: GroupExpressionContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionSubtract`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionSubtract?: (ctx: BinaryExpressionSubtractContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionSubtract`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionSubtract?: (ctx: BinaryExpressionSubtractContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionGreaterThan`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionGreaterThan?: (ctx: BinaryExpressionGreaterThanContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionGreaterThan`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionGreaterThan?: (ctx: BinaryExpressionGreaterThanContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionNotEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionNotEqual?: (ctx: BinaryExpressionNotEqualContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionNotEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionNotEqual?: (ctx: BinaryExpressionNotEqualContext) => void;

    /**
     * Enter a parse tree produced by the `UnaryExpressionNegate`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterUnaryExpressionNegate?: (ctx: UnaryExpressionNegateContext) => void;
    /**
     * Exit a parse tree produced by the `UnaryExpressionNegate`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitUnaryExpressionNegate?: (ctx: UnaryExpressionNegateContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionEqual?: (ctx: BinaryExpressionEqualContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionEqual?: (ctx: BinaryExpressionEqualContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionMultiply`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionMultiply?: (ctx: BinaryExpressionMultiplyContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionMultiply`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionMultiply?: (ctx: BinaryExpressionMultiplyContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionLessThanOrEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionLessThanOrEqual?: (ctx: BinaryExpressionLessThanOrEqualContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionLessThanOrEqual`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionLessThanOrEqual?: (ctx: BinaryExpressionLessThanOrEqualContext) => void;

    /**
     * Enter a parse tree produced by the `BinaryExpressionAdd`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterBinaryExpressionAdd?: (ctx: BinaryExpressionAddContext) => void;
    /**
     * Exit a parse tree produced by the `BinaryExpressionAdd`
     * labeled alternative in `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitBinaryExpressionAdd?: (ctx: BinaryExpressionAddContext) => void;

    /**
     * Enter a parse tree produced by `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    enterExpression?: (ctx: ExpressionContext) => void;
    /**
     * Exit a parse tree produced by `ReactiveParser.expression`.
     * @param ctx the parse tree
     */
    exitExpression?: (ctx: ExpressionContext) => void;

    /**
     * Enter a parse tree produced by `ReactiveParser.reference`.
     * @param ctx the parse tree
     */
    enterReference?: (ctx: ReferenceContext) => void;
    /**
     * Exit a parse tree produced by `ReactiveParser.reference`.
     * @param ctx the parse tree
     */
    exitReference?: (ctx: ReferenceContext) => void;

    /**
     * Enter a parse tree produced by `ReactiveParser.atomicExpression`.
     * @param ctx the parse tree
     */
    enterAtomicExpression?: (ctx: AtomicExpressionContext) => void;
    /**
     * Exit a parse tree produced by `ReactiveParser.atomicExpression`.
     * @param ctx the parse tree
     */
    exitAtomicExpression?: (ctx: AtomicExpressionContext) => void;

    /**
     * Enter a parse tree produced by `ReactiveParser.literal`.
     * @param ctx the parse tree
     */
    enterLiteral?: (ctx: LiteralContext) => void;
    /**
     * Exit a parse tree produced by `ReactiveParser.literal`.
     * @param ctx the parse tree
     */
    exitLiteral?: (ctx: LiteralContext) => void;

    /**
     * Enter a parse tree produced by `ReactiveParser.integerLiteral`.
     * @param ctx the parse tree
     */
    enterIntegerLiteral?: (ctx: IntegerLiteralContext) => void;
    /**
     * Exit a parse tree produced by `ReactiveParser.integerLiteral`.
     * @param ctx the parse tree
     */
    exitIntegerLiteral?: (ctx: IntegerLiteralContext) => void;

    /**
     * Enter a parse tree produced by `ReactiveParser.floatingLiteral`.
     * @param ctx the parse tree
     */
    enterFloatingLiteral?: (ctx: FloatingLiteralContext) => void;
    /**
     * Exit a parse tree produced by `ReactiveParser.floatingLiteral`.
     * @param ctx the parse tree
     */
    exitFloatingLiteral?: (ctx: FloatingLiteralContext) => void;

    /**
     * Enter a parse tree produced by `ReactiveParser.booleanLiteral`.
     * @param ctx the parse tree
     */
    enterBooleanLiteral?: (ctx: BooleanLiteralContext) => void;
    /**
     * Exit a parse tree produced by `ReactiveParser.booleanLiteral`.
     * @param ctx the parse tree
     */
    exitBooleanLiteral?: (ctx: BooleanLiteralContext) => void;
}

