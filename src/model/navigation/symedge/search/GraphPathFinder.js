/**
 * User: Alex Goldring
 * Date: 3/28/2014
 * Time: 8:54 PM
 */
import aStarSearch from './AStar';
import Funnel from '../../funnel/Funnel';

function projectPoint(point3D) {

    return { x: point3D.x, y: point3D.z };
}


function funnelEdgePath(fromVector, toVector, edgePath, clearance) {

    //create a funnel channel
    const funnel = new Funnel();
    //add start point to the funnel
    funnel.push(projectPoint(fromVector));
    //add portals to the funnel
    edgePath.forEach(function (edge) {

        //determine order
        funnel.push(projectPoint(edge.v0), projectPoint(edge.v1));
    });
    //add end point to the funnel
    funnel.push(projectPoint(toVector));
    funnel.fixLeftRight();
    funnel.stringPull(clearance);
    const result = funnel.path.map(function (p) {

        return { x: p.x, y: 0, z: p.y };
    });
    return result;
}

export default function (fromVector, toVector, graph, clearance) {
    let i;
    const nodes = graph.nodes;
    let startNodeIndex = -1;
    let goalNodeIndex = -1;
    for (i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const face = node.face;
        if (startNodeIndex < 0 && face.containsPoint(fromVector)) {
            startNodeIndex = i;
            if (goalNodeIndex >= 0) {
                break;
            }
        }
        if (goalNodeIndex < 0 && face.containsPoint(toVector)) {
            goalNodeIndex = i;
            if (startNodeIndex >= 0) {
                break;
            }
        }
    }
    if (startNodeIndex < 0) {
        throw  new Error("could not find face that would contain start point");
    } else if (goalNodeIndex < 0) {
        throw  new Error("could not find face that would contain goal point");
    }
    if (startNodeIndex == goalNodeIndex) {
        //start and goal are in the same face - path is a straight line
        return [fromVector, toVector];
    }
    const indexPath = aStarSearch(startNodeIndex, goalNodeIndex, graph);
    const path = indexPath.map(function (i) {
        return nodes[i];
    });
    //process path of nodes into points
    const pathLength = path.length;
    const edgePath = [];
    for (i = 0; i < pathLength - 1; i++) {
        const first = path[i];
        const second = path[i + 1];
        const commonEdge = first.face.findCommonEdgeWith(second.face);
        if (commonEdge == null) {
            throw new Error("two adjacent faces in the path do not share a common edge");
        }
        edgePath.push(commonEdge);
    }
    const result = funnelEdgePath(fromVector, toVector, edgePath, clearance);
    return result;
}
