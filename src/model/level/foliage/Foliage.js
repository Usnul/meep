/**
 * Created by Alex on 18/10/2014.
 */
import SampleTraverser from '../../graphics/texture/sampler/SampleTraverser';
import QuadGeometry from '../../graphics/geometry/QuadGeometry';
import * as THREE from 'three';

import ThreeFactory from '../../graphics/three/ThreeFactory';


function makeCombinedGeometry(templateGeometry, normalAlign, width, height, count, scale, heightMap, material) {
    const geometry = new THREE.Geometry();

    const scaleMatrix = new THREE.Matrix4();
    scaleMatrix.makeScale(scale.x, scale.y, scale.z);

    function process(x, z) {
        const y = heightMap.sampleHeight(x, z);
        const pos = new THREE.Vector3(x, y, z);
        //
        const g = templateGeometry.clone();
        //transform
        const m = new THREE.Matrix4();
        if (normalAlign) {
            const normal = heightMap.sampleNormal(x, z);
            m.lookAt(normal, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
        }
        m.setPosition(pos);
        m.multiply(scaleMatrix);
        g.applyMatrix(m);
        geometry.merge(g);
    }

    createPieces(process, count, width, height);
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

function makeMultiMesh(templateGeometry, normalAlign, width, height, count, scale, heightMap, material) {
    const object = new THREE.Object3D();


    function process(x, z) {
        const y = heightMap.sampleHeight(x, z);
        //
        const m = new THREE.Mesh(templateGeometry, material);
        //transform
        if (normalAlign) {
            const normal = heightMap.sampleNormal(x, z);
            m.lookAt(normal, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
        }
        m.position.set(x, y, z);
        m.scale.set(scale.x, scale.y, scale.z);
        object.add(m);
    }

    createPieces(process, count, width, height);

    return object;
}

function createPieces(process, count, width, height) {
    for (let i = 0; i < count; i++) {
        const x = width * Math.random();
        const z = height * Math.random();
        process(x, z);
    }
}


const alignToVector = (function () {
    const matrix4 = new THREE.Matrix4();

    function alignToVector(mesh, direction) {
        matrix4.identity();

        const el = matrix4.elements;
        el[4] = direction.x;
        el[5] = direction.y;
        el[6] = direction.z;
        mesh.rotation.setFromRotationMatrix(matrix4, 'XZY');
    }

    return alignToVector;
})();

const Foliage = function (options, mask, quadTree, caster) {

    const size = options.size || 1;
    const randomRotateY = options.randomRotateY !== void 0 ? options.randomRotateY : false;

    const templateGeometry = options.geometry || new QuadGeometry(1, 1);
    let boundingSphere = templateGeometry.boundingSphere;
    if (boundingSphere === void 0 || boundingSphere === null) {
        boundingSphere = templateGeometry.computeBoundingSphere();
    }
    const scaleFactor = 1 / (boundingSphere.radius * 2);
    const material = options.material;
    const density = options.density;
    const densityMap = options.densityMap;
    const normalAlign = options.normalAlign !== void 0 ? options.normalAlign : true;
    const castShadow = options.castShadow !== void 0 ? options.castShadow : false;
    const receiveShadow = options.receiveShadow !== void 0 ? options.receiveShadow : false;
    //

    const mapSize = new THREE.Vector2(options.width, options.height);
    //
    const object = new THREE.Object3D();

    const mapWidth = mapSize.x;
    const mapHeight = mapSize.y;

    function process(u, v, size) {
        const x = u * mapWidth;
        const z = v * mapHeight;
        caster(x, z, function (hit, normal, geometry) {
            const y = hit.y;
            //
            const m = ThreeFactory.createMesh(templateGeometry, material);
            //transform
            if (normalAlign) {
                // m.lookAt(normal, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
                alignToVector(m, normal);
            }
            if (randomRotateY) {
                m.rotation.y = Math.PI * 2 * Math.random();
            }
            m.position.set(x, y, z);
            m.castShadow = castShadow;
            m.receiveShadow = receiveShadow;
            const scale = scaleFactor * size;
            m.scale.set(scale, scale, scale);
            object.add(m);
        });
    }

    //
    //console.time('generating foliage');
    const sampleTraverser = new SampleTraverser();
    sampleTraverser.resolveSpace = true;
    sampleTraverser.resolveSpaceSizeMin = size.min;
    sampleTraverser.resolveSpaceSizeMax = size.max;
    sampleTraverser.mask = mask;
    sampleTraverser.quadTree = quadTree;

    sampleTraverser.traverse(densityMap, density, mapSize, process);
    //console.timeEnd('generating foliage');
    //
    return object;
};
export default Foliage;
