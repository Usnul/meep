import Token from "./Token";
import ParserError from "./ParserError";
import TokenType from "./TokenType";
import DataType from "./DataType";


const RX_IDENTIFIER_CHAR = /^[a-zA-Z0-9_]/;
/**
 * @readonly
 * @type {RegExp}
 */
export const RX_IDENTIFIER_FIRST_CHAR = /^[a-zA-Z_]/;

/**
 * @readonly
 * @type {RegExp}
 */
export const RX_DIGIT = /^[0-9]/i;

/**
 *
 * @param {String} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
export function readReferenceToken(text, cursor, length) {
    let i = cursor;

    const identifiers = [];

    let identifier;

    identifier = readIdentifierToken(text, i, length);

    identifiers.push(identifier);

    i = identifier.end;

    while (true) {

        const firstChar = text.charAt(i);

        if (firstChar !== '.') {
            break;
        }

        //skip over the separator
        i++;

        identifier = readIdentifierToken(text, i, length);

        identifiers.push(identifier);

        i = identifier.end;
    }

    return new Token(identifiers, cursor, i, TokenType.Reference, DataType.String);
}

/**
 * Read C99 style IDENTIFIER token
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
export function readIdentifierToken(text, cursor, length) {
    let i = cursor;


    const firstChar = text.charAt(i);

    if (!RX_IDENTIFIER_FIRST_CHAR.test(firstChar)) {
        throw new ParserError(i, `Expected first character to match /${RX_IDENTIFIER_FIRST_CHAR.toString()}/, instead got '${firstChar}'`, text);
    }

    i++;

    for (; i < length; i++) {
        const char = text.charAt(i);

        if (!RX_IDENTIFIER_CHAR.test(char)) {
            break;
        }
    }

    const value = text.substring(cursor, i);

    return new Token(value, cursor, i, TokenType.Identifier, DataType.String);
}

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
function readStringToken(text, cursor, length) {
    let i = cursor;

    function readQuote() {
        const char = text.charAt(i);

        if (char !== '"' && char !== '\'') {
            throw new ParserError(cursor, "Expected \", found " + char + " instead", text);
        }

        return char;
    }

    const openingQuote = readQuote();

    i++;

    let char;

    let value = '';
    const lastPossibleChar = length - 1;

    for (; i < lastPossibleChar; i++) {
        char = text.charAt(i);

        if (char === '\\') {
            i++;
            //read escape sequence
            char = text.charAt(i);

            switch (char) {
                case 'n':
                    value += '\n';
                    break;
                case 't':
                    value += '\t';
                    break;
                case 'r':
                    value += '\r';
                    break;
                case 'b':
                    value += '\b';
                    break;
                case 'f':
                    value += '\f';
                    break;
                case 'v':
                    value += '\v';
                    break;
                case '0':
                    value += '\0';
                    break;
                case '\\':
                case "'":
                case '"':
                default:
                    value += char;
                    break;
            }
        } else if (char !== openingQuote) {
            value += char;
        } else {
            break;
        }
    }

    char = text.charAt(i);

    if (char !== openingQuote) {
        throw new ParserError(cursor, "Expected string terminator : " + openingQuote + ", but found '" + char + "' instead", text);
    }

    i++;

    return new Token(value, cursor, i, TokenType.LiteralString, DataType.String);
}

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
function readUnsignedInteger(text, cursor, length) {
    let i = cursor;

    let value = 0;

    main_loop: for (; i < length;) {
        const char = text.charAt(i);
        let digit;
        switch (char) {
            case '0':
                digit = 0;
                break;
            case '1':
                digit = 1;
                break;
            case '2':
                digit = 2;
                break;
            case '3':
                digit = 3;
                break;
            case '4':
                digit = 4;
                break;
            case '5':
                digit = 5;
                break;
            case '6':
                digit = 6;
                break;
            case '7':
                digit = 7;
                break;
            case '8':
                digit = 8;
                break;
            case '9':
                digit = 9;
                break;
            default:
                if (i === cursor) {
                    //first character is not a digit
                    throw new ParserError(i, `Expected a digit [0,1,2,3,4,5,6,7,8,9] but got '${char}' instead`, text);
                }
                //not a digit
                break main_loop;
        }
        i++;
        value = value * 10 + digit;
    }


    return new Token(value, cursor, i, null, DataType.Number);
}


/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {number}
 */
