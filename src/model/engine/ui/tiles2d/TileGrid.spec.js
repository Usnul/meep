import TileGrid from "./TileGrid";
import Rectangle from "../../../core/geom/Rectangle";

test("move to empty space works as intended", () => {
    const tileGrid = new TileGrid(2, 1);

    const a = new Rectangle(0, 0, 1, 1);

    tileGrid.add(a);

    const move = tileGrid.computeMove(a, 1, 0);

    move();

    expect(a.position.x).toBe(1);
    expect(a.position.y).toBe(0);
});

test("swap of 2 tiles works as intended", () => {
    const tileGrid = new TileGrid(2, 1);

    const a = new Rectangle(0, 0, 1, 1);
    const b = new Rectangle(1, 0, 1, 1);

    tileGrid.add(a);
    tileGrid.add(b);

    const move = tileGrid.computeMove(a, 1, 0);

    move();

    expect(a.position.x).toBe(1);
    expect(b.position.x).toBe(0);
});

test("swap there and back again works as intended", () => {
    const tileGrid = new TileGrid(2, 1);

    const a = new Rectangle(0, 0, 1, 1);
    const b = new Rectangle(1, 0, 1, 1);

    tileGrid.add(a);
    tileGrid.add(b);

    let move;
    move = tileGrid.computeMove(a, 1, 0);

    move();

    move = tileGrid.computeMove(a, 0, 0);
    move();

    expect(a.position.x).toBe(0);
    expect(b.position.x).toBe(1);
});