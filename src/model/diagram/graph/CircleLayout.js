/**
 *
 * @param {Array.<Circle>} input
 * @param {Graph} graph
 */
import Vector2 from "../../core/geom/Vector2";
import { assert } from "../../core/assert";
import AABB2 from "../../core/geom/AABB2.js";
import Circle from "../../core/geom/Circle.js";
import { max2, min2 } from "../../core/math/MathUtils.js";
import { Connection } from "./Connection.js";
import { applyCentralGravityAABB2, resolveAABB2Overlap } from "./BoxLayouter.js";
import { line2SegmentsIntersect } from "../../core/geom/LineSegment2.js";
import { v2_distance } from "../../core/geom/Vector2.js";


/**
 *
 * @param {Circle[]} circles
 */
function doLayerLayout(circles) {

    const remaining = circles.filter(function (b) {
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
            console.error("Layer is empty", remaining, circles, offsetY);
            break;
        }


        let offsetX = 0;
        let layerHeight = 0;

        for (let i = 0, l = layer.length; i < l; i++) {
            const circle = layer[i];

            const r = circle.r;

            circle.x0 = offsetX + r;
            circle.y0 = offsetY + r;

            offsetX += r;

            layerHeight = Math.max(r, layerHeight);
        }

        offsetY += layerHeight;
    }
}


/**
 * @param {{connections:Connection[]}[]} nodes
 * @return {Array}
 */
export function computeDisconnectedSubGraphs(nodes) {

    //find disconnected sub-graphs
    const unexplored = nodes.slice();

    let cursor, i;


    let currentCluster;

    function exploreNode(node) {
        const i = unexplored.indexOf(node);
        if (i !== -1) {
            unexplored.splice(i, 1);

            currentCluster.push(node);
        }
    }

    const clusters = [];

    while (unexplored.length > 0) {
        const node = unexplored.pop();

        currentCluster = [node];

        cursor = 0;
        while (cursor < currentCluster.length) {
            const node = currentCluster[cursor++];

            const connections = node.connections;

            for (i = 0; i < connections.length; i++) {
                const connection = connections[i];

                const source = connection.source;
                const target = connection.target;

                if (source === node) {
                    exploreNode(target);
                } else {
                    exploreNode(source);
                }

            }

        }

        clusters.push(currentCluster);
    }

    return clusters;
}

/**
 *
 * @param {Circle[]}input
 */
function applyClusteredLayoutStep(input) {

    const subGraphs = computeDisconnectedSubGraphs(input);

    const boundingBoxes = [];
    const boundingBoxesPositions = [];

    subGraphs.forEach(function (circles, clusterIndex) {


        //collect edges
        const connections = [];

        circles.forEach(function (circle) {
            const edges = circle.connections;
            edges.forEach(function (e) {
                if (connections.indexOf(e) === -1) {
                    connections.push(e);
                }
            });
        });

        // applyPush(circles, 0.2);
        applyNodeSwaps(circles, connections, 10);
        applyPull(connections, 0.2);
        resolveCircleOverlaps(circles, connections, 5);


        const bbox = computeBoundingBox(circles);
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
                if (box.locked) {
                    //node is locked
                    return;
                }
                box.move(dX, dY);
            });
        }
    });
}

/**
 *
 * @param {Circle[]} input
 * @param {Graph} graph
 * @param {Vector2} center
 */
export function layoutCircleGraph(input, graph, center = new Vector2()) {
    const connections = [];


    const numInputs = input.length;

    const circles = input.map(function (c) {
        const node = c.model;

        const circle = new Circle(c.x, c.y, c.r);

        circle.node = node;
        circle.source = c;
        circle.connections = [];
        circle.locked = c.locked === true;

        circle.force = new Vector2();

        return circle;
    });

    function indexByNode(n) {
        let i;
        for (i = 0; i < numInputs; i++) {
            const circle = circles[i];

            if (circle.node === n) {
                return i;
            }
        }

        return -1;
    }

    graph.traverseEdges(function (edge) {
        const first = edge.first;
        const second = edge.second;

        const i0 = indexByNode(first);
        const i1 = indexByNode(second);

        const c0 = circles[i0];
        const c1 = circles[i1];

        const connection = new Connection(c0, c1);
        connection.edge = edge;


        c0.connections.push(connection);
        c1.connections.push(connection);

        connections.push(connection);
    });

    doLayerLayout(circles);

    for (let i = 0; i < 20; i++) {
        applyClusteredLayoutStep(circles);
    }

    //global optimization phase
    resolveCircleOverlaps(circles, connections, 5);


    //align on center
    centerCircleCollectionOn(circles, center);

    //apply layout
    circles.forEach(function (b) {
        b.source.copy(b);
    });
}

