/**
 * Created by Alex on 05/02/14.
 */


import { computeLine2Intersection } from "../geom/LineSegment2.js";

const Utils = {};

function pointBetweenEdges(edge1, edge2, node, thickness) {
    const other1 = edge1.other(node);
    const other2 = edge2.other(node);
    const delta1 = other1.clone().sub(node);
    const delta2 = other2.clone().sub(node);
    const sum = delta2.normalize().clone().add(delta1.normalize());
    let angle = edge2.angle() - edge1.angle();
    if (angle < 0) {
        angle += Math.PI * 2;
    }
//                console.log(angle * (57.295));
    if (angle === 0) {
        //parallel edges
        sum.set(delta1.y, delta1.x);
        sum.multiplyScalar(thickness / 2);
        console.log(">");
    } else {
        const scalar = (thickness / 2) * (1 + sum.length() / 4);
        sum.normalize().multiplyScalar(scalar);
        if (angle > Math.PI) {
            console.log("<");
            sum.negate();
        }
    }
    return sum;
}

function angleDifference(edge1, edge2) {
    return edge1.angle() - edge2.angle();
}

function trace2(graph, thickness) {
    //clone graph
    const g = graph.clone();
    let closedNodes = [];
    let closedEdges = [];
    //edge needs to be covered twice to be closed
    let prevEdge, prevNode,
        currentEdge, currentNode;
    while (g.edges.length > 0) {
        //pick next edge
        const node = prevEdge.other(prevNode);
        const neighbours = g.getAttachedEdges(node);
        neighbours.sort(angleDifference);
        let index = neighbours.indexOf(prevEdge);
        index = (index + 1) % neighbours.length;
        const edge = neighbours[index];
    }
}

function makeCap(node, edge, thickness, type) {
    const result = [];
    //get direction
    const other = edge.other(node);
    const first = node.clone();
    const second = other.clone();
    const delta = second.clone().sub(first);
    const inverseDelta = delta.clone();
    //
    inverseDelta.x = delta.y;
    inverseDelta.y = -delta.x;

    inverseDelta.normalize();
    //projecting cap
    if (type === "projecting") {
        const half_thickness = thickness / 2;
        const sid = inverseDelta.clone().multiplyScalar(half_thickness);
        //projecting offset
        const offset = delta.clone().normalize().multiplyScalar(half_thickness);
        const anchor = node.clone().sub(offset);
        result.push(sid.clone().add(anchor));
        result.push(sid.negate().add(anchor));
    }
    return result;
}

function makeJoint2(node, edges, thickness) {
    const result = [];
    //sort edges by angle
    edges.sort(angleDifference);

    for (let i = 0; i < edges.length; i++) {
        const j = (i + 1) % edges.length;
        const edge1 = edges[i];
        const edge2 = edges[j];
        const sum = pointBetweenEdges(edge1, edge2, node, thickness);
        result.push({
            point: sum,
            edges: [edge1, edge2]
        })
    }
    result.forEach(function (element) {
        element.point.add(node);
    });
    return result;
}

