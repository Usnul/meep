/**
 * User: Alex Goldring
 * Date: 3/28/2014
 * Time: 6:01 PM
 */
import FaceGraph from './Graph';
import findPathViaGraph from './GraphPathFinder';

/**
 * This is a simple planner which only takes clearence into consideration
 */
const Planner = function (symEdgeMesh) {
    this.mesh = symEdgeMesh;
    const graph = new FaceGraph();
    graph.constructFromMesh(this.mesh);
    this.graph = graph;
};

Planner.prototype.findPath = function (fromVector, toVector, clearance) {
    //restrict the graph to specific clearance
    const restrictedGraph = this.graph.makeClearanceRestrictedView(clearance);
    //find path via restricted graph
    return findPathViaGraph(fromVector, toVector, restrictedGraph, clearance);
};
export default Planner;
