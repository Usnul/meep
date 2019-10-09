/**
 * Created by Alex on 16/09/2015.
 */
import { System } from '../../../engine/ecs/System';
import { Euler as ThreeEuler, MaterialLoader, Mesh as ThreeMesh, Vector3 as ThreeVector3 } from 'three';
import Transform from '../../../engine/ecs/components/Transform';
import Mesh from '../mesh/Mesh';
import Renderable from '../../../engine/ecs/components/Renderable';
import LoadMaterial from "../../material/LoadMaterial";

import Decal from "./Decal";
import DecalGeometry from "./threejs/DecalGeometry";

/**
 *
 * @param {string} str
 * @returns {number}
 */
function stringHash(str) {
    let hash = 5381,
        i = str.length;

    while (i) {
        hash = (hash * 33) ^ str.charCodeAt(--i)
    }

    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;
}

const MaterialCache = function () {
    this.materialLoader = new MaterialLoader();
    this.table = {};
};

MaterialCache.prototype.get = function (json) {
    const str = JSON.stringify(json);
    const hash = stringHash(str);
    if (this.table.hasOwnProperty(hash)) {
        return this.table[hash];
    } else {
        const options = Object.assign({ assetManager }, json);

        const material = LoadMaterial(options);
        material.depthTest = true;
        material.depthWrite = false;
        material.polygonOffset = true;
        material.polygonOffsetFactor = -4;
        this.table[hash] = material;
        return material;
    }
};

class DecalSystem extends System {
    /**
     *
     * @param scene
     * @param {AssetManager} assetManager
     */
    constructor(scene, assetManager) {
        super();
        this.scene = scene;
        this.assetManager = assetManager;
        this.componentClass = Decal;
        this.materialCache = new MaterialCache();
    }

    remove(component, entity) {
        this.scene.remove(component.mesh);
    }

    add(component, entity) {
        const meshes = [];

        const targetModel = this.entityManager.getComponent(component.target, Mesh);
        const targetRenderable = this.entityManager.getComponent(component.target, Renderable);

        if (targetModel !== null) {
            //TODO implement
        }

        if (targetRenderable !== null) {
            processObjectTHREE(targetRenderable.mesh, meshes);
        }

        const transform = this.entityManager.getComponent(entity, Transform);

        const material = this.materialCache.get(component.material);

        const r = new ThreeEuler();
        r.setFromQuaternion(transform.rotation);
        const size = new ThreeVector3(component.size, component.size, component.size);
        const check = new ThreeVector3(1, 1, 1);
        const geometry = new DecalGeometry(meshes, transform.position, r, size, check);
        const mesh = component.mesh = new ThreeMesh(geometry, material);
        this.scene.add(mesh);
    }
}


function processObjectTHREE(object, meshes) {
    if (object.hasOwnProperty("geometry")) {
        meshes.push(object);
    }
    let i = 0;
    const l = object.children.length;
    for (; i < l; i++) {
        const c = object.children[i];
        processObjectTHREE(c, meshes);
    }
}

export default DecalSystem;