/**
 * Computes a bounding box for a group of {@link Circle}s
 * @param {Circle[]} circles
 * @returns {AABB2}
 */
function computeBoundingBox(circles) {
    const footprint = new AABB2();
    footprint.setNegativelyInfiniteBounds();

    circles.forEach(function (c) {
        footprint.x0 = min2(footprint.x0, c.x - c.r);
        footprint.y0 = min2(footprint.y0, c.y - c.r);

        footprint.x1 = max2(footprint.x1, c.x + c.r);
        footprint.y1 = max2(footprint.y1, c.y + c.r);
    });

    return footprint;
}

/**
 *
 * @param {Circle[]} circles
 * @param {Vector2} center
 */
export function centerCircleCollectionOn(circles, center) {
    const bBox = computeBoundingBox(circles);
    const dX = bBox.midX() - center.x;
    const dY = bBox.midY() - center.y;
    circles.forEach(function (b) {
        if (b.locked) {
            //node is locked and can't be moved
            return;
        }

        b.move(-dX, -dY);
    });
}

/**
 *
 * @param {Connection[]} edges
 * @param {number} strength
 */
function applyPull(edges, strength) {
    const str_i = 1 - strength;

    for (let i = 0, l = edges.length; i < l; i++) {
        const edge = edges[i];

        const c0 = edge.source;
        const c1 = edge.target;

        const x0 = c0.x;
        const y0 = c0.y;

        const x1 = c1.x;
        const y1 = c1.y;

        //compute vector C1 - C0
        const dX = x1 - x0;
        const dY = y1 - y0;

        const length = Math.sqrt(dX * dX + dY * dY);

        const r0 = c0.r;
        const r1 = c1.r;

        const minD = r0 + r1;

        const fixedPull = minD * 0.01;
        const td = max2(minD, length * str_i + fixedPull);

        const m = 1 - td / length;

        const m_2 = m / 2;

        const nX = dX * m_2;
        const nY = dY * m_2;

        if (c0.locked && c1.locked) {
            //can't apply pull, both nodes are locked
            continue;
        } else if (c0.locked) {
            c1.x -= nX * 2;
            c1.y -= nY * 2;
        } else if (c1.locked) {
            c0.x += nX * 2;
            c0.y += nY * 2;
        } else {
            //neither node is locked
            c0.x += nX;
            c0.y += nY;

            c1.x -= nX;
            c1.y -= nY;
        }

    }
}


/**
 *
 * @param {Connection} edge
 * @returns {number}
 */
function evaluateEdgeCost(edge) {
    const c0 = edge.source;
    const c1 = edge.target;

    //compute center points
    const x0 = c0.x;
    const y0 = c0.y;

    const x1 = c1.x;
    const y1 = c1.y;

    return v2_distance(x0, y0, x1, y1);
}


function computeNumberOfCrossOvers(edges, numEdges) {
    let result = 0;

    let i, j;

    for (i = 0; i < numEdges; i++) {
        const e0 = edges[i];

        const a0 = e0.source;
        const a1 = e0.target;


        for (j = i + 1; j < numEdges; j++) {
            const e1 = edges[j];

            const b0 = e1.source;
            const b1 = e1.target;

            if (line2SegmentsIntersect(
                a0.x, a0.y,
                a1.x, a1.y,
                b0.x, b0.y,
                b1.x, b1.y
            )) {
                result++;
            }
        }
    }

    return result;
}

