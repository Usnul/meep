/**
 *
 * @param {Array.<AABB2>} boxes
 */


import AABB2 from "../../core/geom/AABB2";
import Vector2 from "../../core/geom/Vector2";
import { Connection } from "./Connection.js";
import { computeDisconnectedSubGraphs } from "./Graph.js";


/**
 *
 * @param {Array.<AABB2>} boxes
 */
function resolveOverlapStep(boxes) {
    const forces = boxes.map(function () {
        return new Vector2(0, 0);
    });

    let moves = 0;

    const numBoxes = boxes.length;
    for (let i = 0; i < numBoxes - 1; i++) {
        const b0 = boxes[i];

        const r1Right = b0.x1;
        const r1Bottom = b0.y1;

        for (let j = i + 1; j < numBoxes; j++) {
            const b1 = boxes[j];

            //compute overlap
            const left = r1Right - b1.x0;
            if (left < 0) {
                //no overlap
                continue;
            }

            const right = b1.x1 - b0.x0;
            if (right < 0) {
                //no overlap
                continue;
            }

            const top = r1Bottom - b1.y0;
            if (top < 0) {
                //no overlap
                continue;
            }

            const bottom = b1.y1 - b0.y0;
            if (bottom < 0) {
                //no overlap
                continue;
            }

            //pick the smallest overlap value
            let dX = left < right ? -left : right;
            let dY = top < bottom ? -top : bottom;

            //pick smallest axis
            if (Math.abs(dX) < Math.abs(dY)) {
                dY = 0;
            } else {
                dX = 0;
            }

            //create separation vector
            const d = new Vector2(dX, dY);
            const halfD = d.multiplyScalar(0.5);

            const f1 = forces[i];
            const f2 = forces[j];

            //apply separation
            if (b0.locked === true && b1.locked === true) {
                continue;
            } else if (b0.locked === true) {
                f2.sub(d);
            } else if (b1.locked === true) {
                f1.add(d);
            } else {
                f1.add(halfD);
                f2.sub(halfD);
            }

            moves++;
        }
    }

    //apply forces
    for (let i = 0; i < numBoxes; i++) {
        const box = boxes[i];
        const force = forces[i];

        const dX = force.x;
        const dY = force.y;
        box.move(dX, dY);
    }

    return moves;
}

/**
 *
 * @param {AABB2[]} boxes
 * @param {number} maxSteps
 */
export function resolveAABB2Overlap(boxes, maxSteps) {
    let overlapMoves = -1;
    while (maxSteps > 0 && overlapMoves !== 0) {
        maxSteps--;
        overlapMoves = resolveOverlapStep(boxes);
    }
}

/**
 *
 * @param {Connection} edge
 * @returns {number}
 */
function evaluateEdgeCost(edge) {
    const first = edge.source;
    const second = edge.target;

    //compute center points
    const x0 = first.midX();
    const y0 = first.midY();

    const x1 = second.midX();
    const y1 = second.midY();

    return Vector2._distance(x0, y0, x1, y1);
}

/**
 * Computes a bounding box for a group of {@link AABB2}s
 * @param {AABB2[]} boxes
 * @returns {AABB2}
 */
function computeBoundingBox(boxes) {
    const footprint = new AABB2();
    footprint.setNegativelyInfiniteBounds();

    boxes.forEach(function (b) {
        footprint.expandToFit(b);
    });

    return footprint;
}

/**
 *
 * @param {Array.<AABB2>} boxes
 * @param {Array.<Connection>} edges
 * @returns {number}
 */
function evaluateLayout(boxes, edges) {
    const footprint = computeBoundingBox(boxes);

    //overall size of the layout plays a role
    const totalArea = footprint.getHeight() * footprint.getWidth();

    const totalConnectionLength = edges.reduce(function (sum, edge) {
        return sum + evaluateEdgeCost(edge);
    }, 0);

    return totalConnectionLength + totalArea * 0.1;
}

/**
 *
 * @param {AABB2} box0
 * @param {AABB2} box1
 * @returns {boolean}
 */
