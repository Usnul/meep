import { camelToKebab, capitalize, computeCommonPrefix, computeStringHash } from "./StringUtils.js";

test("common prefix", () => {
    expect(computeCommonPrefix([])).toBe("");

    expect(computeCommonPrefix([""])).toBe("");

    expect(computeCommonPrefix(["a"])).toBe("a");

    expect(computeCommonPrefix(["abc"])).toBe("abc");

    expect(computeCommonPrefix(["aa"])).toBe("aa");

    expect(computeCommonPrefix(["aa", "ab"])).toBe("a");

    expect(computeCommonPrefix(["abc", "abb"])).toBe("ab");

    expect(computeCommonPrefix(["abc", "abc"])).toBe("abc");

    expect(computeCommonPrefix(["abc", "abc", "a"])).toBe("a");

    expect(computeCommonPrefix(["abc", "abc", ""])).toBe("");
});

test("capitalize", () => {
    expect(capitalize("")).toBe("");

    expect(capitalize("a")).toBe("A");

    expect(capitalize("A")).toBe("A");

    expect(capitalize("aa")).toBe("Aa");

    expect(capitalize("AA")).toBe("AA");
});

test('hash', () => {
    expect(typeof computeStringHash('')).toBe('number');

    expect(computeStringHash('')).toBe(computeStringHash(''));

    expect(computeStringHash('cat')).toBe(computeStringHash('cat'));

    expect(computeStringHash('tomato')).not.toBe(computeStringHash('potato'));
});

test('camelToKebab', ()=>{
    expect(camelToKebab('a')).toBe('a');
    expect(camelToKebab('aA')).toBe('a-a');
    expect(camelToKebab('helloWoRLD')).toBe('hello-wo-rld');
    expect(camelToKebab('A')).toBe('a');
});