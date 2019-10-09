/**
 * User: Alex Goldring
 * Date: 3/28/2014
 * Time: 6:40 PM
 */
const Node = function (face) {
    this.face = face;
    this.position = function () {
        return face.centroid();
    };
    this.distanceTo = function (other) {
        return this.position().distanceTo(other.position());
    };
};
const Edge = function (edge, n0, n1) {
    this.edge = edge;
    this.n0 = n0;
    this.n1 = n1;
    this.clearance = function () {
        return this.edge.length();
    };
    this.length = function () {
        this.n0.distanceTo(this.n1);
    };
    this.containsNode = function (node) {
        return this.n0 == node || this.n1 == node;
    };
    this.getOtherNode = function (node) {
        if (node == this.n0) {
            return this.n1;
        } else {
            return this.n0;
        }
    };
};
const Graph = function () {
    this.nodes = [];
    this.edges = [];
};
Graph.prototype.nodeIndex = function (node) {
    return this.nodes.indexOf(node);
};
Graph.prototype.getNeighbours = function (nodeIndex) {
    const node = this.nodes[nodeIndex];
    const attachedEdges = this.edges.filter(function (edge) {
        return edge.containsNode(node);
    });
    const result = attachedEdges.map(function (edge) {
        return edge.getOtherNode(node);
    });
    return result;
};
Graph.prototype.constructFromMesh = function (mesh) {
    //create nodes out of mesh faces
    const nodes = mesh.faces.map(function (face) {
        return new Node(face);
    });
    //create edges between nodes
    const edges = mesh.edges.filter(function (edge) {
        return edge.isPortal();
    }).map(function (edge) {
        //find faces connected by this edge
        const f0 = edge.symedge.fac();
        const f1 = edge.symedge.sym().fac();
        //find nodes matching faces
        const ns = nodes.filter(function (node) {
            return node.face == f0 || node.face == f1;
        });
        return new Edge(edge, ns[0], ns[1]);
    });
    this.nodes = nodes;
    this.edges = edges;
};
Graph.prototype.makeClearanceRestrictedView = function (clearance) {
    const result = new Graph();
    //copy all nodess
    result.nodes = this.nodes.slice();
    //only copy the edges that have enough clearance
    result.edges = this.edges.filter(function (edge) {
        return edge.clearance() >= clearance;
    });
    return result;
};
export default Graph;
