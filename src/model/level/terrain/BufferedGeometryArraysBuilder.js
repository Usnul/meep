/**
 * Created by Alex on 29/05/2016.
 */


import ComputeNormals from '../../graphics/geometry/buffered/ComputeNormals';

/**
 *
 * @param {Sampler2D} samplerHeight
 * @param {Vector2} position
 * @param {Vector2} size
 * @param {Vector2} scale
 * @param {Vector2} totalSize
 * @param {number} resolution
 * @returns {{indices, vertices: Float32Array, normals: Float32Array, uvs: Float32Array}}
 */
function buildBufferGeometry(samplerHeight, position, size, scale, totalSize, resolution) {

    const width = size.x;
    const height = size.y;


    const gridX1 = width * resolution;
    const gridY1 = height * resolution;

    const gridX2 = gridX1 - 1;
    const gridY2 = gridY1 - 1;

    let offset = 0, offset2 = 0;

    const vertexCount = gridX1 * gridY1;


    const vertices = new Float32Array(vertexCount * 3);

    const normals = new Float32Array(vertexCount * 3);

    const uvs = new Float32Array(vertexCount * 2);

    let y, x;

    const vMultiplier = (size.y / totalSize.y) / gridY2;
    const uMultiplier = (size.x / totalSize.x) / gridX2;

    const vConst = position.y / totalSize.y;
    const uConst = position.x / totalSize.x;

    const jitterU = (totalSize.x < samplerHeight.width) ? 0.5 * uMultiplier : 0.5 / samplerHeight.width;
    const jitterV = (totalSize.y < samplerHeight.height) ? 0.5 * vMultiplier : 0.5 / samplerHeight.height;

    const totalScaledSizeX = totalSize.x * scale.x;
    const totalScaledSizeY = totalSize.y * scale.y;

    function sample(u, v) {
        return samplerHeight.sample(u, v);
    }

    function getHeightValue(u, v) {
        //TODO do Gaussian convolution filter( or box-blur ), with 1/2 pixel offset
        let val = sample(u, v);

        const jitter = sample(u + jitterU, v) + sample(u - jitterU, v) + sample(u, v + jitterV) + sample(u, v - jitterV);

        return (val + jitter) / 5;
    }

    //fill vertices
    let px, py, pz;
    for (y = 0; y < gridY1; y++) {

        const v = y * vMultiplier + vConst;

        pz = v * totalScaledSizeY;

        for (x = 0; x < gridX1; x++) {

            const u = x * uMultiplier + uConst;
            //get sample
            const val = sample(u, v);

            px = u * totalScaledSizeX;
            py = val;

            vertices[offset] = px;
            vertices[offset + 1] = py;
            vertices[offset + 2] = pz;

            uvs[offset2] = u;
            uvs[offset2 + 1] = 1 - v;

            offset += 3;
            offset2 += 2;
        }
    }

    offset = 0;

    /**
     * @type {Uint16Array|Uint32Array}
     */
    const indices = new ((vertices.length / 3) > 65535 ? Uint32Array : Uint16Array)(gridX2 * gridY2 * 6);

    //add faces
    //TODO TraingleStip mode is more efficient in terms of memory usage and probably GPU-time
    for (y = 0; y < gridY2; y++) {

        for (x = 0; x < gridX2; x++) {
            const a = x + gridX1 * y;
            const b = x + gridX1 * (y + 1);
            const c = (x + 1) + gridX1 * (y + 1);
            const d = (x + 1) + gridX1 * y;

            indices[offset] = a;
            indices[offset + 1] = b;
            indices[offset + 2] = d;

            indices[offset + 3] = b;
            indices[offset + 4] = c;
            indices[offset + 5] = d;

            offset += 6;
        }
    }

    ComputeNormals.computeNormals(vertices, normals, indices);

    //CleanupGeometry(geometry);
    return {
        indices: indices,
        vertices: vertices,
        normals: normals,
        uvs: uvs
    };
}

const Builder = {
    build: buildBufferGeometry
};

export default Builder;