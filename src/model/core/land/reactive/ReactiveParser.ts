// Generated from app/src/lang/Reactive.g4 by ANTLR 4.6-SNAPSHOT


import {ATN} from "antlr4ts/atn/ATN";
import {ATNDeserializer} from "antlr4ts/atn/ATNDeserializer";
import {FailedPredicateException} from "antlr4ts/FailedPredicateException";
import {NotNull, Override} from "antlr4ts/Decorators";
import {NoViableAltException} from "antlr4ts/NoViableAltException";
import {Parser} from "antlr4ts/Parser";
import {ParserRuleContext} from "antlr4ts/ParserRuleContext";
import {ParserATNSimulator} from "antlr4ts/atn/ParserATNSimulator";
import {ParseTreeListener} from "antlr4ts/tree/ParseTreeListener";
import {ParseTreeVisitor} from "antlr4ts/tree/ParseTreeVisitor";
import {RecognitionException} from "antlr4ts/RecognitionException";
import {RuleContext} from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import {TerminalNode} from "antlr4ts/tree/TerminalNode";
import {Token} from "antlr4ts/Token";
import {TokenStream} from "antlr4ts/TokenStream";
import {Vocabulary} from "antlr4ts/Vocabulary";
import {VocabularyImpl} from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import {ReactiveListener} from "./ReactiveListener";
import {ReactiveVisitor} from "./ReactiveVisitor";


export class ReactiveParser extends Parser {
    public static readonly T__0 = 1;
    public static readonly T__1 = 2;
    public static readonly T__2 = 3;
    public static readonly Identifier = 4;
    public static readonly NonzeroDigit = 5;
    public static readonly DigitSequence = 6;
    public static readonly FractionalConstant = 7;
    public static readonly ExponentPart = 8;
    public static readonly PLUS = 9;
    public static readonly MINUS = 10;
    public static readonly MULTIPLY = 11;
    public static readonly DIVIDE = 12;
    public static readonly NOT = 13;
    public static readonly GT = 14;
    public static readonly GTE = 15;
    public static readonly LT = 16;
    public static readonly LTE = 17;
    public static readonly EQUALS = 18;
    public static readonly NOT_EQUALS = 19;
    public static readonly AND = 20;
    public static readonly OR = 21;
    public static readonly DOT = 22;
    public static readonly OPEN_BRACKET = 23;
    public static readonly CLOSED_BRACKET = 24;
    public static readonly Whitespace = 25;
    public static readonly RULE_expression = 0;
    public static readonly RULE_reference = 1;
    public static readonly RULE_atomicExpression = 2;
    public static readonly RULE_literal = 3;
    public static readonly RULE_integerLiteral = 4;
    public static readonly RULE_floatingLiteral = 5;
    public static readonly RULE_booleanLiteral = 6;
    // tslint:disable:no-trailing-whitespace
    public static readonly ruleNames: string[] = [
        "expression", "reference", "atomicExpression", "literal", "integerLiteral",
        "floatingLiteral", "booleanLiteral",
    ];

