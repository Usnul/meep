import { NodeGraph } from "./NodeGraph.js";
import { NodeDescription } from "./node/NodeDescription.js";
import { PortDirection } from "./node/PortDirection.js";
import { DataType } from "./DataType.js";

test("constructor doesn't throw", () => {
    new NodeGraph();
});

test("createNode returns a number", () => {
    const node = new NodeDescription();

    const g = new NodeGraph();

    expect(typeof g.createNode(node)).toBe('number');
});

test("createConnection returns a number", () => {
    const node = new NodeDescription();

    const dt = new DataType();

    const pInt = node.createPort(dt, "in", PortDirection.In);
    const pOut = node.createPort(dt, "out", PortDirection.Out);


    const g = new NodeGraph();

    const i0 = g.createNode(node);
    const i1 = g.createNode(node);

    expect(typeof g.createConnection(i0, pOut, i1, pInt)).toBe('number');
});
