import { parseTooltipString, readReferenceToken, readReferenceValueToken, TooltipTokenType } from "./TooltipParser.js";

test('parse empty string', () => {
    const tokens = parseTooltipString('');

    expect(tokens).toEqual([]);
});

test('parse simple string', () => {
    const a = parseTooltipString('a');

    expect(a.length).toEqual(1);

    expect(a[0].type).toBe(TooltipTokenType.Text);
    expect(a[0].value).toBe('a');
});

test('parse single reference value', () => {
    const token = readReferenceValueToken('a="b"', 0, 5);

    expect(token).toBeDefined();

    expect(token.value.key).toBe("a");
    expect(token.value.value).toBe("b");

    expect(token.end).toBe(5);
    expect(token.start).toBe(0);
});
test('parse single reference value with list ending', () => {
    const token = readReferenceValueToken('a="b",', 0, 6);

    expect(token).toBeDefined();

    expect(token.value.key).toBe("a");
    expect(token.value.value).toBe("b");

    expect(token.end).toBe(5);
    expect(token.start).toBe(0);
});

test('parse single reference value with reference ending', () => {
    const token = readReferenceValueToken('a="b"]', 0, 6);

    expect(token).toBeDefined();

    expect(token.value.key).toBe("a");
    expect(token.value.value).toBe("b");

    expect(token.end).toBe(5);
    expect(token.start).toBe(0);
});

test('parse single reference', () => {

    const a = parseTooltipString('[hello:id="world"]');

    expect(a.length).toEqual(1);

    expect(a[0].type).toBe(TooltipTokenType.Reference);
    expect(a[0].value).toBeDefined();

    expect(a[0].value.type).toBe('hello');
    expect(a[0].value.values.id).toBe('world');
});

test('parse single opening style tag', () => {

    const a = parseTooltipString('[$tag]');

    expect(a.length).toEqual(1);

    expect(a[0].type).toBe(TooltipTokenType.StyleStart);
    expect(a[0].value).toBe('tag');
});

test('parse multi-field reference token', () => {
    const text = "[REF:field0=42,cat='hello',z=true]";
    const token = readReferenceToken(text, 0, text.length);

    expect(token.type).toBe(TooltipTokenType.Reference);
    expect(token.value).toBeDefined();

    expect(token.value.type).toBe("REF");
    expect(token.value.type).toBe("REF");
    expect(token.value.values).toEqual({
        cat: "hello",
        field0: 42,
        z: true
    });
});

test('parse single closing style tag', () => {

    const a = parseTooltipString('[/$tag]');

    expect(a.length).toEqual(1);

    expect(a[0].type).toBe(TooltipTokenType.StyleEnd);
    expect(a[0].value).toBe('tag');
});

test('parse complex combination', () => {
    const tokens = parseTooltipString('Oh, [$style0]brave[/$style1] [creature:id="hero"], please accept this [item:flavour="pancake"]!');

    expect(tokens.length).toEqual(9);

    expect(tokens[0].type).toBe(TooltipTokenType.Text);
    expect(tokens[0].value).toBe('Oh, ');

    expect(tokens[1].type).toBe(TooltipTokenType.StyleStart);
    expect(tokens[1].value).toBe('style0');

    expect(tokens[2].type).toBe(TooltipTokenType.Text);
    expect(tokens[2].value).toBe('brave');

    expect(tokens[3].type).toBe(TooltipTokenType.StyleEnd);
    expect(tokens[3].value).toBe('style1');

    expect(tokens[4].type).toBe(TooltipTokenType.Text);
    expect(tokens[4].value).toBe(' ');

    expect(tokens[5].type).toBe(TooltipTokenType.Reference);
    expect(tokens[5].value).toBeDefined();

    expect(tokens[5].value.type).toBe('creature');
    expect(tokens[5].value.values.id).toBe('hero');

    expect(tokens[6].type).toBe(TooltipTokenType.Text);
    expect(tokens[6].value).toBe(', please accept this ');

    expect(tokens[7].type).toBe(TooltipTokenType.Reference);
    expect(tokens[7].value).toBeDefined();

    expect(tokens[7].value.type).toBe('item');
    expect(tokens[7].value.values.flavour).toBe('pancake');

    expect(tokens[8].type).toBe(TooltipTokenType.Text);
    expect(tokens[8].value).toBe('!');
});