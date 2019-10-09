import { DataType } from "../DataType.js";
import { NodeDescription } from "./NodeDescription.js";
import { PortDirection } from "./PortDirection.js";
import { NodeRegistry } from "./NodeRegistry.js";
import { Port } from "./Port.js";

test("serialize/deserialize 1 node with 1 port", () => {
    const t0 = new DataType();
    t0.id = 42;
    t0.name = "kitty";

    const n0 = new NodeDescription();
    n0.id = 7;
    n0.name = "Yarr";

    const p0 = new Port();
    p0.id = 13;
    p0.name = "fluffy";
    p0.dataType = t0;
    p0.direction = PortDirection.In;

    n0.ports.push(p0);

    const lA = new NodeRegistry();

    lA.addNode(n0);

    const json = lA.toJSON();

    const lB = new NodeRegistry();

    lB.fromJSON(json);

    expect(lB.nodes.size).toBe(1);
    expect(lB.types.size).toBe(1);

    const n1 = lB.getNode(7);

    expect(n1.id).toBe(7);
    expect(n1.name).toBe("Yarr");

    const ports1 = n1.getPorts();

    expect(ports1.length).toBe(1);

    const port = ports1[0];
    expect(port.id).toBe(13);
    expect(port.name).toBe("fluffy");
    expect(port.direction).toBe(PortDirection.In);
    expect(port.dataType.name).toBe("kitty");
    expect(port.dataType.id).toBe(42);
});
