// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
    function id(x) {
        return x[0];
    }

    var grammar = {
        Lexer: undefined,
        ParserRules: [
            { "name": "_$ebnf$1", "symbols": [] },
            {
                "name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            {
                "name": "_", "symbols": ["_$ebnf$1"], "postprocess": function (d) {
                    return null;
                }
            },
            { "name": "__$ebnf$1", "symbols": ["wschar"] },
            {
                "name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            {
                "name": "__", "symbols": ["__$ebnf$1"], "postprocess": function (d) {
                    return null;
                }
            },
            { "name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id },
            { "name": "unsigned_int$ebnf$1", "symbols": [/[0-9]/] },
            {
                "name": "unsigned_int$ebnf$1",
                "symbols": ["unsigned_int$ebnf$1", /[0-9]/],
                "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            {
                "name": "unsigned_int", "symbols": ["unsigned_int$ebnf$1"], "postprocess":
                    function (d) {
                        return parseInt(d[0].join(""));
                    }
            },
            { "name": "int$ebnf$1$subexpression$1", "symbols": [{ "literal": "-" }] },
            { "name": "int$ebnf$1$subexpression$1", "symbols": [{ "literal": "+" }] },
            { "name": "int$ebnf$1", "symbols": ["int$ebnf$1$subexpression$1"], "postprocess": id },
            {
                "name": "int$ebnf$1", "symbols": [], "postprocess": function (d) {
                    return null;
                }
            },
            { "name": "int$ebnf$2", "symbols": [/[0-9]/] },
            {
                "name": "int$ebnf$2", "symbols": ["int$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            {
                "name": "int", "symbols": ["int$ebnf$1", "int$ebnf$2"], "postprocess":
                    function (d) {
                        if (d[0]) {
                            return parseInt(d[0][0] + d[1].join(""));
                        } else {
                            return parseInt(d[1].join(""));
                        }
                    }
            },
            { "name": "unsigned_decimal$ebnf$1", "symbols": [/[0-9]/] },
            {
                "name": "unsigned_decimal$ebnf$1",
                "symbols": ["unsigned_decimal$ebnf$1", /[0-9]/],
                "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            { "name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": [/[0-9]/] },
            {
                "name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1",
                "symbols": ["unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", /[0-9]/],
                "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            {
                "name": "unsigned_decimal$ebnf$2$subexpression$1",
                "symbols": [{ "literal": "." }, "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1"]
            },
            {
                "name": "unsigned_decimal$ebnf$2",
                "symbols": ["unsigned_decimal$ebnf$2$subexpression$1"],
                "postprocess": id
            },
            {
                "name": "unsigned_decimal$ebnf$2", "symbols": [], "postprocess": function (d) {
                    return null;
                }
            },
            {
                "name": "unsigned_decimal",
                "symbols": ["unsigned_decimal$ebnf$1", "unsigned_decimal$ebnf$2"],
                "postprocess":
                    function (d) {
                        return parseFloat(
                            d[0].join("") +
                            (d[1] ? "." + d[1][1].join("") : "")
                        );
                    }
            },
            { "name": "decimal$ebnf$1", "symbols": [{ "literal": "-" }], "postprocess": id },
            {
                "name": "decimal$ebnf$1", "symbols": [], "postprocess": function (d) {
                    return null;
                }
            },
            { "name": "decimal$ebnf$2", "symbols": [/[0-9]/] },
            {
                "name": "decimal$ebnf$2", "symbols": ["decimal$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            { "name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/] },
            {
                "name": "decimal$ebnf$3$subexpression$1$ebnf$1",
                "symbols": ["decimal$ebnf$3$subexpression$1$ebnf$1", /[0-9]/],
                "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            {
                "name": "decimal$ebnf$3$subexpression$1",
                "symbols": [{ "literal": "." }, "decimal$ebnf$3$subexpression$1$ebnf$1"]
            },
            { "name": "decimal$ebnf$3", "symbols": ["decimal$ebnf$3$subexpression$1"], "postprocess": id },
            {
                "name": "decimal$ebnf$3", "symbols": [], "postprocess": function (d) {
                    return null;
                }
            },
            {
                "name": "decimal", "symbols": ["decimal$ebnf$1", "decimal$ebnf$2", "decimal$ebnf$3"], "postprocess":
                    function (d) {
                        return parseFloat(
                            (d[0] || "") +
                            d[1].join("") +
                            (d[2] ? "." + d[2][1].join("") : "")
                        );
                    }
            },
            {
                "name": "percentage", "symbols": ["decimal", { "literal": "%" }], "postprocess":
                    function (d) {
                        return d[0] / 100;
                    }
            },
            { "name": "jsonfloat$ebnf$1", "symbols": [{ "literal": "-" }], "postprocess": id },
            {
                "name": "jsonfloat$ebnf$1", "symbols": [], "postprocess": function (d) {
                    return null;
                }
            },
            { "name": "jsonfloat$ebnf$2", "symbols": [/[0-9]/] },
            {
                "name": "jsonfloat$ebnf$2",
                "symbols": ["jsonfloat$ebnf$2", /[0-9]/],
                "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            { "name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/] },
            {
                "name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1",
                "symbols": ["jsonfloat$ebnf$3$subexpression$1$ebnf$1", /[0-9]/],
                "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            {
                "name": "jsonfloat$ebnf$3$subexpression$1",
                "symbols": [{ "literal": "." }, "jsonfloat$ebnf$3$subexpression$1$ebnf$1"]
            },
            { "name": "jsonfloat$ebnf$3", "symbols": ["jsonfloat$ebnf$3$subexpression$1"], "postprocess": id },
            {
                "name": "jsonfloat$ebnf$3", "symbols": [], "postprocess": function (d) {
                    return null;
                }
            },
            { "name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [/[+-]/], "postprocess": id },
            {
                "name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [], "postprocess": function (d) {
                    return null;
                }
            },
            { "name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": [/[0-9]/] },
            {
                "name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2",
                "symbols": ["jsonfloat$ebnf$4$subexpression$1$ebnf$2", /[0-9]/],
                "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            {
                "name": "jsonfloat$ebnf$4$subexpression$1",
                "symbols": [/[eE]/, "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "jsonfloat$ebnf$4$subexpression$1$ebnf$2"]
            },
            { "name": "jsonfloat$ebnf$4", "symbols": ["jsonfloat$ebnf$4$subexpression$1"], "postprocess": id },
            {
                "name": "jsonfloat$ebnf$4", "symbols": [], "postprocess": function (d) {
                    return null;
                }
            },
            {
                "name": "jsonfloat",
                "symbols": ["jsonfloat$ebnf$1", "jsonfloat$ebnf$2", "jsonfloat$ebnf$3", "jsonfloat$ebnf$4"],
                "postprocess":
                    function (d) {
                        return parseFloat(
                            (d[0] || "") +
                            d[1].join("") +
                            (d[2] ? "." + d[2][1].join("") : "") +
                            (d[3] ? "e" + (d[3][1] || "+") + d[3][2].join("") : "")
                        );
                    }
            },
            { "name": "expression", "symbols": ["binary_expression_add"], "postprocess": id },
            {
                "name": "group_expression",
                "symbols": [{ "literal": "(" }, "_", "expression", "_", { "literal": ")" }],
                "postprocess": (a) => a[2]
            },
            { "name": "group_expression", "symbols": ["atomic"], "postprocess": id },
            {
                "name": "unary_expression_negate",
                "symbols": [{ "literal": "-" }, "_", "expression"],
                "postprocess": (d) => {
                    return { type: 'UnaryNegate', value: d[2] }
                }
            },
            { "name": "unary_expression_negate", "symbols": ["group_expression"], "postprocess": id },
            {
                "name": "unary_expression_not",
                "symbols": [{ "literal": "!" }, "_", "expression"],
                "postprocess": (d) => {
                    return { type: 'UnaryNot', value: d[2] }
                }
            },
            { "name": "unary_expression_not", "symbols": ["unary_expression_negate"], "postprocess": id },
            {
                "name": "binary_expression_or$string$1",
                "symbols": [{ "literal": "|" }, { "literal": "|" }],
                "postprocess": function joiner(d) {
                    return d.join('');
                }
            },
            {
                "name": "binary_expression_or",
                "symbols": ["binary_expression_or", "_", "binary_expression_or$string$1", "_", "unary_expression_not"],
                "postprocess": (d) => {
                    return { type: 'BinaryOr', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_or", "symbols": ["unary_expression_not"], "postprocess": id },
            {
                "name": "binary_expression_and$string$1",
                "symbols": [{ "literal": "&" }, { "literal": "&" }],
                "postprocess": function joiner(d) {
                    return d.join('');
                }
            },
            {
                "name": "binary_expression_and",
                "symbols": ["binary_expression_and", "_", "binary_expression_and$string$1", "_", "binary_expression_or"],
                "postprocess": (d) => {
                    return { type: 'BinaryAnd', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_and", "symbols": ["binary_expression_or"], "postprocess": id },
            {
                "name": "binary_expression_equals$string$1",
                "symbols": [{ "literal": "=" }, { "literal": "=" }],
                "postprocess": function joiner(d) {
                    return d.join('');
                }
            },
            {
                "name": "binary_expression_equals",
                "symbols": ["binary_expression_equals", "_", "binary_expression_equals$string$1", "_", "binary_expression_and"],
                "postprocess": (d) => {
                    return { type: 'BinaryEqual', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_equals", "symbols": ["binary_expression_and"], "postprocess": id },
            {
                "name": "binary_expression_not_equals$string$1",
                "symbols": [{ "literal": "!" }, { "literal": "=" }],
                "postprocess": function joiner(d) {
                    return d.join('');
                }
            },
            {
                "name": "binary_expression_not_equals",
                "symbols": ["binary_expression_not_equals", "_", "binary_expression_not_equals$string$1", "_", "binary_expression_equals"],
                "postprocess": (d) => {
                    return { type: 'BinaryNotEqual', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_not_equals", "symbols": ["binary_expression_equals"], "postprocess": id },
            {
                "name": "binary_expression_lte$string$1",
                "symbols": [{ "literal": "<" }, { "literal": "=" }],
                "postprocess": function joiner(d) {
                    return d.join('');
                }
            },
            {
                "name": "binary_expression_lte",
                "symbols": ["binary_expression_lte", "_", "binary_expression_lte$string$1", "_", "binary_expression_not_equals"],
                "postprocess": (d) => {
                    return { type: 'BinaryLessOrEqual', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_lte", "symbols": ["binary_expression_not_equals"], "postprocess": id },
            {
                "name": "binary_expression_gte$string$1",
                "symbols": [{ "literal": ">" }, { "literal": "=" }],
                "postprocess": function joiner(d) {
                    return d.join('');
                }
            },
            {
                "name": "binary_expression_gte",
                "symbols": ["binary_expression_gte", "_", "binary_expression_gte$string$1", "_", "binary_expression_lte"],
                "postprocess": (d) => {
                    return { type: 'BinaryGreaterOrEqual', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_gte", "symbols": ["binary_expression_lte"], "postprocess": id },
            {
                "name": "binary_expression_lt",
                "symbols": ["binary_expression_lt", "_", { "literal": "<" }, "_", "binary_expression_gte"],
                "postprocess": (d) => {
                    return { type: 'BinaryLess', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_lt", "symbols": ["binary_expression_gte"], "postprocess": id },
            {
                "name": "binary_expression_gt",
                "symbols": ["binary_expression_gt", "_", { "literal": ">" }, "_", "binary_expression_lt"],
                "postprocess": (d) => {
                    return { type: 'BinaryGreater', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_gt", "symbols": ["binary_expression_lt"], "postprocess": id },
            {
                "name": "binary_expression_multiply",
                "symbols": ["binary_expression_multiply", "_", { "literal": "*" }, "_", "binary_expression_gt"],
                "postprocess": (d) => {
                    return { type: 'BinaryMultiply', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_multiply", "symbols": ["binary_expression_gt"], "postprocess": id },
            {
                "name": "binary_expression_divide",
                "symbols": ["binary_expression_divide", "_", { "literal": "/" }, "_", "binary_expression_multiply"],
                "postprocess": (d) => {
                    return { type: 'BinaryDivide', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_divide", "symbols": ["binary_expression_multiply"], "postprocess": id },
            {
                "name": "binary_expression_subtract",
                "symbols": ["binary_expression_subtract", "_", { "literal": "-" }, "_", "binary_expression_divide"],
                "postprocess": (d) => {
                    return { type: 'BinarySubtract', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_subtract", "symbols": ["binary_expression_divide"], "postprocess": id },
            {
                "name": "binary_expression_add",
                "symbols": ["binary_expression_add", "_", { "literal": "+" }, "_", "binary_expression_subtract"],
                "postprocess": (d) => {
                    return { type: 'BinaryAdd', left: d[0], right: d[4] }
                }
            },
            { "name": "binary_expression_add", "symbols": ["binary_expression_subtract"], "postprocess": id },
            { "name": "atomic", "symbols": ["literal"], "postprocess": id },
            {
                "name": "atomic", "symbols": ["reference"], "postprocess": (d, l, r) => {
                    return { type: 'Reference', value: d[0] }
                }
            },
            { "name": "reference$ebnf$1", "symbols": [] },
            {
                "name": "reference$ebnf$1$subexpression$1",
                "symbols": [{ "literal": "." }, "identifier"],
                "postprocess": (a) => a[1]
            },
            {
                "name": "reference$ebnf$1",
                "symbols": ["reference$ebnf$1", "reference$ebnf$1$subexpression$1"],
                "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            {
                "name": "reference",
                "symbols": ["identifier", "reference$ebnf$1"],
                "postprocess": (a, l, r) => [a[0]].concat(a[1])
            },
            { "name": "identifier$ebnf$1", "symbols": [] },
            {
                "name": "identifier$ebnf$1",
                "symbols": ["identifier$ebnf$1", /[a-zA-Z_0-9]/],
                "postprocess": function arrpush(d) {
                    return d[0].concat([d[1]]);
                }
            },
            {
                "name": "identifier", "symbols": [/[a-zA-Z_]/, "identifier$ebnf$1"], "postprocess": (d, l, r) => {
                    const value = d[0] + d[1].join("");
                    if (value === 'true' || value === 'false') {
                        return r
                    } else {
                        return value
                    }
                }
            },
            {
                "name": "literal", "symbols": ["decimal"], "postprocess": (d) => {
                    return { type: 'LiteralNumber', value: d[0] }
                }
            },
            {
                "name": "literal", "symbols": ["literal_boolean"], "postprocess": (d) => {
                    return { type: 'LiteralBoolean', value: d[0] }
                }
            },
            {
                "name": "literal_boolean$string$1",
                "symbols": [{ "literal": "t" }, { "literal": "r" }, { "literal": "u" }, { "literal": "e" }],
                "postprocess": function joiner(d) {
                    return d.join('');
                }
            },
            { "name": "literal_boolean", "symbols": ["literal_boolean$string$1"], "postprocess": () => true },
            {
                "name": "literal_boolean$string$2",
                "symbols": [{ "literal": "f" }, { "literal": "a" }, { "literal": "l" }, { "literal": "s" }, { "literal": "e" }],
                "postprocess": function joiner(d) {
                    return d.join('');
                }
            },
            { "name": "literal_boolean", "symbols": ["literal_boolean$string$2"], "postprocess": () => false }
        ]
        , ParserStart: "expression"
    }
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = grammar;
    } else {
        window.grammar = grammar;
    }
})();
