/**
 * Created by Alex on 17/11/2014.
 */
import { Box3, BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three';


/**
 *
 * @param {BinaryNode|LeafNode} tree
 * @returns {BufferGeometry}
 * @constructor
 */
function BVHGeometry(tree) {
    //create array of positions
    const aVertices = [];
    let numVertices = 0;

    const aIndices = [];
    let numFaces = 0;

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {number}
     */
    function makeVertex(x, y, z) {

        aVertices.push(x);
        aVertices.push(y);
        aVertices.push(z);

        return numVertices++;
    }

    /**
     *
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     */
    function makeQuad(a, b, c, d) {
        aIndices.push(a);
        aIndices.push(b);
        aIndices.push(c);
        //
        aIndices.push(a);
        aIndices.push(c);
        aIndices.push(d);

        numFaces += 2;
    }

    /**
     *
     * @param {number} x0
     * @param {number} y0
     * @param {number} z0
     * @param {number} x1
     * @param {number} y1
     * @param {number} z1
     */
    function makeCube(x0, y0, z0, x1, y1, z1) {
        //near
        const ntl = makeVertex(x0, y0, z0),
            nbl = makeVertex(x0, y1, z0),
            nbr = makeVertex(x1, y1, z0),
            ntr = makeVertex(x1, y0, z0),        //far
            ftl = makeVertex(x0, y0, z1),
            fbl = makeVertex(x0, y1, z1),
            fbr = makeVertex(x1, y1, z1),
            ftr = makeVertex(x1, y0, z1);
        //make faces
        makeQuad(ntl, ntr, nbr, nbl); //near
        makeQuad(fbl, fbr, ftr, ftl); //far
        makeQuad(ftl, ftr, ntr, ntl); //top
        makeQuad(nbl, nbr, fbr, fbl); //bottom
        makeQuad(ftl, ntl, nbl, fbl); //left
        makeQuad(fbr, nbr, ntr, ftr); //right
    }

    /**
     *
     * @param {BinaryNode|LeafNode} n
     */
    function processNode(n) {

        const x0 = n.x0;
        const y0 = n.y0;
        const z0 = n.z0;
        const x1 = n.x1;
        const y1 = n.y1;
        const z1 = n.z1;
        if (n.isBinaryNode) {
            if (n.left !== null) {
                processNode(n.left);
            }
            if (n.right !== null) {
                processNode(n.right);
            }
        } else {
            makeCube(x0, y0, z0, x1, y1, z1);
        }
    }

    const root = tree;

    processNode(root);

    //convert positions and indices to buffer geometry
    const positions = new Float32Array(numVertices * 3);
    const indices = new Uint32Array(numFaces * 3);
    //

    //copy
    positions.set(aVertices, 0);
    indices.set(aIndices, 0);

    const geometry = new BufferGeometry();

    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.addAttribute('position', new BufferAttribute(positions, 3));

    const box3 = geometry.boundingBox = new Box3(new Vector3(root.x0, root.y0, root.z0), new Vector3(root.x1, root.y1, root.z1));
    geometry.boundingSphere = new Sphere(box3.min.clone().add(box3.max).multiplyScalar(0.5), box3.max.clone().sub(box3.min).length());

    return geometry;
}

export default BVHGeometry;
