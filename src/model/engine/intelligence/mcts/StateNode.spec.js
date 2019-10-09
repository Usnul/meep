import { StateNode, StateType } from "./StateNode";
import { MoveEdge } from "./MoveEdge";

test("expand a node with no moves", () => {
    const node = new StateNode();

    const expand = jest.fn(function (x) {
        expect(x).toBe('cat');

        return [];
    });

    node.expand('cat', expand, (n) => n === "cat");

    expect(node.moves).not.toBeNull();

    expect(node.moves.length).toBe(0);
});

test("expand a node with 1 move", () => {
    const node = new StateNode();

    const expand = jest.fn(function (x) {
        expect(x).toBe('cat');

        return [(state) => {
            expect(state).toBe('cat');

            return "hello"
        }];
    });

    node.expand('cat', expand, (n) => n === "hello" ? StateType.Win : StateType.Undecided);

    expect(node.moves).not.toBeNull();

    expect(node.moves.length).toBe(1);

    const moveEdge = node.moves[0];

    expect(moveEdge).not.toBeNull();
    expect(moveEdge).toBeDefined();

    expect(moveEdge instanceof MoveEdge).toBe(true);
    expect(moveEdge.move).toBeDefined();
});