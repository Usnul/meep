import Token from "../../../model/core/parser/simple/Token.js";
import ParserError from "../../../model/core/parser/simple/ParserError.js";
import { assert } from "../../../model/core/assert.js";
import { readLiteral, skipWhitespace } from "../../../model/core/parser/simple/SimpleParser.js";

/**
 *
 * @enum {number}
 */
export const TooltipTokenType = {
    Text: 0,
    Reference: 1,
    StyleStart: 2,
    StyleEnd: 3,
    ReferenceValue: 4,
};

class TooltipReferenceValue {
    /**
     *
     * @param {string} type
     * @param {Object<String>} values
     */
    constructor(type, values) {
        /**
         *
         * @type {string}
         */
        this.type = type;
        /**
         *
         * @type {Object<String>}
         */
        this.values = values;
    }
}

/**
 * @template Key, Value
 */
class KeyValuePair {
    /**
     *
     * @param {Key} key
     * @param {Value} value
     */
    constructor(key, value) {
        /**
         *
         * @type {Key}
         */
        this.key = key;
        /**
         *
         * @type {Value}
         */
        this.value = value;
    }
}


/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 */
export function readReferenceValueToken(text, cursor, length) {
    let char, i;

    i = cursor;

    let key;
    //read the key
    while (true) {

        if (i >= length) {
            throw  new ParserError(i, `Input underflow while reading reference key`, text);
        }

        char = text.charAt(i);

        i++;

        if (char === '=') {
            //finish reading the key
            key = text.substring(cursor, i - 1).trim();
            break;
        }

    }

    const valueStart = i;

    if (i >= length) {
        throw  new ParserError(i, `Input underflow while reading reference value, value so far='${text.substring(valueStart, length)}'`, text);
    }

    const literal = readLiteral(text, i, length);

    i = literal.end;


    /**
     *
     * @type {KeyValuePair<string, *>}
     */
    const pair = new KeyValuePair(key, literal.value);

    return new Token(pair, cursor, i, 'reference-value', TooltipTokenType.ReferenceValue);
}

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
export function readReferenceToken(text, cursor, length) {
    let i = cursor;
    let char;

    const firstChar = text.charAt(cursor);

    if (firstChar !== '[') {
        throw new ParserError(cursor, `expected reference start: '[', got '${firstChar}' instead`, text);
    }

    i++;

    const tagStartIndex = i;

    let tag;

    // read tag
    while (true) {

        if (i >= length) {
            throw new ParserError(cursor, `input underflow, expected reference separator ':' is missing`, text);
        }

        const char = text.charAt(i);

        if (char === ':') {
            tag = text.substring(tagStartIndex, i);

            i++;

            break;
        }

        i++;
    }

    i = skipWhitespace(text, i, length);

    char = text.charAt(i);

    let values = {};
    //read values
    if (char !== ']') {
        do {

            i = skipWhitespace(text, i, length);

            const valueToken = readReferenceValueToken(text, i, length);

            i = valueToken.end;

            i = skipWhitespace(text, i, length);

            /**
             * @type {KeyValuePair<string,string>}
             */
            const namedValue = valueToken.value;

            values[namedValue.key] = namedValue.value;

            char = text.charAt(i);

            if (char === ',') {
                i++;
            } else {
                break;
            }

        } while (true);

        i = skipWhitespace(text, i, length);

        char = text.charAt(i);
    }

    if (char === ']') {
        //end of sequence

        i++;

        const referenceValue = new TooltipReferenceValue(tag, values);

        return new Token(referenceValue, cursor, i, 'reference', TooltipTokenType.Reference);
    }


    throw new ParserError(i, `input underflow, expected reference end ']' is missing`, text);
}

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
export function readStyleToken(text, cursor, length) {
    let i = cursor;

    const firstChar = text.charAt(cursor);

    if (firstChar !== '[') {
        throw new ParserError(cursor, `expected style start: '[', got '${firstChar}' instead`, text);
    }

    i++;

    const secondChar = text.charAt(i);

    let tokenType;
    if (secondChar === '$') {
        //style start token
        tokenType = TooltipTokenType.StyleStart;
        i++;
    } else if (secondChar === '/') {
        i++;

        const thirdChar = text.charAt(i);

        i++;
        if (thirdChar !== '$') {
            throw new ParserError(i, `expected style end sequence '[/$', instead got '[/${thirdChar}'`, text);
        }

        tokenType = TooltipTokenType.StyleEnd;
    }

    const tagStartIndex = i;

    while (i < length) {
        const char = text.charAt(i);

        if (char === ']') {
            //end of token

            //build tag
            const tag = text.substring(tagStartIndex, i);

            i++;

            return new Token(tag, cursor, i, 'style', tokenType);
        }

        i++;
    }

    throw new ParserError(cursor, `input underflow, missing terminal of style sequence ']'`, text);
}

/**
 *
 * @param {string} text
 * @param {number} cursor
 * @param {number} length
 * @returns {Token}
 */
function readTextToken(text, cursor, length) {
    let i = cursor;

    while (i < length) {
        const char = text.charAt(i);

        if (char === '[') {
            //consider to be end of sequence
            break;
        }

        i++;
    }

    const value = text.substring(cursor, i);

    return new Token(value, cursor, i, 'text', TooltipTokenType.Text);
}

/**
 * @param {string} text
 * @returns {Token[]}
 */
export function parseTooltipString(text) {
    let cursor = 0;
    let length = text.length;

    const result = [];

    while (cursor < length) {

        /**
         * @type {Token}
         */
        let token;

        const firstChar = text.charAt(cursor);

        if (firstChar === '[') {
            const secondChar = text.charAt(cursor + 1);

            if (secondChar === '$' || secondChar === '/') {
                token = readStyleToken(text, cursor, length);
            } else {
                token = readReferenceToken(text, cursor, length);
            }

        } else {
            token = readTextToken(text, cursor, length);
        }

        if (token === undefined) {
            //no token read. this shouldn't happen
            break;
        }

        result.push(token);

        assert.ok(cursor < token.end, `token ends (=${cursor}) before the cursor(=${cursor})`);

        cursor = token.end;
    }

    return result;
}
