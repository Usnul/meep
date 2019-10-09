import Vector3, { v3Length_i } from "../../../../core/geom/Vector3.js";

import { Ray as ThreeRay, Vector3 as ThreeVector3 } from 'three';
import { rayTriangleIntersection } from "../../../../core/geom/GeometryMath.js";

const hit = new ThreeVector3();
const ray = new ThreeRay();

const vA = new ThreeVector3(),
    vB = new ThreeVector3(),
    vC = new ThreeVector3();

function bindGeometryFace(indices, vertices, index) {
    const index3 = index * 3;
    const a = indices[index3] * 3;
    const b = indices[index3 + 1] * 3;
    const c = indices[index3 + 2] * 3;

    vA.set(vertices[a], vertices[a + 1], vertices[a + 2]);
    vB.set(vertices[b], vertices[b + 1], vertices[b + 2]);
    vC.set(vertices[c], vertices[c + 1], vertices[c + 2]);
}

const vNormal = new Vector3();

function bindGeometryFaceNormal(indices, normals, index) {

    const index3 = index * 3;

    const a = indices[index3] * 3;
    const b = indices[index3 + 1] * 3;
    const c = indices[index3 + 2] * 3;

    //read vertex normals
    const naX = normals[a];
    const naY = normals[a + 1];
    const naZ = normals[a + 2];

    const nbX = normals[b];
    const nbY = normals[b + 1];
    const nbZ = normals[b + 2];

    const ncX = normals[c];
    const ncY = normals[c + 1];
    const ncZ = normals[c + 2];

    //add normals
    const nsX = (naX + nbX + ncX);
    const nsY = (naY + nbY + ncY);
    const nsZ = (naZ + nbZ + ncZ);

    //normalize
    const l = v3Length_i(nsX, nsY, nsZ);
    const m = 1 / l;

    const nx = nsX * m;
    const ny = nsY * m;
    const nz = nsZ * m;

    vNormal.set(nx, ny, nz);
}

function computeSampleFaceIndex(width, x, y) {

    //get fraction of x and y
    const xF = x % 1;
    const yF = y % 1;

    //get whole part of x and y
    const xW = x | 0;
    const yW = y | 0;

    //figure out which quad it is in
    const iQuad = yW * (width - 1) + xW;

    //figure out triangle
    const index = iQuad * 2 + ((xF + yF) | 0);

    return index;
}


function extractFaceIndexFromLeaf_default(leaf) {
    return leaf.object;
}

function BVHGeometryRaycaster() {
    /**
     *
     * @type {BufferGeometry|null}
     */
    this.geometry = null;
    /**
     *
     * @type {BinaryNode|null}
     */
    this.bvh = null;

    /**
     *
     * @type {Vector2|null}
     */
    this.position = null;
    /**
     *
     * @type {Vector2|null}
     */
    this.scale = null;
    /**
     *
     * @type {number}
     */
    this.resolution = 0;
    /**
     *
     * @type {Vector2|null}
     */
    this.size = null;

    this.extractFaceIndexFromLeaf = extractFaceIndexFromLeaf_default;


    const raycastBestHit = new Vector3();
    let raycastBestIndex = 0;
    let raycastBestDistanceSqr = 0;


    /**
     *
     * @param {Vector3} origin
     * @param {Vector3} direction
     * @param {function} callback
     * @param missCallback
     */
    function raycast(origin, direction, callback, missCallback) {

        function registerRayIntersection(hit, index) {
            const d = origin.distanceSqrTo(hit);
            if (d < raycastBestDistanceSqr) {
                raycastBestDistanceSqr = d;
                raycastBestHit.copy(hit);
                raycastBestIndex = index;
            }
        }


        let hitCount = 0;

        raycastBestDistanceSqr = Number.POSITIVE_INFINITY;

        const geometry = this.geometry;

        const geometryIndices = geometry.getIndex().array;
        const geometryVertices = geometry.getAttribute('position').array;
        const geometryNormals = geometry.getAttribute('normal').array;

        const extractFaceIndexFromLeaf = this.extractFaceIndexFromLeaf;

        this.bvh.traverseRayLeafIntersections(origin.x, origin.y, origin.z, direction.x, direction.y, direction.z, function (leaf) {
            const index = extractFaceIndexFromLeaf(leaf);

            hitCount++;
            ray.set(origin, direction);

            bindGeometryFace(geometryIndices, geometryVertices, index);

            const hitFound = rayTriangleIntersection(hit, origin, direction, vA, vB, vC);

            if (hitFound) {
                registerRayIntersection(hit, index);
            }
        });

        if (raycastBestDistanceSqr !== Number.POSITIVE_INFINITY) {
            bindGeometryFaceNormal(geometryIndices, geometryNormals, raycastBestIndex);
            callback(raycastBestHit, vNormal, geometry);
        } else {
            //no hit
            missCallback();
        }
    }

    const vOrigin = new ThreeVector3(0, -1000, 0);
    const vDirection = new ThreeVector3(0, 1, 0);
    ray.set(vOrigin, vDirection);

    function raycastVertical(x, y, callback, missCallback) {
        const position = this.position;
        const scale = this.scale;

        //transform position to geometry coordinate system
        const resolution = this.resolution;

        const size = this.size;

        const width = size.x * resolution;
        const height = size.y * resolution;


        const gX = ((x - position.x * scale.x) / scale.x) * resolution * ((width - 1) / width);
        const gY = ((y - position.y * scale.y) / scale.y) * resolution * ((height - 1) / height);

        const index = computeSampleFaceIndex(width, gX, gY);

        const geometry = this.geometry;

        const geometryIndices = geometry.getIndex().array;
        const geometryVertices = geometry.getAttribute('position').array;
        const geometryNormals = geometry.getAttribute('normal').array;

        bindGeometryFace(geometryIndices, geometryVertices, index);


        vOrigin.x = x;
        vOrigin.z = y;

        const hitFound = rayTriangleIntersection(hit, vOrigin, vDirection, vA, vB, vC);

        if (!hitFound) {
            missCallback();
            return;
        }

        bindGeometryFaceNormal(geometryIndices, geometryNormals, index);

        callback(hit, vNormal, geometry);
    }

    this.raycastVertical = raycastVertical;
    this.raycast = raycast;
}


export { BVHGeometryRaycaster };
