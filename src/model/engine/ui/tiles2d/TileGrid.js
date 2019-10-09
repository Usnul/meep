/**
 * Created by Alex on 15/03/2016.
 */
import List from '../../../core/collection/List';
import Vector2 from '../../../core/geom/Vector2';
import Rectangle from '../../../core/geom/Rectangle';
import Vector1 from "../../../core/geom/Vector1";

class TileGrid {
    /**
     *
     * @param {number} width
     * @param {number} height
     * @constructor
     */
    constructor(width, height) {

        this.size = new Vector2(width, height);
        /**
         *
         * @type {List<Rectangle>}
         */
        this.tiles = new List();
        /**
         *
         * @type {Vector1}
         */
        this.capacity = new Vector1(width * height);
    }

    /**
     *
     * @param {Rectangle} rect
     * @returns {Array<Rectangle>}
     */
    getOverlappingTiles(rect) {
        return this.getOverlappingTilesRaw(rect.position.x, rect.position.y, rect.size.x, rect.size.y);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @returns {Rectangle[]}
     */
    getOverlappingTilesRaw(x, y, w, h) {
        const result = [];

        const tiles = this.tiles;

        const l = tiles.length;

        const x1 = x + w;
        const y1 = y + h;

        for (let i = 0; i < l; i++) {
            const tile = tiles.get(i);

            if (tile._overlaps(x, y, x1, y1)) {
                result.push(tile);
            }
        }
        return result;
    }

    /**
     *
     * @param {Rectangle} tile
     * @returns {boolean}
     */
    contains(tile) {
        return this.tiles.indexOf(tile) !== -1;
    }

    /**
     *
     * @param {Vector2} result
     * @param {number} w
     * @param {number} h
     */
    findEmptySlotFor(result, w, h) {
        let found = false;

        this.computePossibleTilePositions(w, h, (_x, _y) => {
            const overlap = this.getOverlappingTilesRaw(_x, _y, w, h);

            if (overlap.length === 0) {

                result.set(_x, _y);

                found = true;

                //stop traversal
                return false;
            }
        });

        return found;
    }

    /**
     *
     * @param {number} tileWidth
     * @param {number} tileHeight
     * @param {function(x:number, y:number):*} visitor
     */
    computePossibleTilePositions(tileWidth, tileHeight, visitor) {

        for (let x = 0, w = this.size.x; x <= w - tileWidth; x++) {
            for (let y = 0, h = this.size.y; y <= h - tileHeight; y++) {
                const continueTraversal = visitor(x, y);

                if (continueTraversal === false) {
                    //visitor signalled termination of traversal
                    return;
                }
            }
        }
    }

    /**
     *
     * @param {Rectangle} tile
     */
    add(tile) {
        this.tiles.add(tile);
    }

    /**
     *
     * @param {Array.<Rectangle>} tiles
     */
    addAll(tiles) {
        this.tiles.addAll(tiles);
    }

    /**
     * Returns lambda for performing the move which will result in position change of existing tiles, or null if move is not possible
     * @param {Rectangle} tile
     * @param {Number} x
     * @param {Number} y
     * @returns {function|null}
     */
    computeMove(tile, x, y) {
        //calculate new area which would be occupied by the tile
        const tFuture = tile.clone();
        tFuture.position.set(x, y);

        //find what is occupied by that area
        const occluded = this.tiles.filter(function (t) {
            if (t === tile) {
                //ignore self
                return false;
            }
            return tFuture.overlaps(t);
        });

        /**
         *
         * @type {Array<MoveInstruction>}
         */
        const instructions = [];

        function tryAddInstruction(t, x, y) {
            for (let i = 0; i < instructions.length; i++) {
                const instruction = instructions[i];
                if (instruction.tile === t) {
                    //instruction already exists
                    return false;
                }
            }

            //no instruction for this tile exists yet, add it
            instructions.push(new MoveInstruction(t, new Vector2(x, y)));
            return true;
        }

        tryAddInstruction(tile, x, y);

        if (occluded.length !== 0) {
            //find extents of the overlapped tiles
            const overlapRegion = new Rectangle(Infinity, Infinity, -Infinity, -Infinity);

            occluded.forEach(function (t) {
                overlapRegion.resizeToFit(t);
            });

            //see if the entire region is contained within target tile area
            if (!tFuture.contains(overlapRegion)) {
                //can't do a swap
                return null;
            }

            //compute delta for occluded tiles
            const offset = tile.position.clone().sub(overlapRegion.position);

            occluded.forEach(function (t) {
                const position = t.position;
                const oldX = position.x;
                const oldY = position.y;

                const x = oldX + offset.x;
                const y = oldY + offset.y;

                tryAddInstruction(t, x, y);
            });
        }


        function result(callback) {
            if (typeof callback === "function") {
                instructions.forEach(function (instruction) {
                    const newPosition = instruction.position;
                    const tile = instruction.tile;

                    callback(tile, tile.position.x, tile.position.y, newPosition.x, newPosition.y);
                });
            }

            //execute instructions
            instructions.forEach(function (instruction) {
                instruction.execute();
            });
        }

        result.instructions = instructions;

        return result;

    }
}

class MoveInstruction {
    /**
     *
     * @param {Rectangle} tile
     * @param {Vector2} position
     * @constructor
     */
    constructor(tile, position) {
        this.tile = tile;
        this.position = position;
    }

    execute() {
        this.tile.position.copy(this.position);
    }
}


export default TileGrid;