function trySwap(box0, box1) {
    if (box0.locked === true || box1.locked === true) {
        return false;
    }

    function evaluatePositionCost() {
        let result = 0;

        function addToCost(edge) {
            result += evaluateEdgeCost(edge);
        }

        //compute current edge cost
        box0.connections.forEach(addToCost);
        box1.connections.forEach(addToCost);

        return result;
    }

    const costBefore = evaluatePositionCost();

    const temp = new AABB2();
    temp.copy(box0);
    box0.copy(box1);
    box1.copy(temp);

    const costAfter = evaluatePositionCost();

    if (costAfter > costBefore) {
        //revert swap

        box1.copy(box0);
        box0.copy(temp);

        return false;
    }

    return true;
}

/**
 *
 * @param {Array.<AABB2>} boxes
 * @returns {number}
 */
function applyNodeSwapPass(boxes) {
    let swaps = 0;

    const numBoxes = boxes.length;

    for (let i = 0; i < numBoxes; i++) {
        const b0 = boxes[i];
        for (let j = i + 1; j < numBoxes; j++) {
            const b1 = boxes[j];
            if (trySwap(b0, b1)) {
                swaps++;
            }
        }
    }

    return swaps;
}

/**
 *
 * @param {Array.<AABB2>} boxes
 * @param {number} allowedSteps
 * @returns {number}
 */
function applyNodeSwaps(boxes, allowedSteps) {
    let swaps;
    do {
        swaps = applyNodeSwapPass(boxes);
    } while (swaps > 0 && --allowedSteps > 0);
}

/**
 *
 * @param {Array.<Connection>} edges
 * @param {number} strength
 */
function applyPull(edges, strength) {
    const d = new Vector2();
    for (let i = 0, l = edges.length; i < l; i++) {
        const edge = edges[i];

        const first = edge.source;
        const second = edge.target;

        d.set(second.midX(), second.midY());
        d._sub(first.midX(), first.midY());

        d.multiplyScalar(strength);

        //apply pull
        first.move(d.x, d.y);
        second.move(-d.x, -d.y);
    }
}

/**
 *
 * @param {AABB2} box
 * @param {number} targetX target point X coordinate
 * @param {number} targetY target point Y coordinate
 * @param {number} strength
 */
export function pullBoxTowardsPoint(box, targetX, targetY, strength) {
    const midX = box.midX();
    const midY = box.midY();

    const deltaX = targetX - midX;
    const deltaY = targetY - midY;

    //multiply by strength
    const displacementX = deltaX * strength;
    const displacementY = deltaY * strength;

    box.move(displacementX, displacementY);
}

/**
 *
 * @param {Array.<AABB2>} boxes
 * @returns {Vector2}
 */
function computeCenter(boxes) {
    const numBoxes = boxes.length;

    const center = new Vector2();
    for (let i = 0; i < numBoxes; i++) {
        const box = boxes[i];
        center._add(box.midX(), box.midY());
    }
    center.multiplyScalar(1 / numBoxes);

    return center;
}

/**
 *
 * @param {Array.<AABB2>} boxes
 * @param {number} strength
 */
export function applyCentralGravityAABB2(boxes, strength) {
    const numBoxes = boxes.length;

    const center = computeCenter(boxes);

    const delta = new Vector2();
    for (let i = 0; i < numBoxes; i++) {
        const box = boxes[i];

        if (box.locked === true) {
            continue;
        }

        delta.copy(center);
        delta._sub(box.midX(), box.midY());

        delta.multiplyScalar(strength);

        box.move(delta.x, delta.y);
    }
}


function resolveBoxConnectionOverlaps(boxes, connections, maxSteps) {
    for (let i = 0; i < maxSteps; i++) {
        const shiftsMade = resolveBoxConnectionOverlapsStep(boxes, connections);
        if (shiftsMade === 0) {
            //we're done, no changes were made
            break;
        }
    }
}

