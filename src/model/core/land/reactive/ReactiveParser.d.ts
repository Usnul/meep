import {CommonTokenStream, Parser, ParserRuleContext, Token} from 'antlr4';
import {TerminalNode} from 'antlr4/tree/Tree';


export declare class BinaryExpressionDivideContext extends ParserRuleContext {

    DIVIDE(): TerminalNode;

}

export declare class UnaryExpressionNotContext extends ParserRuleContext {

    NOT(): TerminalNode;

    expression(): ExpressionContext;

}

export declare class BinaryExpressionLessThanContext extends ParserRuleContext {

    LT(): TerminalNode;

}

export declare class BinaryExpressionAndContext extends ParserRuleContext {

    AND(): TerminalNode;

}

export declare class AtomicContext extends ParserRuleContext {

    atomicExpression(): AtomicExpressionContext;

}

export declare class BinaryExpressionGreaterThanOrEqualContext extends ParserRuleContext {

    GTE(): TerminalNode;

}

export declare class BinaryExpressionOrContext extends ParserRuleContext {

    OR(): TerminalNode;

}

export declare class GroupExpressionContext extends ParserRuleContext {

    OPEN_BRACKET(): TerminalNode;

    CLOSED_BRACKET(): TerminalNode;

    expression(): ExpressionContext;

}

export declare class BinaryExpressionSubtractContext extends ParserRuleContext {

    MINUS(): TerminalNode;

}

export declare class BinaryExpressionGreaterThanContext extends ParserRuleContext {

    GT(): TerminalNode;

}

export declare class BinaryExpressionNotEqualContext extends ParserRuleContext {

    NOT_EQUALS(): TerminalNode;

}

export declare class UnaryExpressionNegateContext extends ParserRuleContext {

    MINUS(): TerminalNode;

    expression(): ExpressionContext;

}

export declare class BinaryExpressionEqualContext extends ParserRuleContext {

    EQUALS(): TerminalNode;

}

export declare class BinaryExpressionMultiplyContext extends ParserRuleContext {

    MULTIPLY(): TerminalNode;

}

export declare class BinaryExpressionLessThanOrEqualContext extends ParserRuleContext {

    LTE(): TerminalNode;

}

export declare class BinaryExpressionAddContext extends ParserRuleContext {

    PLUS(): TerminalNode;

}

export declare class ReferenceContext extends ParserRuleContext {

}

export declare class AtomicExpressionContext extends ParserRuleContext {

    literal(): LiteralContext;

    reference(): ReferenceContext;

}

export declare class LiteralContext extends ParserRuleContext {

    integerLiteral(): IntegerLiteralContext;

    floatingLiteral(): FloatingLiteralContext;

    booleanLiteral(): BooleanLiteralContext;

}

export declare class IntegerLiteralContext extends ParserRuleContext {

    NonzeroDigit(): TerminalNode;

    DigitSequence(): TerminalNode;

}

export declare class FloatingLiteralContext extends ParserRuleContext {

    FractionalConstant(): TerminalNode;

    ExponentPart(): TerminalNode;

    DigitSequence(): TerminalNode;

}

export declare class BooleanLiteralContext extends ParserRuleContext {

}

export declare class ExpressionContext extends ParserRuleContext {

}


export declare class ReactiveParser extends Parser {
    readonly ruleNames: string[];
    readonly literalNames: string[];
    readonly symbolicNames: string[];

    constructor(input: CommonTokenStream);

    reference(): ReferenceContext;

    atomicExpression(): AtomicExpressionContext;

    literal(): LiteralContext;

    integerLiteral(): IntegerLiteralContext;

    floatingLiteral(): FloatingLiteralContext;

    booleanLiteral(): BooleanLiteralContext;

}