    private static readonly _LITERAL_NAMES: Array<string | undefined> = [
        undefined, "'0'", "'true'", "'false'", undefined, undefined, undefined,
        undefined, undefined, "'+'", "'-'", "'*'", "'/'", "'!'", "'>'", "'>='",
        "'<'", "'<='", "'=='", "'!='", "'&&'", "'||'", "'.'", "'('", "')'",
    ];
    private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
        undefined, undefined, undefined, undefined, "Identifier", "NonzeroDigit",
        "DigitSequence", "FractionalConstant", "ExponentPart", "PLUS", "MINUS",
        "MULTIPLY", "DIVIDE", "NOT", "GT", "GTE", "LT", "LTE", "EQUALS", "NOT_EQUALS",
        "AND", "OR", "DOT", "OPEN_BRACKET", "CLOSED_BRACKET", "Whitespace",
    ];
    public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(ReactiveParser._LITERAL_NAMES, ReactiveParser._SYMBOLIC_NAMES, []);

    // @Override
    // @NotNull
    public get vocabulary(): Vocabulary {
        return ReactiveParser.VOCABULARY;
    }

    // tslint:enable:no-trailing-whitespace

    // @Override
    public get grammarFileName(): string {
        return "Reactive.g4";
    }

    // @Override
    public get ruleNames(): string[] {
        return ReactiveParser.ruleNames;
    }

    // @Override
    public get serializedATN(): string {
        return ReactiveParser._serializedATN;
    }

    constructor(input: TokenStream) {
        super(input);
        this._interp = new ParserATNSimulator(ReactiveParser._ATN, this);
    }

    public expression(): ExpressionContext;
    public expression(_p: number): ExpressionContext;
    // @RuleVersion(0)
    public expression(_p?: number): ExpressionContext {
        if (_p === undefined) {
            _p = 0;
        }

        let _parentctx: ParserRuleContext = this._ctx;
        let _parentState: number = this.state;
        let _localctx: ExpressionContext = new ExpressionContext(this._ctx, _parentState);
        let _prevctx: ExpressionContext = _localctx;
        let _startState: number = 0;
        this.enterRecursionRule(_localctx, 0, ReactiveParser.RULE_expression, _p);
        try {
            let _alt: number;
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 24;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                    case ReactiveParser.T__0:
                    case ReactiveParser.T__1:
                    case ReactiveParser.T__2:
                    case ReactiveParser.Identifier:
                    case ReactiveParser.NonzeroDigit:
                    case ReactiveParser.DigitSequence:
                    case ReactiveParser.FractionalConstant: {
                        _localctx = new AtomicContext(_localctx);
                        this._ctx = _localctx;
                        _prevctx = _localctx;

                        this.state = 15;
                        this.atomicExpression();
                    }
                        break;
                    case ReactiveParser.OPEN_BRACKET: {
                        _localctx = new GroupExpressionContext(_localctx);
                        this._ctx = _localctx;
                        _prevctx = _localctx;
                        this.state = 16;
                        this.match(ReactiveParser.OPEN_BRACKET);
                        this.state = 17;
                        (_localctx as GroupExpressionContext)._exp = this.expression(0);
                        this.state = 18;
                        this.match(ReactiveParser.CLOSED_BRACKET);
                    }
                        break;
                    case ReactiveParser.NOT: {
                        _localctx = new UnaryExpressionNotContext(_localctx);
                        this._ctx = _localctx;
                        _prevctx = _localctx;
                        this.state = 20;
                        this.match(ReactiveParser.NOT);
                        this.state = 21;
                        (_localctx as UnaryExpressionNotContext)._exp = this.expression(14);
                    }
                        break;
                    case ReactiveParser.MINUS: {
                        _localctx = new UnaryExpressionNegateContext(_localctx);
                        this._ctx = _localctx;
                        _prevctx = _localctx;
                        this.state = 22;
                        this.match(ReactiveParser.MINUS);
                        this.state = 23;
                        (_localctx as UnaryExpressionNegateContext)._exp = this.expression(13);
                    }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this._ctx._stop = this._input.tryLT(-1);
                this.state = 64;
                this._errHandler.sync(this);
                _alt = this.interpreter.adaptivePredict(this._input, 2, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        if (this._parseListeners != null) {
                            this.triggerExitRuleEvent();
                        }
                        _prevctx = _localctx;
                        {
                            this.state = 62;
                            this._errHandler.sync(this);
                            switch (this.interpreter.adaptivePredict(this._input, 1, this._ctx)) {
                                case 1: {
                                    _localctx = new BinaryExpressionMultiplyContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionMultiplyContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 26;
                                    if (!(this.precpred(this._ctx, 12))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 12)");
                                    }
                                    this.state = 27;
                                    this.match(ReactiveParser.MULTIPLY);
                                    this.state = 28;
                                    (_localctx as BinaryExpressionMultiplyContext)._right = this.expression(13);
                                }
                                    break;

                                case 2: {
                                    _localctx = new BinaryExpressionDivideContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionDivideContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 29;
                                    if (!(this.precpred(this._ctx, 11))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 11)");
                                    }
                                    this.state = 30;
                                    this.match(ReactiveParser.DIVIDE);
                                    this.state = 31;
                                    (_localctx as BinaryExpressionDivideContext)._right = this.expression(12);
                                }
                                    break;

                                case 3: {
                                    _localctx = new BinaryExpressionAddContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionAddContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 32;
                                    if (!(this.precpred(this._ctx, 10))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 10)");
                                    }
                                    this.state = 33;
                                    this.match(ReactiveParser.PLUS);
                                    this.state = 34;
                                    (_localctx as BinaryExpressionAddContext)._right = this.expression(11);
                                }
                                    break;

                                case 4: {
                                    _localctx = new BinaryExpressionSubtractContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionSubtractContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 35;
                                    if (!(this.precpred(this._ctx, 9))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 9)");
                                    }
                                    this.state = 36;
                                    this.match(ReactiveParser.MINUS);
                                    this.state = 37;
                                    (_localctx as BinaryExpressionSubtractContext)._right = this.expression(10);
                                }
                                    break;

                                case 5: {
                                    _localctx = new BinaryExpressionGreaterThanContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionGreaterThanContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 38;
                                    if (!(this.precpred(this._ctx, 8))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 8)");
                                    }
                                    this.state = 39;
                                    this.match(ReactiveParser.GT);
                                    this.state = 40;
                                    (_localctx as BinaryExpressionGreaterThanContext)._right = this.expression(9);
                                }
                                    break;

                                case 6: {
                                    _localctx = new BinaryExpressionLessThanContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionLessThanContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 41;
                                    if (!(this.precpred(this._ctx, 7))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 7)");
                                    }
                                    this.state = 42;
                                    this.match(ReactiveParser.LT);
                                    this.state = 43;
                                    (_localctx as BinaryExpressionLessThanContext)._right = this.expression(8);
                                }
                                    break;

                                case 7: {
                                    _localctx = new BinaryExpressionGreaterThanOrEqualContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionGreaterThanOrEqualContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 44;
                                    if (!(this.precpred(this._ctx, 6))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 6)");
                                    }
                                    this.state = 45;
                                    this.match(ReactiveParser.GTE);
                                    this.state = 46;
                                    (_localctx as BinaryExpressionGreaterThanOrEqualContext)._right = this.expression(7);
                                }
                                    break;

                                case 8: {
                                    _localctx = new BinaryExpressionLessThanOrEqualContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionLessThanOrEqualContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 47;
                                    if (!(this.precpred(this._ctx, 5))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 5)");
                                    }
                                    this.state = 48;
                                    this.match(ReactiveParser.LTE);
                                    this.state = 49;
                                    (_localctx as BinaryExpressionLessThanOrEqualContext)._right = this.expression(6);
                                }
                                    break;

                                case 9: {
                                    _localctx = new BinaryExpressionEqualContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionEqualContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 50;
                                    if (!(this.precpred(this._ctx, 4))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 4)");
                                    }
                                    this.state = 51;
                                    this.match(ReactiveParser.EQUALS);
                                    this.state = 52;
                                    (_localctx as BinaryExpressionEqualContext)._right = this.expression(5);
                                }
                                    break;

                                case 10: {
                                    _localctx = new BinaryExpressionNotEqualContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionNotEqualContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 53;
                                    if (!(this.precpred(this._ctx, 3))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 3)");
                                    }
                                    this.state = 54;
                                    this.match(ReactiveParser.NOT_EQUALS);
                                    this.state = 55;
                                    (_localctx as BinaryExpressionNotEqualContext)._right = this.expression(4);
                                }
                                    break;

                                case 11: {
                                    _localctx = new BinaryExpressionAndContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionAndContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 56;
                                    if (!(this.precpred(this._ctx, 2))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 2)");
                                    }
                                    this.state = 57;
                                    this.match(ReactiveParser.AND);
                                    this.state = 58;
                                    (_localctx as BinaryExpressionAndContext)._right = this.expression(3);
                                }
                                    break;

                                case 12: {
                                    _localctx = new BinaryExpressionOrContext(new ExpressionContext(_parentctx, _parentState));
                                    (_localctx as BinaryExpressionOrContext)._left = _prevctx;
                                    this.pushNewRecursionContext(_localctx, _startState, ReactiveParser.RULE_expression);
                                    this.state = 59;
                                    if (!(this.precpred(this._ctx, 1))) {
                                        throw new FailedPredicateException(this, "this.precpred(this._ctx, 1)");
                                    }
                                    this.state = 60;
                                    this.match(ReactiveParser.OR);
                                    this.state = 61;
                                    (_localctx as BinaryExpressionOrContext)._right = this.expression(2);
                                }
                                    break;
                            }
                        }
                    }
                    this.state = 66;
                    this._errHandler.sync(this);
                    _alt = this.interpreter.adaptivePredict(this._input, 2, this._ctx);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.unrollRecursionContexts(_parentctx);
        }
        return _localctx;
    }

    // @RuleVersion(0)
    public reference(): ReferenceContext {
        let _localctx: ReferenceContext = new ReferenceContext(this._ctx, this.state);
        this.enterRule(_localctx, 2, ReactiveParser.RULE_reference);
        try {
            let _alt: number;
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 67;
                this.match(ReactiveParser.Identifier);
                this.state = 72;
                this._errHandler.sync(this);
                _alt = this.interpreter.adaptivePredict(this._input, 3, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 68;
                                this.match(ReactiveParser.DOT);
                                this.state = 69;
                                this.match(ReactiveParser.Identifier);
                            }
                        }
                    }
                    this.state = 74;
                    this._errHandler.sync(this);
                    _alt = this.interpreter.adaptivePredict(this._input, 3, this._ctx);
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return _localctx;
    }

    // @RuleVersion(0)
    public atomicExpression(): AtomicExpressionContext {
        let _localctx: AtomicExpressionContext = new AtomicExpressionContext(this._ctx, this.state);
        this.enterRule(_localctx, 4, ReactiveParser.RULE_atomicExpression);
        try {
            this.state = 77;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case ReactiveParser.T__0:
                case ReactiveParser.T__1:
                case ReactiveParser.T__2:
                case ReactiveParser.NonzeroDigit:
                case ReactiveParser.DigitSequence:
                case ReactiveParser.FractionalConstant:
                    this.enterOuterAlt(_localctx, 1);
                {
                    this.state = 75;
                    this.literal();
                }
                    break;
                case ReactiveParser.Identifier:
                    this.enterOuterAlt(_localctx, 2);
                {
                    this.state = 76;
                    this.reference();
                }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return _localctx;
    }

    // @RuleVersion(0)
    public literal(): LiteralContext {
        let _localctx: LiteralContext = new LiteralContext(this._ctx, this.state);
        this.enterRule(_localctx, 6, ReactiveParser.RULE_literal);
        try {
            this.state = 82;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case ReactiveParser.T__0:
                case ReactiveParser.NonzeroDigit:
                    this.enterOuterAlt(_localctx, 1);
                {
                    this.state = 79;
                    this.integerLiteral();
                }
                    break;
                case ReactiveParser.DigitSequence:
                case ReactiveParser.FractionalConstant:
                    this.enterOuterAlt(_localctx, 2);
                {
                    this.state = 80;
                    this.floatingLiteral();
                }
                    break;
                case ReactiveParser.T__1:
                case ReactiveParser.T__2:
                    this.enterOuterAlt(_localctx, 3);
                {
                    this.state = 81;
                    this.booleanLiteral();
                }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return _localctx;
    }

    // @RuleVersion(0)
    public integerLiteral(): IntegerLiteralContext {
        let _localctx: IntegerLiteralContext = new IntegerLiteralContext(this._ctx, this.state);
        this.enterRule(_localctx, 8, ReactiveParser.RULE_integerLiteral);
        try {
            this.state = 89;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case ReactiveParser.T__0:
                    this.enterOuterAlt(_localctx, 1);
                {
                    this.state = 84;
                    this.match(ReactiveParser.T__0);
                }
                    break;
                case ReactiveParser.NonzeroDigit:
                    this.enterOuterAlt(_localctx, 2);
                {
                    {
                        this.state = 85;
                        this.match(ReactiveParser.NonzeroDigit);
                        this.state = 87;
                        this._errHandler.sync(this);
                        switch (this.interpreter.adaptivePredict(this._input, 6, this._ctx)) {
                            case 1: {
                                this.state = 86;
                                this.match(ReactiveParser.DigitSequence);
                            }
                                break;
                        }
                    }
                }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return _localctx;
    }

    // @RuleVersion(0)
    public floatingLiteral(): FloatingLiteralContext {
        let _localctx: FloatingLiteralContext = new FloatingLiteralContext(this._ctx, this.state);
        this.enterRule(_localctx, 10, ReactiveParser.RULE_floatingLiteral);
        try {
            this.state = 97;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case ReactiveParser.FractionalConstant:
                    this.enterOuterAlt(_localctx, 1);
                {
                    this.state = 91;
                    this.match(ReactiveParser.FractionalConstant);
                    this.state = 93;
                    this._errHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this._input, 8, this._ctx)) {
                        case 1: {
                            this.state = 92;
                            this.match(ReactiveParser.ExponentPart);
                        }
                            break;
                    }
                }
                    break;
                case ReactiveParser.DigitSequence:
                    this.enterOuterAlt(_localctx, 2);
                {
                    this.state = 95;
                    this.match(ReactiveParser.DigitSequence);
                    this.state = 96;
                    this.match(ReactiveParser.ExponentPart);
                }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return _localctx;
    }

    // @RuleVersion(0)
    public booleanLiteral(): BooleanLiteralContext {
        let _localctx: BooleanLiteralContext = new BooleanLiteralContext(this._ctx, this.state);
        this.enterRule(_localctx, 12, ReactiveParser.RULE_booleanLiteral);
        let _la: number;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 99;
                _la = this._input.LA(1);
                if (!(_la === ReactiveParser.T__1 || _la === ReactiveParser.T__2)) {
                    this._errHandler.recoverInline(this);
                } else {
                    if (this._input.LA(1) === Token.EOF) {
                        this.matchedEOF = true;
                    }

                    this._errHandler.reportMatch(this);
                    this.consume();
                }
            }
        } catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            } else {
                throw re;
            }
        } finally {
            this.exitRule();
        }
        return _localctx;
    }

    public sempred(_localctx: RuleContext, ruleIndex: number, predIndex: number): boolean {
        switch (ruleIndex) {
            case 0:
                return this.expression_sempred(_localctx as ExpressionContext, predIndex);
        }
        return true;
    }

    private expression_sempred(_localctx: ExpressionContext, predIndex: number): boolean {
        switch (predIndex) {
            case 0:
                return this.precpred(this._ctx, 12);

            case 1:
                return this.precpred(this._ctx, 11);

            case 2:
                return this.precpred(this._ctx, 10);

            case 3:
                return this.precpred(this._ctx, 9);

            case 4:
                return this.precpred(this._ctx, 8);

            case 5:
                return this.precpred(this._ctx, 7);

            case 6:
                return this.precpred(this._ctx, 6);

            case 7:
                return this.precpred(this._ctx, 5);

            case 8:
                return this.precpred(this._ctx, 4);

            case 9:
                return this.precpred(this._ctx, 3);

            case 10:
                return this.precpred(this._ctx, 2);

            case 11:
                return this.precpred(this._ctx, 1);
        }
        return true;
    }

    public static readonly _serializedATN: string =
        "\x03\uAF6F\u8320\u479D\uB75C\u4880\u1605\u191C\uAB37\x03\x1Bh\x04\x02" +
        "\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
        "\t\x07\x04\b\t\b\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02" +
        "\x03\x02\x03\x02\x03\x02\x05\x02\x1B\n\x02\x03\x02\x03\x02\x03\x02\x03" +
        "\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03" +
        "\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03" +
        "\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03" +
        "\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x07\x02A\n\x02\f\x02\x0E" +
        "\x02D\v\x02\x03\x03\x03\x03\x03\x03\x07\x03I\n\x03\f\x03\x0E\x03L\v\x03" +
        "\x03\x04\x03\x04\x05\x04P\n\x04\x03\x05\x03\x05\x03\x05\x05\x05U\n\x05" +
        "\x03\x06\x03\x06\x03\x06\x05\x06Z\n\x06\x05\x06\\\n\x06\x03\x07\x03\x07" +
        "\x05\x07`\n\x07\x03\x07\x03\x07\x05\x07d\n\x07\x03\b\x03\b\x03\b\x02\x02" +
        "\x03\x02\t\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f\x02\x0E\x02\x02\x03\x03" +
        "\x02\x04\x05w\x02\x1A\x03\x02\x02\x02\x04E\x03\x02\x02\x02\x06O\x03\x02" +
        "\x02\x02\bT\x03\x02\x02\x02\n[\x03\x02\x02\x02\fc\x03\x02\x02\x02\x0E" +
        "e\x03\x02\x02\x02\x10\x11\b\x02\x01\x02\x11\x1B\x05\x06\x04\x02\x12\x13" +
        "\x07\x19\x02\x02\x13\x14\x05\x02\x02\x02\x14\x15\x07\x1A\x02\x02\x15\x1B" +
        "\x03\x02\x02\x02\x16\x17\x07\x0F\x02\x02\x17\x1B\x05\x02\x02\x10\x18\x19" +
        "\x07\f\x02\x02\x19\x1B\x05\x02\x02\x0F\x1A\x10\x03\x02\x02\x02\x1A\x12" +
        "\x03\x02\x02\x02\x1A\x16\x03\x02\x02\x02\x1A\x18\x03\x02\x02\x02\x1BB" +
        "\x03\x02\x02\x02\x1C\x1D\f\x0E\x02\x02\x1D\x1E\x07\r\x02\x02\x1EA\x05" +
        "\x02\x02\x0F\x1F \f\r\x02\x02 !\x07\x0E\x02\x02!A\x05\x02\x02\x0E\"#\f" +
        "\f\x02\x02#$\x07\v\x02\x02$A\x05\x02\x02\r%&\f\v\x02\x02&\'\x07\f\x02" +
        "\x02\'A\x05\x02\x02\f()\f\n\x02\x02)*\x07\x10\x02\x02*A\x05\x02\x02\v" +
        "+,\f\t\x02\x02,-\x07\x12\x02\x02-A\x05\x02\x02\n./\f\b\x02\x02/0\x07\x11" +
        "\x02\x020A\x05\x02\x02\t12\f\x07\x02\x0223\x07\x13\x02\x023A\x05\x02\x02" +
        "\b45\f\x06\x02\x0256\x07\x14\x02\x026A\x05\x02\x02\x0778\f\x05\x02\x02" +
        "89\x07\x15\x02\x029A\x05\x02\x02\x06:;\f\x04\x02\x02;<\x07\x16\x02\x02" +
        "<A\x05\x02\x02\x05=>\f\x03\x02\x02>?\x07\x17\x02\x02?A\x05\x02\x02\x04" +
        "@\x1C\x03\x02\x02\x02@\x1F\x03\x02\x02\x02@\"\x03\x02\x02\x02@%\x03\x02" +
        "\x02\x02@(\x03\x02\x02\x02@+\x03\x02\x02\x02@.\x03\x02\x02\x02@1\x03\x02" +
        "\x02\x02@4\x03\x02\x02\x02@7\x03\x02\x02\x02@:\x03\x02\x02\x02@=\x03\x02" +
        "\x02\x02AD\x03\x02\x02\x02B@\x03\x02\x02\x02BC\x03\x02\x02\x02C\x03\x03" +
        "\x02\x02\x02DB\x03\x02\x02\x02EJ\x07\x06\x02\x02FG\x07\x18\x02\x02GI\x07" +
        "\x06\x02\x02HF\x03\x02\x02\x02IL\x03\x02\x02\x02JH\x03\x02\x02\x02JK\x03" +
        "\x02\x02\x02K\x05\x03\x02\x02\x02LJ\x03\x02\x02\x02MP\x05\b\x05\x02NP" +
        "\x05\x04\x03\x02OM\x03\x02\x02\x02ON\x03\x02\x02\x02P\x07\x03\x02\x02" +
        "\x02QU\x05\n\x06\x02RU\x05\f\x07\x02SU\x05\x0E\b\x02TQ\x03\x02\x02\x02" +
        "TR\x03\x02\x02\x02TS\x03\x02\x02\x02U\t\x03\x02\x02\x02V\\\x07\x03\x02" +
        "\x02WY\x07\x07\x02\x02XZ\x07\b\x02\x02YX\x03\x02\x02\x02YZ\x03\x02\x02" +
        "\x02Z\\\x03\x02\x02\x02[V\x03\x02\x02\x02[W\x03\x02\x02\x02\\\v\x03\x02" +
        "\x02\x02]_\x07\t\x02\x02^`\x07\n\x02\x02_^\x03\x02\x02\x02_`\x03\x02\x02" +
        "\x02`d\x03\x02\x02\x02ab\x07\b\x02\x02bd\x07\n\x02\x02c]\x03\x02\x02\x02" +
        "ca\x03\x02\x02\x02d\r\x03\x02\x02\x02ef\t\x02\x02\x02f\x0F\x03\x02\x02" +
        "\x02\f\x1A@BJOTY[_c";
    public static __ATN: ATN;
    public static get _ATN(): ATN {
        if (!ReactiveParser.__ATN) {
            ReactiveParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(ReactiveParser._serializedATN));
        }

        return ReactiveParser.__ATN;
    }

}

