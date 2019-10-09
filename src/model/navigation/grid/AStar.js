import BinaryHeap from './FastBinaryHeap';
import Vector2 from '../../core/geom/Vector2';
import { assert } from "../../core/assert.js";


/**
 *
 * @param {GridField} grid
 * @param {Number} width
 * @param {Number} height
 * @param {Vector2} start
 * @param {Vector2} end
 * @param {Number} crossingPenalty
 * @param {Number} bendPenalty
 * @returns {Array.<Number>} array of indices representing path from start to end
 */
function search(grid, width, height, start, end, crossingPenalty, bendPenalty) {
    assert.notEqual(grid,undefined,'grid is undefined');
    assert.notEqual(grid,null,'grid is null');

    assert.notEqual(start,undefined,'start is undefined');
    assert.notEqual(start,null,'start is null');

    assert.notEqual(end,undefined,'end is undefined');
    assert.notEqual(end,null,'end is null');

    let limitCycles = 5000000;
    const blockValue = 255;

    const heuristic = function (index0, index1) {
        return grid.manhattanDistanceByIndices(index0, index1);
    };

    const came_from = [];
    const f_score = [];
    const g_score = [];
    const open = new BinaryHeap(function score(i1) {
        return f_score[i1];
    });
    const closed = [];

    const startIndex = grid.point2index(start.x, start.y);
    const endIndex = grid.point2index(end.x, end.y);
    g_score[startIndex] = 0;
    f_score[startIndex] = heuristic(startIndex, endIndex);
    const directionTo = [];
    directionTo[startIndex] = 0;

    open.push(startIndex);

    function pathTo(node) {
        let pP = new Vector2(-1, -1),
            pC = new Vector2();
        let dx = 1,
            dy = 1,
            _dx = 0,
            _dy = 0;
        const result = [];
        let prev = node;
        while (node !== void 0) {
            grid.index2point(node, pC);
            _dx = pC.x - pP.x;
            _dy = pC.y - pP.y;
            //
            if (_dx !== 0) {
                _dx /= Math.abs(_dx);
            }
            if (_dy !== 0) {
                _dy /= Math.abs(_dy);
            }
            if (dx !== _dx || dy !== _dy) {
                dx = _dx;
                dy = _dy;
                //only record points where connection bends to save space
                result.push(prev);
            }
            prev = node;
            node = came_from[node];
            //swap
            const t = pP;
            pP = pC;
            pC = t;
        }
        if (result[result.length - 1] !== prev) {
            //check if last node needs to be added
            result.push(prev);
        }
        result.reverse();
        return result;
    }

    const field = grid.data;
    const neighbors = [];
    while (open.size() > 0) {
        if (limitCycles-- === 0) {
            throw new Error("maximum number of cycles reached");
        }
        // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
        const currentNode = open.pop();

        // End case -- result has been found, return the traced path.
        if (currentNode === endIndex) {
            return pathTo(currentNode);
        }

        // Normal case -- move currentNode from open to closed, process each of its neighbors.
        closed[currentNode] = true;

        // Find all neighbors for the current node.
        neighbors.length = 0;
        grid.calcNeighbors(currentNode, neighbors);
        const numNeighbours = neighbors.length;
        if (numNeighbours === 0) {
            continue;
        }
        const directionToCurrent = directionTo[currentNode];
        for (let i = 0; i < numNeighbours; ++i) {
            const neighbor = neighbors[i];

            if (closed[neighbor] !== void 0) {
                // Not a valid node to process, skip to next neighbor.
                continue;
            }

            // The g score is the shortest distance from start to current node.
            // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
            const neighborValue = field[neighbor];
            if (neighborValue === blockValue) {
                //cell is blocked, cloe and continue
                closed[neighbor] = true;
                continue;
            }
            const direction = neighbor - currentNode;
            let turnValue;
            if (direction !== directionToCurrent) {
                turnValue = bendPenalty;
            } else {
                turnValue = 0;
            }
            const transitionCost = neighborValue * crossingPenalty + 1 + turnValue;

            const gScore = g_score[currentNode] + transitionCost,
                notInOpenSet = !open.contains(neighbor);

            if (notInOpenSet || gScore < g_score[neighbor]) {

                // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                came_from[neighbor] = currentNode;

                directionTo[neighbor] = direction;

                g_score[neighbor] = gScore;
                const h = heuristic(neighbor, endIndex);

                f_score[neighbor] = gScore + h;


                if (notInOpenSet) {
                    // Pushing to heap will put it in proper place based on the 'f' value.
                    open.push(neighbor);
                } else {
                    // Already seen the node, but since it has been rescored we need to reorder it in the heap
                    open.rescoreElement(neighbor);
                }
            }
        }
    }
    // No result was found - empty array signifies failure to find path.
    return [];
}

export default search;