/**
 *
 * @param {Circle[]} nodes
 * @param {Connection[]} edges
 * @return {number}
 */
function computeNumberOfNodeEdgeOverlaps(nodes, edges) {
    let i, j;

    let result = 0;

    const numNodes = nodes.length;
    const numEdges = edges.length;

    for (i = 0; i < numNodes; i++) {
        const node = nodes[i];

        for (j = 0; j < numEdges; j++) {
            const edge = edges[j];

            if (circleOverlapsConnection(node, edge)) {
                result++;
            }
        }
    }

    return result;
}

/**
 *
 * @param {Circle} c0
 * @param {Circle} c1
 * @param {Circle[]} circles
 * @param {Connection[]} edges
 * @param {number} numEdges
 * @returns {boolean}
 */
function trySwap(c0, c1, circles, edges, numEdges) {
    if (c0.locked === true || c1.locked === true) {
        return false;
    }


    function evaluatePositionCost() {
        let result = 0;

        function addToCost(edge) {
            result += evaluateEdgeCost(edge);
        }

        //compute current edge cost
        c0.connections.forEach(addToCost);
        c1.connections.forEach(addToCost);

        const crossOvers = computeNumberOfCrossOvers(edges, numEdges);
        const overlaps = computeNumberOfNodeEdgeOverlaps(circles, edges);

        result += crossOvers * 1000;
        result += overlaps * 500;

        return result;
    }

    const costBefore = evaluatePositionCost();

    const tempX = c0.x;
    const tempY = c0.y;

    c0.x = c1.x;
    c0.y = c1.y;

    c1.x = tempX;
    c1.y = tempY;

    const costAfter = evaluatePositionCost();

    if (costAfter >= costBefore) {
        //revert swap

        c1.x = c0.x;
        c1.y = c0.y;

        c0.x = tempX;
        c0.y = tempY;

        return false;
    }

    return true;
}

/**
 *
 * @param {Circle[]} candidates
 * @param {number} numCandidates
 * @param {Connection[]} edges
 * @param {number} numEdges
 * @returns {number}
 */
function applyNodeSwapPass(candidates, numCandidates, edges, numEdges) {
    let swaps = 0;


    for (let i = 0; i < numCandidates; i++) {
        const b0 = candidates[i];

        if (b0.locked) {
            //locked nodes can not be moved
            continue;
        }

        for (let j = i + 1; j < numCandidates; j++) {

            const b1 = candidates[j];

            if (b1.locked) {
                //locked nodes can not be moved
                continue;
            }

            if (trySwap(b0, b1, candidates, edges, numEdges)) {
                swaps++;
            }

        }
    }

    return swaps;
}

/**
 *
 * @param {Circle[]} candidates
 * @param {Connection[]} edges
 * @param {number} allowedSteps
 * @returns {number}
 */
function applyNodeSwaps(candidates, edges, allowedSteps) {
    assert.typeOf(allowedSteps, 'number', 'allowedSteps');

    const numCandidates = candidates.length;
    const numEdges = edges.length;
    let swaps;
    do {
        swaps = applyNodeSwapPass(candidates, numCandidates, edges, numEdges);
    } while (swaps > 0 && --allowedSteps > 0);
}

/**
 *
 * @param {Circle[]} candidates
 * @param {Connection} connections
 * @return {number}
 */
function resolveCircleConnectionOverlapsStep(candidates, connections) {

    assert.ok(Array.isArray(candidates), 'candidates is not an array');
    assert.ok(Array.isArray(connections), 'connections is not an array');

    /**
     *
     * @param {Circle} circle
     * @param {Connection} connection
     */
    function resolveOverlap(circle, connection) {
        const source = connection.source;
        const target = connection.target;

        if (circle === source || circle === target) {
            //connection is attached, no overlap resolution required
            return false;
        }

        return resolveCircleLineOverlap(circle, source, target);
    }

    let overlapsResolved = 0;

    for (let i = 0, il = candidates.length; i < il; i++) {
        const circle = candidates[i];

        for (let j = 0, jl = connections.length; j < jl; j++) {

            const connection = connections[j];

            if (resolveOverlap(circle, connection)) {
                overlapsResolved++;
            }
        }
    }

    return overlapsResolved;
}

