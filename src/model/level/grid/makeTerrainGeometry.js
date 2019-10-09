/**
 * Created by Alex on 16/01/2015.
 */
import * as THREE from 'three';

const makeTerrainGeometry = function (samplerHeight, resolution, targetSize, samplePosition, sampleSize) {
    const width = resolution.x;
    const height = resolution.y;


    const gridX1 = width;
    const gridY1 = height;

    const gridX2 = width - 1;
    const gridY2 = height - 1;

    const xScale = targetSize.x / gridX2;
    const yScale = targetSize.y / gridY2;

    let offset = 0;

    const vertexCount = gridX1 * gridY1;
    const geometry = new THREE.Geometry();
    const vertices = geometry.vertices = new Array(vertexCount);
    const vertexNormals = new Array(vertexCount);
    const faces = geometry.faces = new Array(gridX2 * gridY2 * 2);
    const tempUVs = new Array(vertexCount);
    let y, x;
    //fill vertices
    for (y = 0; y < gridY1; y++) {


        for (x = 0; x < gridX1; x++) {


            const u = x / gridX2;
            const v = y / gridY2;
            //get sample
            const val = samplerHeight.sample(u, v);
            const v3 = new THREE.Vector3(x * xScale, val, y * yScale);


            vertices[offset] = v3;


            tempUVs[offset] = new THREE.Vector2(u, 1 - v);
            //normal sampling
            //samplerNormal.sample(u, v, vertexNormal);
            vertexNormals[offset] = new THREE.Vector3();
            offset += 1;
        }
    }

    const tempColors = [];

    const cb = new THREE.Vector3(), ab = new THREE.Vector3();

    function addFace(a, b, c) {
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
        const vnA = vertexNormals[a];
        const vnB = vertexNormals[b];
        const vnC = vertexNormals[c];
        vnA.add(cb);
        vnB.add(cb);
        vnC.add(cb);
        f0.vertexNormals = [vnA, vnB, vnC];
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
    const l = vertexNormal.length;
    for (; i < l; i++) {
        vertexNormal[i].normalize();
    }
    //CleanupGeometry(geometry);
    return geometry;
};
export default makeTerrainGeometry;