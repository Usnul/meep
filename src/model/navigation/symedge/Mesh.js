/**
 * User: Alex Goldring
 * Date: 3/27/2014
 * Time: 9:31 PM
 */
import SymEdge from './SymEdge';
import Edge from './Edge';

const Mesh = function () {
    this.edges = [];
    this.vertices = [];
    this.faces = [];
};
Mesh.prototype.buildEdges = function () {
    this.edges = [];
    const faces = this.faces;
    const numFaces = faces.length;
    //build common edges
    let i;
    for (i = 0; i < numFaces; i++) {
        const f0 = faces[i];
        for (let j = i + 1; j < numFaces; j++) {
            const f1 = faces[j];
            const commonVertices = f0.findCommonVerticesWith(f1);
            if (commonVertices.length === 2) {
                const v0 = commonVertices[0];
                const v1 = commonVertices[1];
                const edge = new Edge(v0, v1);
                const i0 = f0.calculateEdgeIndexFromVertices(v0, v1);
                f0["e" + i0] = edge;
                const i1 = f1.calculateEdgeIndexFromVertices(v0, v1);
                f1["e" + i1] = edge;
                this.edges.push(edge);
            } else if (commonVertices.length === 3) {
                console.warn("All 3 vertices match");
            }
        }
    }
    console.log("constructed " + this.edges.length + " common edges");
    //build unique individual edges that aren't shared between faces
    for (i = 0; i < numFaces; i++) {
        const face = faces[i];
        const v0 = face.v0;
        const v1 = face.v1;
        const v2 = face.v2;

        if (face.e0 == null) {
            face.e0 = new Edge(v0, v1);
            this.edges.push(face.e0);
        }
        if (face.e1 == null) {
            face.e1 = new Edge(v1, v2);
            this.edges.push(face.e1);
        }
        if (face.e2 == null) {
            face.e2 = new Edge(v2, v0);
            this.edges.push(face.e2);
        }
    }
    console.log("constructed " + this.edges.length + " unique edges");
};
Mesh.prototype.getSymEdgeByFEV = function (face, edge, vertex) {
    for (let i = 0; i < this.symedges.length; i++) {
        const symedge = this.symedges[i];
        if (symedge.fac() === face && symedge.edg() === edge && symedge.vtx() === vertex) {
            return symedge;
        }
    }
    return null;
};
Mesh.prototype.linkElements = function () {
    //link
};
Mesh.prototype.buildSymEdges = function () {
    const symedges = [];
    let i;
    let s0, s1, s2;
    for (i = 0; i < this.faces.length; i++) {
        const face = this.faces[i];
        //make symedges
        s0 = new SymEdge();
        s1 = new SymEdge();
        s2 = new SymEdge();
        //assign next
        s0._next = s1;
        s1._next = s2;
        s2._next = s0;
        //assign face
        s0._face = s1._face = s2._face = face;
        //assign edge
        s0._edge = face.e0;
        s1._edge = face.e1;
        s2._edge = face.e2;
        //assign node
        s0._vertex = face.v0;
        s1._vertex = face.v1;
        s2._vertex = face.v2;
        //push
        symedges.push(s0, s1, s2);
    }
    //set "rotate" attribute on symedges
    for (i = 0; i < symedges.length; i++) {
        s0 = symedges[i];
        if (s0._rotate == null) {
            //find counterpart
            for (let j = 0; j < symedges.length; j++) {
                s1 = symedges[j];
                if (s1.vtx() === s0.vtx() && s1.edg() === s0.nxt().nxt().edg()) {
                    s0._rotate = s1;
                    break;
                }
            }
        }
    }
    //clear element symedge attribute
    this.edges.forEach(function (edge) {
        edge.symedge = null;
    });
    this.vertices.forEach(function (vertex) {
        vertex.symedge = null;
    });
    this.faces.forEach(function (face) {
        face.symedge = null;
    });
    //set element attributes
    symedges.forEach(function (symedge) {
        const edge = symedge.edg();
        const face = symedge.fac();
        const vertex = symedge.vtx();
        if (edge.symedge == null) {
            edge.symedge = symedge;
        }
        if (face.symedge == null) {
            face.symedge = symedge;
        }
        if (vertex.symedge == null) {
            vertex.symedge = symedge;
        }
    });
    this.symedges = symedges;
};
export default Mesh;
