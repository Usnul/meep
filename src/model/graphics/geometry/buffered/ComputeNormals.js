/**
 * Created by Alex Goldring on 29/05/2016.
 */


/**
 *
 * @param {Array.<Number>} normals
 */
function normalizeNormals(normals) {
    let x, y, z, n;

    let i = 0;
    const il = normals.length;
    for (; i < il; i += 3) {

        // extract vector components
        x = normals[i];
        y = normals[i + 1];
        z = normals[i + 2];

        // compute vector inverse magnitude
        n = 1.0 / Math.sqrt(x * x + y * y + z * z);

        normals[i] *= n;
        normals[i + 1] *= n;
        normals[i + 2] *= n;

    }
}

/**
 * based on code from THREE.js
 * normals need to be set to 0
 * @param {Array.<Number>} vertices
 * @param {Array.<Number>} normals
 * @param {Array.<Number>} indices
 */
function computeVertexNormals(vertices, normals, indices) {
    let vA, vB, vC;

    let vAx, vAy, vAz, vBx, vBy, vBz, vCx, vCy, vCz;

    let vCBx, vCBy, vCBz, vABx, vABy, vABz;

    let crossX, crossY, crossZ;
    // indexed elements
    let i = 0;
    const il = indices.length;
    for (; i < il; i += 3) {

        vA = indices[i] * 3;
        vB = indices[i + 1] * 3;
        vC = indices[i + 2] * 3;

        //obtain vertex coordinates
        vAx = vertices[vA];
        vAy = vertices[vA + 1];
        vAz = vertices[vA + 2];

        vBx = vertices[vB];
        vBy = vertices[vB + 1];
        vBz = vertices[vB + 2];

        vCx = vertices[vC];
        vCy = vertices[vC + 1];
        vCz = vertices[vC + 2];

        //compute CB and AB vectors
        vCBx = vCx - vBx;
        vCBy = vCy - vBy;
        vCBz = vCz - vBz;

        vABx = vAx - vBx;
        vABy = vAy - vBy;
        vABz = vAz - vBz;

        //compute triangle normal
        crossX = vCBy * vABz - vCBz * vABy;
        crossY = vCBz * vABx - vCBx * vABz;
        crossZ = vCBx * vABy - vCBy * vABx;

        normals[vA] += crossX;
        normals[vA + 1] += crossY;
        normals[vA + 2] += crossZ;

        normals[vB] += crossX;
        normals[vB + 1] += crossY;
        normals[vB + 2] += crossZ;

        normals[vC] += crossX;
        normals[vC + 1] += crossY;
        normals[vC + 2] += crossZ;
    }

    normalizeNormals(normals);
}

export default {
    computeNormals: computeVertexNormals
};