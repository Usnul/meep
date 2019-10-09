/**
 * User: Alex Goldring
 * Date: 3/27/2014
 * Time: 9:05 PM
 */


export default function (startNodeIndex, goalNodeIndex, graph) {
    const start = graph.nodes[startNodeIndex];
    const goal = graph.nodes[goalNodeIndex];

    function distance_between(from, to) {
        return from.distanceTo(to);
    }

    function heuristic_cost_estimate(from, to) {
        return distance_between(from, to);
    }

    //do search
    const closedSet = [];
    //add all portals from start cell to open set
    const openset = [startNodeIndex];

    function sortOpensetByFScore() {
        openset.sort(function (a, b) {
            return f_score[a] - f_score[b];
        });
    }

    const came_from = [];
    const g_score = [];
    const f_score = [];
    //set g_score and f_score for initial portals
    g_score[startNodeIndex] = 0;
    f_score[startNodeIndex] = 0 + distance_between(start, goal);

    function reconstruct_path(to) {
        const result = [];
        let t = to;
        while (t != undefined) {
            result.push(t);
            if (came_from.hasOwnProperty(t)) {
                t = came_from[t];
            } else {
                break;
            }
        }
        result.reverse();
        return result;
    }

    //main loop
    while (openset.length > 0) {
        const currentNodeIndex = openset.shift();
        if (currentNodeIndex == goalNodeIndex) {
            return reconstruct_path(currentNodeIndex);
        }
        const current = graph.nodes[currentNodeIndex];
        closedSet.push(currentNodeIndex);
        const neighbor_nodes = graph.getNeighbours(currentNodeIndex);
        for (let i = 0; i < neighbor_nodes.length; i++) {
            const neighbor = neighbor_nodes[i];
            const neighborIndex = graph.nodeIndex(neighbor);
            if (closedSet.indexOf(neighborIndex) >= 0) {
                continue;
            }
            const tentative_g_score = g_score[currentNodeIndex] + distance_between(current, neighbor);
            if (openset.indexOf(neighborIndex) < 0 || tentative_g_score < g_score[neighborIndex]) {
                came_from[neighborIndex] = currentNodeIndex;
                g_score[neighborIndex] = tentative_g_score;
                f_score[neighborIndex] = g_score[neighborIndex] + heuristic_cost_estimate(neighbor, goal);
                if (openset.indexOf(neighborIndex) < 0) {
                    openset.push(neighborIndex);
                    sortOpensetByFScore();
                }
            }
        }
    }
    throw new Error("failed to find path");
}
