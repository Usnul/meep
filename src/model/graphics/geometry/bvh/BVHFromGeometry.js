/**
 * Created by Alex on 02/09/2015.
 */
import { BinaryNode } from '../../../core/bvh2/BinaryNode';

function faceToBox(f, vertices) {
    const a = vertices[f.a];
    const b = vertices[f.b];
    const c = vertices[f.c];
    //make a box
    const x0 = Math.min(a.x, b.x, c.x),
        y0 = Math.min(a.y, b.y, c.y),
        z0 = Math.min(a.z, b.z, c.z),
        x1 = Math.max(a.x, b.x, c.x),
        y1 = Math.max(a.y, b.y, c.y),
        z1 = Math.max(a.z, b.z, c.z);
    return {
        x0: x0,
        y0: y0,
        z0: z0,
        x1: x1,
        y1: y1,
        z1: z1,
        object: f
    };
}

function fillTree(faces, vertices, tree) {
    const numFaces = faces.length;
    let a, b, c;
    //make a box
    let x0, y0, z0, x1, y1, z1;
    let face;

    function processLeaf(leaf, index) {
        face = faces[index];
        a = vertices[face.a];
        b = vertices[face.b];
        c = vertices[face.c];

        //make a box
        x0 = Math.min(a.x, b.x, c.x);
        y0 = Math.min(a.y, b.y, c.y);
        z0 = Math.min(a.z, b.z, c.z);
        x1 = Math.max(a.x, b.x, c.x);
        y1 = Math.max(a.y, b.y, c.y);
        z1 = Math.max(a.z, b.z, c.z);

        //set node
        leaf.setBounds(x0, y0, z0, x1, y1, z1);
        leaf.object = face;
    }

    tree.insertManyBoxes2(processLeaf, numFaces);
}

function bvhFromGeometry(geometry) {
    //console.time("building geometry bvh");
    const tree = new BinaryNode();
    tree.setNegativelyInfiniteBounds();
    const vertices = geometry.vertices;
    const faces = geometry.faces;

    fillTree(faces, vertices, tree);

    //console.timeEnd("building geometry bvh");
    //
    //console.log("built bvh for " + faces.length + " faces");
    return tree;
}

export default bvhFromGeometry;