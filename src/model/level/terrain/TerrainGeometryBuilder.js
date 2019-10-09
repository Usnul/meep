/**
 * Created by Alex on 04/05/2016.
 */

import * as THREE from 'three';
import BufferedGeometryArraysBuilder from './BufferedGeometryArraysBuilder';

const createFace = (function () {
    const tempColors = [];

    const cb = new THREE.Vector3(), ab = new THREE.Vector3();

    function createFace(vertices, normals, a, b, c) {
        //compute normal
        const vA = vertices[a];
        const vB = vertices[b];
        const vC = vertices[c];

        cb.subVectors(vC, vB);
        ab.subVectors(vA, vB);
        cb.cross(ab);

        cb.normalize();
        //
        const f0 = new THREE.Face3(a, b, c, cb.clone(), tempColors);
        //write vertex normals
        const vnA = normals[a];
        const vnB = normals[b];
        const vnC = normals[c];
        vnA.add(cb);
        vnB.add(cb);
        vnC.add(cb);
        f0.vertexNormals = [vnA, vnB, vnC];
        return f0;
    }

    return createFace;
})();

function buildGeometry(samplerHeight, position, size, scale, totalSize, resolution) {
    const width = size.x;
    const height = size.y;


    const gridX1 = width * resolution;
    const gridY1 = height * resolution;

    const gridX2 = gridX1 - 1;
    const gridY2 = gridY1 - 1;

    const xScale = scale.x * (size.x / gridX2);
    const yScale = scale.y * (size.y / gridY2);

    let offset = 0;

    const vertexCount = gridX1 * gridY1;
    const geometry = new THREE.Geometry();
    const vertices = geometry.vertices = new Array(vertexCount);
    const vertexNormals = new Array(vertexCount);
    const faces = geometry.faces = new Array(gridX2 * gridY2 * 2);
    const tempUVs = new Array(vertexCount);
    let y, x;
    const vMultiplier = (size.y / totalSize.y) / gridY2;
    const uMultiplier = (size.x / totalSize.x) / gridX2;
    const vConst = position.y / totalSize.y;
    const uConst = position.x / totalSize.x;
    const posOffsetX = position.x * scale.x;
    const posOffsetY = position.y * scale.y;
    //fill vertices
    for (y = 0; y < gridY1; y++) {

        const v = y * vMultiplier + vConst;


        for (x = 0; x < gridX1; x++) {


            const u = x * uMultiplier + uConst;
            //get sample
            const val = samplerHeight.sample(u, v);
            const v3 = new THREE.Vector3(x * xScale + posOffsetX, val, y * yScale + posOffsetY);

            vertices[offset] = v3;


            tempUVs[offset] = new THREE.Vector2(u, 1 - v);
            //normal sampling
            //samplerNormal.sample(u, v, vertexNormal);
            vertexNormals[offset] = new THREE.Vector3();
            offset += 1;
        }
    }


    function addFace(a, b, c) {
        const f0 = createFace(vertices, vertexNormals, a, b, c);
        //
        const f0uv = [tempUVs[a], tempUVs[b], tempUVs[c]];
        faces[offset] = f0;
        geometry.faceVertexUvs[0][offset] = f0uv;

    }

    offset = 0;
    //add faces
    for (y = 0; y < gridY2; y++) {

        for (x = 0; x < gridX2; x++) {
            const a = x + gridX1 * y;
            const b = x + gridX1 * (y + 1);
            const c = (x + 1) + gridX1 * (y + 1);
            const d = (x + 1) + gridX1 * y;
            addFace(a, b, d);
            offset++;
            addFace(b, c, d);
            offset++;
        }
    }
    //normalize vertex normals
    let i = 0;
    const l = new THREE.Vector3().length;
    for (; i < l; i++) {
        new THREE.Vector3()[i].normalize();
    }
    geometry.vertexNormals = vertexNormals;
    //CleanupGeometry(geometry);
    return geometry;
}


function buildBufferGeometry(samplerHeight, position, size, scale, totalSize, resolution) {

    const arrays = BufferedGeometryArraysBuilder.build(samplerHeight, position, size, scale, totalSize, resolution);

    const g = new THREE.BufferGeometry();
    g.setIndex(new THREE.BufferAttribute(arrays.indices, 1));
    g.addAttribute('position', new THREE.BufferAttribute(arrays.vertices, 3));
    g.addAttribute('normal', new THREE.BufferAttribute(arrays.normals, 3));
    g.addAttribute('uv', new THREE.BufferAttribute(arrays.uvs, 2));

    //normalize vertex normals
    // g.computeVertexNormals();

    //CleanupGeometry(geometry);
    return g;
}

export default {
    buildGeometry: buildGeometry,
    buildBufferGeometry: buildBufferGeometry
};