export function resolveCircleOverlaps(candidateCircles, connections, maxSteps) {
    const numCircles = candidateCircles.length;


    let totalChanges = 0;
    let stepIndex;

    for (stepIndex = 0; stepIndex < maxSteps; stepIndex++) {
        let changes = resolveCircleOverlapStep(numCircles, candidateCircles);
        changes += resolveCircleConnectionOverlapsStep(candidateCircles, connections);

        if (changes === 0) {
            break;
        }

        //apply forces
        applyCircleForces(numCircles, candidateCircles);

        totalChanges += changes;
    }

    return totalChanges;
}

/**
 *
 * @param {Circle} circle
 * @param {Connection} edge
 * @return {boolean}
 */
function circleOverlapsConnection(circle, edge) {
    const c0 = edge.source;
    const c1 = edge.target;

    const x0 = c0.x;
    const y0 = c0.y;

    const x1 = c1.x;
    const y1 = c1.y;

    const r = circle.r;
    const cX = circle.x;
    const cY = circle.y;

    //establish overlap

    //NOTE: taken from https://stackoverflow.com/questions/1073336/circle-line-segment-collision-detection-algorithm

    //Direction vector of ray, from start to end
    const dX = x1 - x0;
    const dY = y1 - y0;

    //Vector from center sphere to ray start
    const fX = x1 - cX;
    const fY = y1 - cY;

    const a = dX * dX + dY * dY;
    const b = 2 * (fX * dX + fY * dY);
    const c = (fX * fX + fY * fY) - r * r;

    const discriminantSq = b * b - 4 * a * c;
    if (discriminantSq < 0) {
        // no intersection
        return false;
    } else {
        // ray didn't totally miss sphere,
        // so there is a solution to
        // the equation.

        const discriminant = Math.sqrt(discriminantSq);

        // either solution may be on or off the ray so need to test both
        // t1 is always the smaller value, because BOTH discriminant and
        // a are nonnegative.
        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);

        // 3x HIT cases:
        //          -o->             --|-->  |            |  --|->
        // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit),

        // 3x MISS cases:
        //       ->  o                     o ->              | -> |
        // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)

        //We are only interested in Impale case

        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
            return true;
        }
    }

    return false;
}

/**
 *
 * @param {Circle} circle
 * @param {Circle} c0
 * @param {Circle} c1
 */
function resolveCircleLineOverlap(circle, c0, c1) {

    const x0 = c0.x;
    const y0 = c0.y;

    const x1 = c1.x;
    const y1 = c1.y;

    const r = circle.r;
    const cX = circle.x;
    const cY = circle.y;

    //establish overlap

    //NOTE: taken from https://stackoverflow.com/questions/1073336/circle-line-segment-collision-detection-algorithm

    //Direction vector of ray, from start to end
    const dX = x1 - x0;
    const dY = y1 - y0;

    //Vector from center sphere to ray start
    const fX = x1 - cX;
    const fY = y1 - cY;

    const a = dX * dX + dY * dY;
    const b = 2 * (fX * dX + fY * dY);
    const c = (fX * fX + fY * fY) - r * r;

    const discriminantSq = b * b - 4 * a * c;
    if (discriminantSq < 0) {
        // no intersection
        return false;
    } else {
        // ray didn't totally miss sphere,
        // so there is a solution to
        // the equation.

        const discriminant = Math.sqrt(discriminantSq);

        // either solution may be on or off the ray so need to test both
        // t1 is always the smaller value, because BOTH discriminant and
        // a are nonnegative.
        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);

        // 3x HIT cases:
        //          -o->             --|-->  |            |  --|->
        // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit),

        // 3x MISS cases:
        //       ->  o                     o ->              | -> |
        // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)

        //We are only interested in Impale case

        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
            //Impale
            const mid = (t1 + t2) / 2;

            //find closest point on the line to the circle center
            const nX = x1 + mid * dX;
            const nY = y1 + mid * dY;

            //compute distance to center
            const ndX = cX - nX;
            const ndY = cY - nY;

            const ncD = Math.sqrt(ndX * ndX + ndY * ndY);

            //compute penetration distance
            const penD = r - ncD;

            //compute exit vector
            const exitX = (ndX / ncD) * penD;
            const exitY = (ndY / ncD) * penD;


            if (circle.locked === true) {
                if (c0.locked === true) {
                    if (c1.locked === true) {
                        //no resolution possible, all objects fixed
                        return false;
                    }
                    c1.force._add(exitX, exitY);
                } else if (c1.locked) {
                    c0.force._add(exitX, exitY);
                } else {
                    //move both
                    c0.force._add(exitX, exitY);
                    c1.force._add(exitX, exitY);
                }
            } else {
                //main object is not fixed

                const exitX_2 = exitX / 2;
                const exitY_2 = exitY / 2;

                if (c0.locked === true) {
                    if (c1.locked === true) {
                        circle.force._add(-exitX, -exitY);
                    } else {
                        c1.force._add(exitX_2, exitY_2);
                        circle.force._add(-exitX_2, -exitY_2);
                    }
                } else if (c1.locked) {
                    c0.force._add(exitX_2, exitY_2);
                    circle.force._add(-exitX_2, -exitY_2);
                } else {
                    //move all both
                    c0.force._add(exitX_2, exitY_2);
                    c1.force._add(exitX_2, exitY_2);

                    circle.force._add(-exitX_2, -exitY_2);
                }
            }

            //moved stuff
            return true;
        }

        // No resolution or no overlap
        return false;
    }
}

