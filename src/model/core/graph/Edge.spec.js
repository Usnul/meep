import { Edge, EdgeDirectionType } from "./Edge.js";

test('traversableForward', () => {
    const edge = new Edge(1, 2);

    edge.direction = EdgeDirectionType.Forward;

    expect(edge.traversableForward()).toBe(true);

    edge.direction = EdgeDirectionType.Backward;

    expect(edge.traversableForward()).toBe(false);

    edge.direction = EdgeDirectionType.Undirected;

    expect(edge.traversableForward()).toBe(true);
});

test('traversableBackward', () => {
    const edge = new Edge(1, 2);

    edge.direction = EdgeDirectionType.Backward;

    expect(edge.traversableBackward()).toBe(true);

    edge.direction = EdgeDirectionType.Forward;

    expect(edge.traversableBackward()).toBe(false);

    edge.direction = EdgeDirectionType.Undirected;

    expect(edge.traversableBackward()).toBe(true);
});

test('contains', () => {
    const edge = new Edge(3, 7);

    expect(edge.contains(3)).toBe(true);
    expect(edge.contains(7)).toBe(true);

    expect(edge.contains(1)).toBe(false);
    expect(edge.contains("cat")).toBe(false);
});

test('other', () => {
    const edge = new Edge(3, 7);

    expect(edge.other(3)).toBe(7);
    expect(edge.other(7)).toBe(3);
});