export function skipWhitespace(text, cursor, length) {
    let i = cursor;
    let char;
    while (i < length) {
        char = text.charAt(i);

        if (char === ' ' || char === '\n' || char === '\t') {
            i++;
        } else {
            break;
        }
    }
    return i;
}

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
function readBoolean(text, cursor, length) {
    const firstChar = text.charAt(cursor);

    let value;
    let end = cursor;

    if (firstChar === 't' && length - cursor >= 4) {
        if (text.substring(cursor + 1, cursor + 4) === 'rue') {
            value = true;
            end = cursor + 4;
        } else {
            throw new ParserError(cursor, `expected 'true', instead got '${text.substring(cursor, cursor + 4)}'`, text);
        }
    } else if (firstChar === 'f' && length - cursor >= 5) {
        if (text.substring(cursor + 1, cursor + 5) === 'alse') {
            value = false;
            end = cursor + 5;
        } else {
            throw new ParserError(cursor, `expected 'false', instead got '${text.substring(cursor, cursor + 5)}'`, text);
        }
    } else {
        throw new ParserError(cursor, `expected 't' or 'f', instead got '${firstChar}'`, text);
    }

    return new Token(value, cursor, end, TokenType.LiteralBoolean, DataType.Boolean);
}

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
function readNumber(text, cursor, length) {
    let i = cursor;

    //read optional sign
    function readSign(text) {
        let sign = 1;
        const firstChar = text.charAt(i);
        if (firstChar === '-') {
            sign = -1;
        } else if (firstChar === '+') {
            sign = 1;
        } else {
            return 1;
        }

        i = skipWhitespace(text, i + 1);

        return sign;
    }

    const sign = readSign(text);

    const wholePart = readUnsignedInteger(text, i, length);

    i = wholePart.end;

    let value = wholePart.value;

    if (i < length) {
        const dot = text.charAt(i);
        if (dot === '.') {
            i++;
            const fraction = readUnsignedInteger(text, i, length);

            const digits = (fraction.end - fraction.start);

            value += fraction.value / Math.pow(10, digits);

            i = fraction.end;
        }
    }

    value *= sign;

    return new Token(value, cursor, i, TokenType.LiteralNumber, DataType.Number);
}

function readArrayLiteral(text, cursor, length) {
    let i = cursor;

    const firstChar = text.charAt(i);
    if (firstChar !== '[') {
        throw new ParserError(cursor, `expected array start: '[', got '${firstChar}' instead`, text);
    }

    i++;

    const values = [];
    while (i < length) {
        i = skipWhitespace(text, i, length);

        const token = readLiteral(text, i, length);

        i = token.end;

        values.push(token);

        //try find separator
        i = skipWhitespace(text, i, length);
        if (i < length) {
            const char = text.charAt(i);
            if (char === ',') {
                //separator
                i++;
            } else if (char === ']') {
                //end of sequence
                i++;
                break;
            } else {
                //unexpected input
                throw new ParserError(i, `Unexpected input '${char}', expected either separator ',' or end of sequence ']'`, text);
            }
        } else {
            throw new ParserError(i, `Unterminated array literal`, text);
        }
    }

    return new Token(values, cursor, i, 'array', DataType.Array);
}

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
function readLiteral(text, cursor, length) {
    const firstChar = text.charAt(cursor);

    switch (firstChar) {
        case 't':
        case 'f':
            return readBoolean(text, cursor, length);
        case '\"':
        case "\'":
            return readStringToken(text, cursor, length);
        case '-':
        case '+':
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            return readNumber(text, cursor, length);
        case '[':
            return readArrayLiteral(text, cursor, length);
        default:
            throw new ParserError(cursor, "Expected literal start, but found '" + firstChar + "'", text);
    }
}

export {
    readLiteral,
    readNumber,
    readStringToken,
    readBoolean,
    readUnsignedInteger
};