function graph2paths(graph, thickness) {
    const points = [];
    const nodes = graph.nodes;
    //generating outline points
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const attachedEdges = graph.getAttachedEdges(node);
        const length = attachedEdges.length;
        if (length === 0) {
            //this node is not attached to any edge
            console.warn("unconnected node, not representable");
        } else if (length === 1) {
            //this is an end point
            const attachedEdge = attachedEdges[0];
            const cap = makeCap(node, attachedEdge, thickness, "projecting");
            cap.forEach(function (point) {
                points.push({ node: node, edges: [attachedEdge], position: point });
            });
        } else if (length > 1) {
            //this is a joint
            const joint = makeJoint2(node, attachedEdges, thickness, null);
            joint.forEach(function (data) {
                points.push({ node: node, edges: data.edges, position: data.point })
            });
        }
    }
    let path;

    function getCommonEdge(point1, point2) {
        const edges1 = point1.edges;
        const edges2 = point2.edges;
        const l1 = edges1.length;
        const l2 = edges2.length;
        for (let i = 0; i < l1; i++) {
            const edge1 = edges1[i];
            for (let j = 0; j < l2; j++) {
                const edge2 = edges2[j];
                if (edge1 === edge2) {
                    return edge1;
                }
            }
        }
        return null;
    }

    function lineIntersectsGraph(from, to, graph) {
        const edges = graph.edges;
        let i = 0;
        const l = edges.length;
        for (; i < l; i++) {
            const edge = edges[i];
            if (computeLine2Intersection(from, to, edge.first, edge.second)) {
                return true;
            }
        }
        return false;
    }

    function getNextPoint2(from) {
        //filter points based on common edge
        const edges0 = from.edges;
        const l0 = edges0.length;
        const candidates = [];
        points.forEach(function (point, index) {
            const edges1 = point.edges;
            const l1 = edges1.length;
            for (let i = 0; i < l0; i++) {
                const e0 = edges0[i];
                for (let j = 0; j < l1; j++) {
                    const e1 = edges1[j];
                    if (e0 === e1) {
                        //now filter out those that cross the graph
                        if (!lineIntersectsGraph(from.position, point.position, graph)) {
                            candidates.push(index);
                        }
                    }
                }
            }
        });
        if (candidates.length > 0) {
            const index = candidates[0];
            const point = points[index];
            points.splice(index, 1);
            return point;
        } else {
            console.warn("No next point from ", from);
        }

    }

    function getNextPoint(from) {
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const commonEdge = getCommonEdge(p, from);
            if (commonEdge != null) {
                //make sure line would not intersect the edge
//                        var intersects = getLineIntersection(p.position, from.position, commonEdge.first, commonEdge.second);
                const intersects = lineIntersectsGraph(p.position, from.position, graph);
                if (intersects) {
                    continue;
                }
                points.splice(i, 1);
                return p;
            }
        }
        console.warn("No next point from", from);
        return null;
    }

    function trace() {
        //pick a point
        let currentPoint = points.pop();
        let nextPoint;
        path.moveTo(currentPoint.position.x, currentPoint.position.y);
//            console.log("path.moveTo("+currentPoint.position.x+","+currentPoint.position.y+");");
        const firstPoint = currentPoint;
        for (nextPoint = getNextPoint2(currentPoint); nextPoint != null; nextPoint = getNextPoint2(currentPoint)) {
            path.lineTo(nextPoint.position.x, nextPoint.position.y);
//                console.log("path.lineTo("+nextPoint.position.x+","+nextPoint.position.y+");");
            currentPoint = nextPoint;
        }
        path.lineTo(firstPoint.position.x, firstPoint.position.y);
//            console.log("path.lineTo("+firstPoint.position.x+","+firstPoint.position.y+");");
    }

    const paths = [];
    while (points.length > 0) {
        path = new THREE.Path();
        trace();
        paths.push(path);
    }
    return paths;
}

function graph2rects(graph, thickness) {
    const edges = graph.edges;
    const paths = [];
    for (let i = 0; i < edges.length; i++) {
        const path = new THREE.Path();
        const edge = edges[i];
        //outline edge
        const cap1 = makeCap(edge.first, edge, thickness, "projecting");
        const cap2 = makeCap(edge.second, edge, thickness, "projecting");
        const points = cap1.concat(cap2);
        let point = points[0];
        path.moveTo(point.x, point.y);
        let j = 1;
        const l = points.length;
        for (; j < l + 1; j++) {
            point = points[j % l];
            path.lineTo(point.x, point.y);
        }
        paths.push(path);
    }
    return paths;
}

Utils.makeJoint2 = makeJoint2;

Utils.paths2shapes = function (paths) {
    const shapes = [];
    paths.forEach(function (path) {
        const r = path.toShapes();
        Array.prototype.push.apply(shapes, r);
    });
    return shapes;
};

Utils.graph2shapes = function (graph, thickness) {
    const paths = Utils.graph2paths(graph, thickness);
    return Utils.paths2shapes(paths);
};

Utils.graph2paths = graph2paths;

export default Utils;
