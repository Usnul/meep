/**
 * @param {{connections:Connection[]}[]} nodes
 * @return {Array}
 */
export function computeDisconnectedSubGraphs(nodes) {
    //find disconnected sub-graphs
    const unexplored = nodes.slice();

    const clusters = [];

    while (unexplored.length > 0) {


        const node = unexplored.pop();

        const currentCluster = [node];

        let cursor = 0;
        while (cursor < currentCluster.length) {
            const node = currentCluster[cursor++];

            node.connections.map(function (connection) {
                const source = connection.source;
                const target = connection.target;
                if (source === node) {
                    return target;
                } else {
                    return source;
                }
            }).forEach(function (node) {
                const i = unexplored.indexOf(node);
                if (i !== -1) {
                    unexplored.splice(i, 1);
                    currentCluster.push(node);
                }
            });
        }

        clusters.push(currentCluster);
    }

    return clusters;
}