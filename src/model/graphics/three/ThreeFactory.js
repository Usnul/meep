/**
 * Created by Alex on 28/01/2017.
 */


import { DoubleSide, Group, Mesh, SkinnedMesh } from 'three';

export function prepareObject(object) {
    //turn off automatic matrix re-calculations each frame
    object.matrixAutoUpdate = false;
    //disable frustum culling
    object.frustumCulled = false;
}

/**
 *
 * @param {BufferGeometry} geometry
 * @param {Material} material
 * @returns {Mesh}
 */
export function createMesh(geometry, material) {
    const result = new Mesh(geometry, material);

    prepareObject(result);

    return result;
}

/**
 *
 * @param {BufferGeometry} geometry
 * @param {THREE.Material} material
 * @returns {THREE.SkinnedMesh}
 */
export function createSkinnedMesh(geometry, material) {
    const result = new SkinnedMesh(geometry, material);

    prepareObject(result);

    return result;
}

/**
 *
 * @param {Material} material
 */
export function prepareMaterial(material) {

    //make shadows render from front side, this avoids artifacts due to gaps in geometry that can't be seen from the front
    material.shadowSide = DoubleSide;
}

/**
 *
 * @returns {Group}
 */
export function createGroup() {
    const result = new Group();

    prepareObject(result);

    return result;
}

export default {
    createMesh,
    createSkinnedMesh,
    createGroup,
    prepareMaterial
};