function resolveBoxConnectionOverlapsStep(boxes, connections) {
    const forces = new Map();
    //initialize forces
    boxes.forEach(b => forces.set(b, new Vector2()));

    function addForce(box, x, y) {
        const force = forces.get(box);
        force._add(x, y);
    }

    /**
     *
     * @param {AABB2} box
     * @param {Connection} connection
     */
    function resolveOverlap(box, connection) {
        const source = connection.source;
        const target = connection.target;

        if (box === source || box === target) {
            //connection is attached to the box, no overlap resolution required
            return false;
        }

        const p0 = new Vector2();
        const p1 = new Vector2();

        AABB2.computeLineBetweenTwoBoxes(source, target, p0, p1);

        const intersectionPoint = new Vector2();
        const intersectionExists = box.lineIntersectionPoint(p0, p1, intersectionPoint);

        if (!intersectionExists) {
            return false;
        }

        //localize intersection point
        const left = intersectionPoint.x - box.x0;
        const right = box.x1 - intersectionPoint.x;
        const top = intersectionPoint.y - box.y0;
        const bottom = box.y1 - intersectionPoint.y;

        //figure out smallest move necessary to resolve overlap

        const move = new Vector2(0, 0);
        if (left !== 0 && right !== 0) {
            if (left < right) {
                //move right
                move.x = left;
            } else {
                move.x = -right;
            }
        } else {
            if (top < bottom) {
                move.y = top;
            } else {
                move.y = -bottom;
            }
        }

        const dy = move.y / 2;
        const dx = move.x / 2;

        if (box.locked !== true) {
            addForce(box, dx, dy);
        }

        //nudge connected pair other way
        if (source.locked !== true) {
            addForce(source, -dx, -dy);
        }
        if (target.locked !== true) {
            addForce(target, -dx, -dy);
        }

        return true;
    }

    let overlapsResolved = 0;

    for (let i = 0, il = boxes.length; i < il; i++) {
        const box = boxes[i];
        for (let j = 0, jl = connections.length; j < jl; j++) {
            const connection = connections[j];
            if (resolveOverlap(box, connection)) {
                overlapsResolved++;
            }
        }
    }

    forces.forEach(function (force, box) {
        box.move(force.x, force.y);
    });

    return overlapsResolved;
}

function applyClusteredLayoutStep(boxes) {

    const subGraphs = computeDisconnectedSubGraphs(boxes);

    const boundingBoxes = [];
    const boundingBoxesPositions = [];

    subGraphs.forEach(function (boxes, clusterIndex) {


        //collect edges
        const connections = [];

        boxes.forEach(function (box) {
            const edges = box.connections;
            edges.forEach(function (e) {
                if (connections.indexOf(e) === -1) {
                    connections.push(e);
                }
            });
        });

        applyPull(connections, 0.2);
        applyNodeSwaps(boxes);
        resolveAABB2Overlap(boxes, 3);
        resolveBoxConnectionOverlaps(boxes, connections, 3);


        const bbox = computeBoundingBox(boxes);
        boundingBoxes[clusterIndex] = bbox;
        boundingBoxesPositions[clusterIndex] = new Vector2(bbox.x0, bbox.y0);
    });


    //apply gravity to clusters as a whole
    applyCentralGravityAABB2(boundingBoxes, 0.3);

    resolveAABB2Overlap(boundingBoxes, 20);

    //translate original boxes
    boundingBoxes.forEach(function (bbox, clusterIndex) {
        const bboxOrigin = boundingBoxesPositions[clusterIndex];
        const dX = bbox.x0 - bboxOrigin.x;
        const dY = bbox.y0 - bboxOrigin.y;
        if (dX !== 0 || dY !== 0) {
            //box moved
            const clusterBoxes = subGraphs[clusterIndex];
            clusterBoxes.forEach(function (box) {
                box.move(dX, dY);
            });
        }
    });
}

function doLayerLayout(boxes) {

    const remaining = boxes.filter(function (b) {
        return b.locked !== true;
    });

    function buildLayer() {
        const layer = [];

        main_loop:for (let i = remaining.length - 1; i >= 0; i--) {
            const box = remaining[i];
            const connections = box.connections;

            for (let j = 0; j < connections.length; j++) {
                const connection = connections[j];

                const source = connection.source;
                if (source !== box && remaining.indexOf(source) !== -1) {
                    //not closed yet
                    continue main_loop;
                }
            }

            remaining.splice(i, 1);

            //all sources are already laid out
            layer.push(box);
        }

        return layer;
    }

    let offsetY = 0;
    while (remaining.length > 0) {
        const layer = buildLayer();

        if (layer.length === 0) {
            console.error("Layer is empty", remaining, boxes, offsetY);
            break;
        }


        let offsetX = 0;
        let layerHeight = 0;

        for (let i = 0, l = layer.length; i < l; i++) {
            const box = layer[i];

            const y0 = box.y0;
            const y1 = box.y1;
            const x0 = box.x0;
            const x1 = box.x1;

            const h = y1 - y0;
            const w = x1 - x0;

            box.y0 = offsetY;
            box.y1 = offsetY + h;

            box.x0 = offsetX;
            box.x1 = offsetX + w;

            offsetX += w;

            layerHeight = Math.max(h, layerHeight);
        }

        offsetY += layerHeight;
    }
}

