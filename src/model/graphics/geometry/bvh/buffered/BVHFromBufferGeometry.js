/**
 * Created by Alex on 04/05/2016.
 */
import { BinaryNode } from '../../../../core/bvh2/BinaryNode';
import { LeafNode } from '../../../../core/bvh2/LeafNode';
import IndexedTriangleBoundsComputer from './IndexedTraingleBoundsComputer';

import { buildUnsorted as buildUnsortedBinaryBVH } from './BinaryBVHFromBufferGeometry';

const makeTriangle = IndexedTriangleBoundsComputer.compute;

/**
 *
 * @param object
 * @param {number|uint} a
 * @param {number|uint} b
 * @param {number|uint} c
 * @param {Float32Array|Float64Array} vertices
 */
function makeTriangleLeaf(object, a, b, c, vertices) {
    return makeTriangle(a, b, c, vertices, function (x0, y0, z0, x1, y1, z1) {
        return new LeafNode(object, x0, y0, z0, x1, y1, z1);
    });
}

/**
 *
 * @param {Uint32Array|Uint16Array|Uint8Array} indices
 * @param {Float32Array|Float64Array} vertices
 * @param {BinaryNode} tree
 */
function fillTree(indices, vertices, tree) {
    const numFaces = indices.length / 3;
    let iA, iB, iC;

    function processLeaf(index) {
        const index3 = index * 3;

        iA = indices[index3];
        iB = indices[index3 + 1];
        iC = indices[index3 + 2];

        return makeTriangleLeaf(index, iA * 3, iB * 3, iC * 3, vertices);
    }

    tree.insertManyBoxes2(processLeaf, numFaces);
}

/**
 *
 * @param {BufferGeometry} geometry
 * @returns {BinaryNode}
 */
function bvhFromGeometry(geometry) {
    // console.profile( "building geometry bvh" );
    const tree = new BinaryNode();
    tree.setNegativelyInfiniteBounds();
    const vertices = geometry.getAttribute('position').array;
    const indices = geometry.getIndex().array;

    fillTree(indices, vertices, tree);

    // console.profileEnd( "building geometry bvh" );
    //
    //console.log("built bvh for " + faces.length + " faces");
    return tree;
}

/**
 *
 * @param {THREE.BufferGeometry} geometry
 * @returns {BinaryNode}
 */
function buildUnsorted(geometry) {
    const tree = new BinaryNode();
    tree.setNegativelyInfiniteBounds();
    //
    const index = geometry.index;
    const indices = index.array;
    const vertices = geometry.attributes.position.array;

    let numNodes = indices.length / 3;
    let i, n;
    //create leaf nodes
    const nodes = new Array(numNodes);
    let iA, iB, iC;


    for (i = 0; i < numNodes; i++) {
        //leaf needs to be set up inside the callback
        const index3 = i * 3;

        iA = indices[index3];
        iB = indices[index3 + 1];
        iC = indices[index3 + 2];
        nodes[i] = makeTriangleLeaf(i, iA * 3, iB * 3, iC * 3, vertices);
    }
    while (numNodes > 2) {
        //sort leafs

        //pair
        for (i = 0; i < numNodes; i += 2) {
            const a = nodes[i];
            const b = nodes[i + 1];
            n = new BinaryNode();
            n.setChildren(a, b);
            nodes[i >> 1] = n;
        }
        numNodes = (numNodes >> 1) + numNodes % 2;
        //nodes.length = numNodes;
    }
    //finally insert these boxes from this node
    nodes.length = numNodes;
    for (i = 0; i < numNodes; i++) {
        n = nodes[i];
        tree.insertNode(n);
    }
    return tree;
}


export default {
    build: bvhFromGeometry,
    buildUnsorted: buildUnsorted,
    setFaceBounds: makeTriangleLeaf,
    buildUnsortedBinaryBVH: function (geometry) {

        const index = geometry.index;
        const indices = index.array;
        const vertices = geometry.attributes.position.array;
        return buildUnsortedBinaryBVH(vertices, indices);
    }
};