import { Asset } from "../Asset";
import ThreeFactory, { prepareObject } from "../../../graphics/three/ThreeFactory.js";
import { ensureGeometryBoundingBox, ensureGeometryBoundingSphere } from "../../../graphics/Utils.js";
import { BoneMapping } from "../../../graphics/ecs/mesh/skeleton/BoneMapping.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js'
import Vector3 from "../../../core/geom/Vector3.js";
import { max2 } from "../../../core/math/MathUtils.js";
import Vector4 from "../../../core/geom/Vector4.js";
import { three_computeObjectBoundingBox } from "../../ecs/systems/RenderSystem.js";
import { AABB3 } from "../../../core/bvh2/AABB3.js";
import { StaticMaterialCache } from "./material/StaticMaterialCache.js";

const materialCache = new StaticMaterialCache();

/**
 *
 * @param {String} path
 * @param {function} success
 * @param {function} failure
 * @param {function} progress
 */
function load(path, success, failure, progress) {
    const loader = new GLTFLoader();

    /**
     *
     * @param {Object3D|Mesh|SkinnedMesh} o
     * @returns {boolean}
     */
    function isMesh(o) {
        return o.isMesh || o.isSkinnedMesh;
    }

    function processMesh(mesh) {
        const geometry = mesh.geometry;

        if (geometry === undefined) {
            throw new Error(`No geometry found`);
        }

        ensureGeometryBoundingBox(geometry);
        ensureGeometryBoundingSphere(geometry);

        //re-write material with a cached one if possible to reduce draw calls and texture unit usage
        mesh.material = materialCache.acquire(mesh.material);

        const material = mesh.material;

        ThreeFactory.prepareMaterial(material);

        const isSkinned = material.skinning;

        /**
         *
         * @type {BoneMapping}
         */
        let boneMapping = null;

        if (isSkinned) {
            boneMapping = new BoneMapping();

            const boneNames = mesh.skeleton.bones.map(function (bone) {
                return bone.name;
            });

            // this used to be done inside SkinnedMesh constructor in thee.js prior to r99
            mesh.normalizeSkinWeights();

            boneMapping.build(boneNames);

        }
    }

    /**
     *
     * @param {Object3D} o
     */
    function computeObjectBoundingSphere(o) {
        /*
        TODO: There are better ways of doing this:
        https://github.com/CGAL/cgal/blob/c68cf8fc4c850f8cd84c6900faa781286a7117ed/Bounding_volumes/include/CGAL/Min_sphere_of_spheres_d/Min_sphere_of_spheres_d_impl.h
        */

        /**
         *
         * @type {Sphere[]}
         */
        const balls = [];

        o.traverse(m => {
            if (isMesh(m)) {
                const geometry = m.geometry;

                const sphere = geometry.boundingSphere.clone();

                if (m !== o) {
                    //don't apply transform to root
                    m.updateMatrixWorld(true);

                    sphere.applyMatrix4(m.matrixWorld);
                }

                balls.push(sphere);
            }
        });

        const center = new Vector3();

        const numBalls = balls.length;
        for (let i = 0; i < numBalls; i++) {
            const sphere = balls[i];
            center.add(sphere.center);
        }

        if (numBalls > 0) {
            center.multiplyScalar(1 / numBalls);
        }

        let radius = 0;

        for (let i = 0; i < numBalls; i++) {
            const sphere = balls[i];

            radius = max2(radius, center.distanceTo(sphere.center) + sphere.radius);
        }

        o.boundingSphere = new Vector4(
            center.x,
            center.y,
            center.z,
            radius
        );
    }


    loader.load(path, function (gltf) {
        const scene = gltf.scene;

        scene.updateMatrixWorld();

        /**
         * {Array.<THREE.Object3D>}
         */
        const children = scene.children;

        if (children.length === 0) {
            failure("Scene is empty");
            return;
        }

        //find a child that is a mesh
        let root = scene.children.find(isMesh);

        if (root === undefined) {
            //use the whole scene
            root = scene;
        }


        // clear transform on the root element
        root.position.set(0, 0, 0);
        root.rotation.set(0, 0, 0);
        root.scale.set(1, 1, 1);

        root.traverse(o => {
            o.updateMatrix();

            prepareObject(o);

            if (isMesh(o)) {
                processMesh(o);
            }
        });


        // compute object bounding sphere
        computeObjectBoundingSphere(root);

        // compute bounding box
        const boundingBox = new AABB3(0, 0, 0, 0, 0, 0);
        three_computeObjectBoundingBox(root, boundingBox);

        function assetFactory() {
            let result = SkeletonUtils.clone(root);

            result.castShadow = true;
            result.receiveShadow = false;

            if (asset.animations !== undefined) {
                //animations are present
                result.animations = asset.animations;
            }

            // Copy bounding sphere
            result.boundingSphere = root.boundingSphere;

            return result;
        }

        const byteSize = 1;

        const asset = new Asset(assetFactory, byteSize);
        asset.boundingBox = boundingBox;

        if (gltf.animations !== undefined) {
            /**
             *
             * @type {AnimationClip[]}
             */
            const animations = gltf.animations;

            //validate and optimize animations
            animations.forEach(function (animation) {
                if (animation.validate()) {
                    animation.optimize();
                }
            });

            asset.animations = animations;
        }


        success(asset);
    }, function (xhr) {
        //dispatch progress callback
        progress(xhr.loaded, xhr.total);
    }, failure);
}

export {
    load
};