export class ExpressionContext extends ParserRuleContext {
    constructor(parent: ParserRuleContext | undefined, invokingState: number) {
        super(parent, invokingState);
    }

    // @Override
    public get ruleIndex(): number {
        return ReactiveParser.RULE_expression;
    }

    public copyFrom(ctx: ExpressionContext): void {
        super.copyFrom(ctx);
    }
}

export class BinaryExpressionDivideContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public DIVIDE(): TerminalNode {
        return this.getToken(ReactiveParser.DIVIDE, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionDivide) {
            listener.enterBinaryExpressionDivide(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionDivide) {
            listener.exitBinaryExpressionDivide(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionDivide) {
            return visitor.visitBinaryExpressionDivide(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class UnaryExpressionNotContext extends ExpressionContext {
    public _exp: ExpressionContext;

    public NOT(): TerminalNode {
        return this.getToken(ReactiveParser.NOT, 0);
    }

    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext);
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterUnaryExpressionNot) {
            listener.enterUnaryExpressionNot(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitUnaryExpressionNot) {
            listener.exitUnaryExpressionNot(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitUnaryExpressionNot) {
            return visitor.visitUnaryExpressionNot(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionLessThanContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public LT(): TerminalNode {
        return this.getToken(ReactiveParser.LT, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionLessThan) {
            listener.enterBinaryExpressionLessThan(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionLessThan) {
            listener.exitBinaryExpressionLessThan(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionLessThan) {
            return visitor.visitBinaryExpressionLessThan(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionAndContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public AND(): TerminalNode {
        return this.getToken(ReactiveParser.AND, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionAnd) {
            listener.enterBinaryExpressionAnd(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionAnd) {
            listener.exitBinaryExpressionAnd(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionAnd) {
            return visitor.visitBinaryExpressionAnd(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class AtomicContext extends ExpressionContext {
    public atomicExpression(): AtomicExpressionContext {
        return this.getRuleContext(0, AtomicExpressionContext);
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterAtomic) {
            listener.enterAtomic(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitAtomic) {
            listener.exitAtomic(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitAtomic) {
            return visitor.visitAtomic(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionGreaterThanOrEqualContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public GTE(): TerminalNode {
        return this.getToken(ReactiveParser.GTE, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionGreaterThanOrEqual) {
            listener.enterBinaryExpressionGreaterThanOrEqual(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionGreaterThanOrEqual) {
            listener.exitBinaryExpressionGreaterThanOrEqual(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionGreaterThanOrEqual) {
            return visitor.visitBinaryExpressionGreaterThanOrEqual(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionOrContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public OR(): TerminalNode {
        return this.getToken(ReactiveParser.OR, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionOr) {
            listener.enterBinaryExpressionOr(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionOr) {
            listener.exitBinaryExpressionOr(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionOr) {
            return visitor.visitBinaryExpressionOr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class GroupExpressionContext extends ExpressionContext {
    public _exp: ExpressionContext;

    public OPEN_BRACKET(): TerminalNode {
        return this.getToken(ReactiveParser.OPEN_BRACKET, 0);
    }

    public CLOSED_BRACKET(): TerminalNode {
        return this.getToken(ReactiveParser.CLOSED_BRACKET, 0);
    }

    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext);
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterGroupExpression) {
            listener.enterGroupExpression(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitGroupExpression) {
            listener.exitGroupExpression(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitGroupExpression) {
            return visitor.visitGroupExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionSubtractContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public MINUS(): TerminalNode {
        return this.getToken(ReactiveParser.MINUS, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionSubtract) {
            listener.enterBinaryExpressionSubtract(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionSubtract) {
            listener.exitBinaryExpressionSubtract(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionSubtract) {
            return visitor.visitBinaryExpressionSubtract(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionGreaterThanContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public GT(): TerminalNode {
        return this.getToken(ReactiveParser.GT, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionGreaterThan) {
            listener.enterBinaryExpressionGreaterThan(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionGreaterThan) {
            listener.exitBinaryExpressionGreaterThan(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionGreaterThan) {
            return visitor.visitBinaryExpressionGreaterThan(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionNotEqualContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public NOT_EQUALS(): TerminalNode {
        return this.getToken(ReactiveParser.NOT_EQUALS, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionNotEqual) {
            listener.enterBinaryExpressionNotEqual(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionNotEqual) {
            listener.exitBinaryExpressionNotEqual(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionNotEqual) {
            return visitor.visitBinaryExpressionNotEqual(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class UnaryExpressionNegateContext extends ExpressionContext {
    public _exp: ExpressionContext;

    public MINUS(): TerminalNode {
        return this.getToken(ReactiveParser.MINUS, 0);
    }

    public expression(): ExpressionContext {
        return this.getRuleContext(0, ExpressionContext);
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterUnaryExpressionNegate) {
            listener.enterUnaryExpressionNegate(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitUnaryExpressionNegate) {
            listener.exitUnaryExpressionNegate(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitUnaryExpressionNegate) {
            return visitor.visitUnaryExpressionNegate(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionEqualContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public EQUALS(): TerminalNode {
        return this.getToken(ReactiveParser.EQUALS, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionEqual) {
            listener.enterBinaryExpressionEqual(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionEqual) {
            listener.exitBinaryExpressionEqual(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionEqual) {
            return visitor.visitBinaryExpressionEqual(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionMultiplyContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public MULTIPLY(): TerminalNode {
        return this.getToken(ReactiveParser.MULTIPLY, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionMultiply) {
            listener.enterBinaryExpressionMultiply(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionMultiply) {
            listener.exitBinaryExpressionMultiply(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionMultiply) {
            return visitor.visitBinaryExpressionMultiply(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionLessThanOrEqualContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public LTE(): TerminalNode {
        return this.getToken(ReactiveParser.LTE, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionLessThanOrEqual) {
            listener.enterBinaryExpressionLessThanOrEqual(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionLessThanOrEqual) {
            listener.exitBinaryExpressionLessThanOrEqual(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionLessThanOrEqual) {
            return visitor.visitBinaryExpressionLessThanOrEqual(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}

export class BinaryExpressionAddContext extends ExpressionContext {
    public _left: ExpressionContext;
    public _right: ExpressionContext;

    public PLUS(): TerminalNode {
        return this.getToken(ReactiveParser.PLUS, 0);
    }

    public expression(): ExpressionContext[];
    public expression(i: number): ExpressionContext;
    public expression(i?: number): ExpressionContext | ExpressionContext[] {
        if (i === undefined) {
            return this.getRuleContexts(ExpressionContext);
        } else {
            return this.getRuleContext(i, ExpressionContext);
        }
    }

    constructor(ctx: ExpressionContext) {
        super(ctx.parent, ctx.invokingState);
        this.copyFrom(ctx);
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBinaryExpressionAdd) {
            listener.enterBinaryExpressionAdd(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBinaryExpressionAdd) {
            listener.exitBinaryExpressionAdd(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBinaryExpressionAdd) {
            return visitor.visitBinaryExpressionAdd(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class ReferenceContext extends ParserRuleContext {
    public Identifier(): TerminalNode[];
    public Identifier(i: number): TerminalNode;
    public Identifier(i?: number): TerminalNode | TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(ReactiveParser.Identifier);
        } else {
            return this.getToken(ReactiveParser.Identifier, i);
        }
    }

    public DOT(): TerminalNode[];
    public DOT(i: number): TerminalNode;
    public DOT(i?: number): TerminalNode | TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(ReactiveParser.DOT);
        } else {
            return this.getToken(ReactiveParser.DOT, i);
        }
    }

    constructor(parent: ParserRuleContext | undefined, invokingState: number) {
        super(parent, invokingState);
    }

    // @Override
    public get ruleIndex(): number {
        return ReactiveParser.RULE_reference;
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterReference) {
            listener.enterReference(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitReference) {
            listener.exitReference(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitReference) {
            return visitor.visitReference(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AtomicExpressionContext extends ParserRuleContext {
    public literal(): LiteralContext | undefined {
        return this.tryGetRuleContext(0, LiteralContext);
    }

    public reference(): ReferenceContext | undefined {
        return this.tryGetRuleContext(0, ReferenceContext);
    }

    constructor(parent: ParserRuleContext | undefined, invokingState: number) {
        super(parent, invokingState);
    }

    // @Override
    public get ruleIndex(): number {
        return ReactiveParser.RULE_atomicExpression;
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterAtomicExpression) {
            listener.enterAtomicExpression(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitAtomicExpression) {
            listener.exitAtomicExpression(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitAtomicExpression) {
            return visitor.visitAtomicExpression(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LiteralContext extends ParserRuleContext {
    public integerLiteral(): IntegerLiteralContext | undefined {
        return this.tryGetRuleContext(0, IntegerLiteralContext);
    }

    public floatingLiteral(): FloatingLiteralContext | undefined {
        return this.tryGetRuleContext(0, FloatingLiteralContext);
    }

    public booleanLiteral(): BooleanLiteralContext | undefined {
        return this.tryGetRuleContext(0, BooleanLiteralContext);
    }

    constructor(parent: ParserRuleContext | undefined, invokingState: number) {
        super(parent, invokingState);
    }

    // @Override
    public get ruleIndex(): number {
        return ReactiveParser.RULE_literal;
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterLiteral) {
            listener.enterLiteral(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitLiteral) {
            listener.exitLiteral(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitLiteral) {
            return visitor.visitLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class IntegerLiteralContext extends ParserRuleContext {
    public NonzeroDigit(): TerminalNode | undefined {
        return this.tryGetToken(ReactiveParser.NonzeroDigit, 0);
    }

    public DigitSequence(): TerminalNode | undefined {
        return this.tryGetToken(ReactiveParser.DigitSequence, 0);
    }

    constructor(parent: ParserRuleContext | undefined, invokingState: number) {
        super(parent, invokingState);
    }

    // @Override
    public get ruleIndex(): number {
        return ReactiveParser.RULE_integerLiteral;
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterIntegerLiteral) {
            listener.enterIntegerLiteral(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitIntegerLiteral) {
            listener.exitIntegerLiteral(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitIntegerLiteral) {
            return visitor.visitIntegerLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class FloatingLiteralContext extends ParserRuleContext {
    public FractionalConstant(): TerminalNode | undefined {
        return this.tryGetToken(ReactiveParser.FractionalConstant, 0);
    }

    public ExponentPart(): TerminalNode | undefined {
        return this.tryGetToken(ReactiveParser.ExponentPart, 0);
    }

    public DigitSequence(): TerminalNode | undefined {
        return this.tryGetToken(ReactiveParser.DigitSequence, 0);
    }

    constructor(parent: ParserRuleContext | undefined, invokingState: number) {
        super(parent, invokingState);
    }

    // @Override
    public get ruleIndex(): number {
        return ReactiveParser.RULE_floatingLiteral;
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterFloatingLiteral) {
            listener.enterFloatingLiteral(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitFloatingLiteral) {
            listener.exitFloatingLiteral(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitFloatingLiteral) {
            return visitor.visitFloatingLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class BooleanLiteralContext extends ParserRuleContext {
    constructor(parent: ParserRuleContext | undefined, invokingState: number) {
        super(parent, invokingState);
    }

    // @Override
    public get ruleIndex(): number {
        return ReactiveParser.RULE_booleanLiteral;
    }

    // @Override
    public enterRule(listener: ReactiveListener): void {
        if (listener.enterBooleanLiteral) {
            listener.enterBooleanLiteral(this);
        }
    }

    // @Override
    public exitRule(listener: ReactiveListener): void {
        if (listener.exitBooleanLiteral) {
            listener.exitBooleanLiteral(this);
        }
    }

    // @Override
    public accept<Result>(visitor: ReactiveVisitor<Result>): Result {
        if (visitor.visitBooleanLiteral) {
            return visitor.visitBooleanLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