/**
 * Note: assumes that boxes to be contained are strictly smaller than the container in both dimensions
 * @param {AABB2} container
 * @param {Array.<AABB2>} boxes
 */
function forceIntoBox(container, boxes) {
    for (let i = 0, l = boxes.length; i < l; i++) {
        const box = boxes[i];

        if (box.locked === true) {
            continue;
        }

        let dX = 0;
        let dY = 0;

        const bx0 = box.x0;
        const bx1 = box.x1;

        const by0 = box.y0;
        const by1 = box.y1;

        const cx0 = container.x0;
        const cx1 = container.x1;

        const cy0 = container.y0;
        const cy1 = container.y1;

        if (bx0 < cx0) {
            dX = cx0 - bx0;
        } else if (bx1 > cx1) {
            dX = cx1 - bx1;
        }

        if (by0 < cy0) {
            dY = cy0 - by0;
        } else if (by1 > cy1) {
            dY = cy1 - by1;
        }

        box.move(dX, dY);
    }
}

/**
 *
 * @param {AABB2[]} boxes
 * @param {Vector2} center
 */
export function centerAABB2CollectionOn(boxes, center) {
    const bBox = computeBoundingBox(boxes);
    const dX = bBox.midX() - center.x;
    const dY = bBox.midY() - center.y;
    boxes.forEach(function (b) {
        b.move(-dX, -dY);
    });
}

function alignOnOrigin(boxes) {
    const bBox = computeBoundingBox(boxes);
    boxes.forEach(function (b) {
        b.move(-bBox.x0, -bBox.y0);
    });
}

/**
 *
 * @param {Array.<AABB2>} input
 * @param {Graph} graph
 * @param center
 */
function forceLayout(input, graph, center = null) {
    if (input.length === 0) {
        //nothing to layout, we're done
        return;
    }

    const connections = [];


    const boxes = input.map(function (b) {
        const node = b.model;

        const box = new AABB2(b.x0, b.y0, b.x1, b.y1);

        box.node = node;
        box.source = b;
        box.connections = [];
        box.locked = b.locked === true;

        return box;
    });

    graph.traverseEdges(function (edge) {
        const first = edge.first;
        const second = edge.second;

        const firstBox = boxes.find(function (box) {
            return box.node === first;
        });

        const secondBox = boxes.find(function (box) {
            return box.node === second;
        });


        const connection = new Connection(firstBox, secondBox);
        connection.edge = edge;

        firstBox.connections.push(connection);
        secondBox.connections.push(connection);

        connections.push(connection);
    });


    let constBefore = evaluateLayout(boxes, connections);

    function step() {
        applyClusteredLayoutStep(boxes);
        // applyGravityClustered(boxes, 0.05);
        // applyPull(connections, 0.2);
        // applyNodeSwaps(boxes);
        // resolveOverlap(boxes);
    }

    console.time("layout");


    doLayerLayout(boxes);

    for (let i = 0; i < 20; i++) {
        step();
    }

    for (let i = 0; i < 10; i++) {
        resolveBoxConnectionOverlaps(boxes, connections, 20);
        resolveAABB2Overlap(boxes, 20);
    }

    console.timeEnd("layout");

    const costAfter = evaluateLayout(boxes, connections);

    console.log("Fitness change:", constBefore - costAfter);


    if (center !== null) {
        //align on center
        centerAABB2CollectionOn(boxes, center);
    } else {
        //re-center boxes
        alignOnOrigin(boxes);
    }

    //apply layout
    boxes.forEach(function (b) {
        b.source.copy(b);
    });
}

export {
    forceLayout,
    alignOnOrigin,
    forceIntoBox
};