/**
 *
 * @param {number} numCircles
 * @param {Circle[]} circles
 */
export function applyCircleForces(numCircles, circles) {
    assert.typeOf(numCircles, 'number', 'numCircles');

    for (let i = 0; i < numCircles; i++) {
        const circle = circles[i];

        const force = circle.force;

        circle.move(force.x, force.y);

        //reset forces
        force.x = 0;
        force.y = 0;
    }
}

/**
 *
 * @param {Circle[]} circles
 * @param {Vector2} target
 * @param {number} strength
 */
export function applyPullToCircles(circles, target, strength) {

    let i = 0;

    const numCircles = circles.length;

    for (; i < numCircles - 1; i++) {

        const circle = circles[i];

        const dX = target.x - circle.x;
        const dY = target.y - circle.y;

        circle.x += dX * strength;
        circle.y += dY * strength;
    }
}

/**
 *
 * @param {number} numCircles
 * @param {Circle[]} circles
 * @return {number}
 */
export function resolveCircleOverlapStep(numCircles, circles) {
    let i, j;
    let moveCount = 0;

    let mdX, mdY;

    for (i = 0; i < numCircles - 1; i++) {

        const c0 = circles[i];

        const r0 = c0.r;
        const x0 = c0.x;
        const y0 = c0.y;


        for (j = i + 1; j < numCircles; j++) {

            const c1 = circles[j];

            const r1 = c1.r;
            const x1 = c1.x;
            const y1 = c1.y;

            const dx = x1 - x0;
            const dy = y1 - y0;

            const distance = Math.sqrt(dx * dx + dy * dy);

            const minSeparation = r0 + r1;

            const overlapDistance = minSeparation - distance;

            if (overlapDistance > 0) {


                if (distance === 0) {
                    mdX = 1;
                    mdY = 0;
                } else {
                    //normalize overlap vector
                    mdX = dx / distance;
                    mdY = dy / distance;
                }

                const odX = mdX * overlapDistance;
                const odY = mdY * overlapDistance;

                if (c0.locked === true) {
                    if (c1.locked !== true) {
                        c1.force._add(odX, odY);

                        moveCount++;
                    }
                } else if (c1.locked === true) {
                    c0.force._add(-odX, -odY);

                    moveCount++;
                } else {

                    const hdX = odX / 2;
                    const hdY = odY / 2;

                    c0.force._add(-hdX, -hdY);
                    c1.force._add(hdX, hdY);

                    moveCount += 2;
                }

            }
        }
    }

    return moveCount;
}
