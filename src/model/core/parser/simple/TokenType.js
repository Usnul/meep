/**
 * @enum {{LiteralString: string, LiteralNumber: string, LiteralBoolean: string}}
 */
const TokenType = {
    LiteralString: "literal-string",
    LiteralNumber: "literal-number",
    LiteralBoolean: "literal-boolean",
    Identifier: "identifier",
    Reference: "reference"
};

export default TokenType;
