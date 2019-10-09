/*
This is a state representation of virtual texture tiles
 */


import { Tile, TileAddress } from "./Tile";

class TileTreeNode {
    /**
     *
     * @param {Tile} tile
     */
    constructor(tile) {
        /**
         *
         * @type {Tile}
         */
        this.tile = tile;

        this.parent = null;
    }
}

class TileTreeQuadNode extends TileTreeNode {
    /**
     *
     * @param {Tile} tile
     */
    constructor(tile) {
        super(tile);

        /**
         *
         * @type {TileTreeNode|null}
         */
        this.topLeft = null;

        /**
         *
         * @type {TileTreeNode|null}
         */
        this.topRight = null;

        /**
         *
         * @type {TileTreeNode|null}
         */
        this.bottomLeft = null;

        /**
         *
         * @type {TileTreeNode|null}
         */
        this.bottomRight = null;
    }
}

/**
 *
 * @param {Vector2} size
 * @returns {TileTreeQuadNode|TileTreeNode}
 */
export function buildTileTree(size) {

    const maxMipLevel = Math.ceil(Math.log2(Math.max(size.x, size.y)));

    if (size.x < 1 || size.y < 1) {
        throw  new Error(`Can't build a tree, size must be at least 1x1, was ${size.x}x${size.y}`);
    }

    function buildEmptyTile(mip, x, y) {
        const tileAddress = new TileAddress();

        tileAddress.mip = mip;
        tileAddress.x = x;
        tileAddress.y = y;

        const tile = new Tile();

        tile.address = tileAddress;

        return tile;
    }

    function buildTree(x, y, mip, maxMip) {
        const tile = buildEmptyTile(mip, x, y);

        if (mip === maxMip) {
            return new TileTreeNode(tile);
        } else {
            const node = new TileTreeQuadNode(tile);
            const childX = x * 2;
            const childY = y * 2;

            const childMip = mip + 1;

            node.topLeft = buildTree(childX, childY, childMip, maxMip);
            node.topLeft.parent = node;

            if (childX < size.x) {
                node.topRight = buildTree(childX + 1, childY, childMip, maxMip);
                node.topRight.parent = node;

                if (childY < size.y) {
                    node.bottomLeft = buildTree(childX, childY + 1, childMip, maxMip);
                    node.bottomLeft.parent = node;

                    node.bottomRight = buildTree(childX + 1, childY + 1, childMip, maxMip);
                    node.bottomRight.parent = node;
                }
            } else if (childY < size.y) {
                node.bottomLeft = buildTree(childX, childY + 1, childMip, maxMip);
                node.bottomLeft.parent = node;
            }

            return node;
        }
    }

    return buildTree(0, 0, 0, maxMipLevel);
}


export {
    TileTreeNode,
    TileTreeQuadNode
};


