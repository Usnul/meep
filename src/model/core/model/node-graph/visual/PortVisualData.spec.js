import { PortVisualData } from "./PortVisualData.js";

test("to/from JSON serialization", () => {
    const a = new PortVisualData();

    const b = new PortVisualData();

    a.id = 7;
    a.position.set(3, 11);

    b.fromJSON(a.toJSON());

    expect(b.id).toBe(7);
    expect(b.position.x).toBe(3);
    expect(b.position.y).toBe(11);
});
