/**
 * Created by Alex on 29/05/2016.
 */
import IndexedTriangleBoundsComputer from './IndexedTraingleBoundsComputer';
import IndexedBinaryBVH from '../../../../core/bvh2/binary/IndexedBinaryBVH';

const makeTriangle = IndexedTriangleBoundsComputer.compute;

/**
 *
 * @param {Float32Array|Float64Array|Array.<Number>} vertices
 * @param {Uint8Array|Uint16Array|Uint32Array|Array.<Number>} indices
 * @returns {IndexedBinaryBVH}
 */
function buildUnsorted(vertices, indices) {
    //
    const numNodes = indices.length / 3;

    const tree = new IndexedBinaryBVH();
    tree.initialize(numNodes);

    let iA, iB, iC;
    tree.setLeafs(function (i, offset, data, writeBox) {

        const index3 = i * 3;

        iA = indices[index3];
        iB = indices[index3 + 1];
        iC = indices[index3 + 2];

        makeTriangle(iA * 3, iB * 3, iC * 3, vertices, function (x0, y0, z0, x1, y1, z1) {
            writeBox(data, offset, x0, y0, z0, x1, y1, z1);
        });

        return i;
    });

    return tree;
}

export {
    buildUnsorted
};