import { Tile, TileAddress, TileStatus } from "./Tile.js";

test("Tile constructor doesn't throw", () => {
    new Tile();
});

test("new tile has Initial status", () => {
    const tile = new Tile();
    expect(tile.status).toBe(TileStatus.Initial);
});

test("TileAddress equals works correctly", () => {
    const a = new TileAddress();
    const b = new TileAddress();

    expect(a.equals(b)).toBeTruthy();

    a.x = 1;
    a.y = 3;
    a.mip = 7;

    expect(a.equals(b)).toBeFalsy();
    expect(b.equals(a)).toBeFalsy();

    b.x = 1;

    expect(a.equals(b)).toBeFalsy();
    expect(b.equals(a)).toBeFalsy();

    b.y = 3;

    expect(a.equals(b)).toBeFalsy();
    expect(b.equals(a)).toBeFalsy();

    b.mip = 7;

    expect(a.equals(b)).toBeTruthy();
    expect(b.equals(a)).toBeTruthy();
});