import { readIdentifierToken, readReferenceToken, readStringToken } from "./SimpleParser.js";
import TokenType from "./TokenType.js";

test('parse empty string literal', () => {
    const token = readStringToken('""', 0, 2);

    expect(token.value).toBe("");
    expect(token.start).toBe(0);
    expect(token.end).toBe(2);
});

test('parse short string literal', () => {
    const token = readStringToken('"1"', 0, 3);

    expect(token.value).toBe("1");
    expect(token.start).toBe(0);
    expect(token.end).toBe(3);
});

test('parse short string literal from longer input', () => {
    const token = readStringToken('"1"  ', 0, 5);

    expect(token.value).toBe("1");
    expect(token.start).toBe(0);
    expect(token.end).toBe(3);
});

test('parse long string literal', () => {
    const token = readStringToken('"hello world"', 0, 13);

    expect(token.value).toBe("hello world");
    expect(token.start).toBe(0);
    expect(token.end).toBe(13);
});

test('parse a single escaped quote string literal', () => {
    const token = readStringToken('"\\""', 0, 4);

    expect(token.value).toBe('\"');
    expect(token.start).toBe(0);
    expect(token.end).toBe(4);
});

test('parse string literal with escaped quotes', () => {
    const token = readStringToken('"what is \\"?"', 0, 13);

    expect(token.value).toBe('what is "?');
    expect(token.start).toBe(0);
    expect(token.end).toBe(13);
});

test('parse string literal sequential escape sequences', () => {
    const token = readStringToken('"\\n\\t"', 0, 6);

    expect(token.value).toBe('\n\t');
    expect(token.start).toBe(0);
    expect(token.end).toBe(6);
});

test('parse identifier token starting with a number', () => {
    expect(() => readIdentifierToken('0', 0, 1)).toThrow();
    expect(() => readIdentifierToken('1', 0, 1)).toThrow();
    expect(() => readIdentifierToken('2', 0, 1)).toThrow();
    expect(() => readIdentifierToken('3', 0, 1)).toThrow();
    expect(() => readIdentifierToken('4', 0, 1)).toThrow();
    expect(() => readIdentifierToken('5', 0, 1)).toThrow();
    expect(() => readIdentifierToken('6', 0, 1)).toThrow();
    expect(() => readIdentifierToken('7', 0, 1)).toThrow();
    expect(() => readIdentifierToken('8', 0, 1)).toThrow();
    expect(() => readIdentifierToken('9', 0, 1)).toThrow();


    expect(() => readIdentifierToken('9a', 0, 2)).toThrow();
});

test('parse identifier token with length 1', () => {
    expect(readIdentifierToken('a', 0, 1).value).toBe('a');
    expect(readIdentifierToken('A', 0, 1).value).toBe('A');
    expect(readIdentifierToken('z', 0, 1).value).toBe('z');
    expect(readIdentifierToken('Z', 0, 1).value).toBe('Z');
    expect(readIdentifierToken('_', 0, 1).value).toBe('_');
});

test('parse identifier valid tokens', () => {
    expect(readIdentifierToken('aa', 0, 2).value).toBe('aa');
    expect(readIdentifierToken('a1', 0, 2).value).toBe('a1');
    expect(readIdentifierToken('z ', 0, 2).value).toBe('z');
    expect(readIdentifierToken('___ ', 0, 4).value).toBe('___');
});

test('parse reference a.b', () => {
    const token = readReferenceToken('a.b', 0, 3);

    expect(token.end).toBe(3);
    expect(token.start).toBe(0);
    expect(token.name).toBe(TokenType.Reference);

    const identifiers = token.value;

    expect(Array.isArray(identifiers)).toBe(true);
    expect(identifiers.length).toBe(2);

    expect(identifiers[0].value).toBe('a');
    expect(identifiers[1].value).toBe('b');
});
