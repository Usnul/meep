import { buildTileTree, TileTreeQuadNode } from "./TileTree";
import Vector2 from "../../../core/geom/Vector2";

test("Building a tree with size 0x0 fails", () => {
    expect(() => buildTileTree(new Vector2(0, 0))).toThrow();
});

test("Building a tree with size 1x1 produces a single leaf node", () => {
    const node = buildTileTree(new Vector2(1, 1));

    expect(node instanceof TileTreeQuadNode).toBe(false);

    expect(node.tile).toBeDefined();

    expect(node.tile.address).toBeDefined();

    expect(node.tile.address.x).toBe(0);
    expect(node.tile.address.y).toBe(0);

    expect(node.tile.address.mip).toBe(0);
});

test("Building a tree with size 2x2 produced correct tree", () => {
    const node = buildTileTree(new Vector2(2, 2));

    expect(node instanceof TileTreeQuadNode).toBe(true);

    expect(node.topLeft).toBeDefined();
    expect(node.topRight).toBeDefined();
    expect(node.bottomLeft).toBeDefined();
    expect(node.bottomRight).toBeDefined();

    expect(node.topLeft instanceof TileTreeQuadNode).toBe(false);
    expect(node.topRight instanceof TileTreeQuadNode).toBe(false);
    expect(node.bottomLeft instanceof TileTreeQuadNode).toBe(false);
    expect(node.bottomRight instanceof TileTreeQuadNode).toBe(false);

    expect(node.topLeft.parent).toBe(node);
    expect(node.topRight.parent).toBe(node);
    expect(node.bottomLeft.parent).toBe(node);
    expect(node.bottomRight.parent).toBe(node);

    expect(node.topLeft.tile.address.mip).toEqual(1);
    expect(node.topLeft.tile.address.x).toEqual(0);
    expect(node.topLeft.tile.address.y).toEqual(0);

    expect(node.topRight.tile.address.mip).toEqual(1);
    expect(node.topRight.tile.address.x).toEqual(1);
    expect(node.topRight.tile.address.y).toEqual(0);

    expect(node.bottomLeft.tile.address.mip).toEqual(1);
    expect(node.bottomLeft.tile.address.x).toEqual(0);
    expect(node.bottomLeft.tile.address.y).toEqual(1);

    expect(node.bottomRight.tile.address.mip).toEqual(1);
    expect(node.bottomRight.tile.address.x).toEqual(1);
    expect(node.bottomRight.tile.address.y).toEqual(1);
});