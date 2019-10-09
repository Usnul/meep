import {
    FrontSide,
    LinearFilter,
    MeshDepthMaterial,
    NoBlending,
    RGBADepthPacking,
    RGBAFormat,
    WebGLRenderTarget
} from "three";
import { FrameBuffer } from "../FrameBuffer.js";


export class DepthFrameBuffer extends FrameBuffer {
    initialize(renderer) {
        const depthMaterialSkinned = new MeshDepthMaterial();
        depthMaterialSkinned.depthPacking = RGBADepthPacking;
        depthMaterialSkinned.blending = NoBlending;
        depthMaterialSkinned.side = FrontSide;
        depthMaterialSkinned.skinning = true;

        const depthMaterialStatic = new MeshDepthMaterial();
        depthMaterialStatic.depthPacking = RGBADepthPacking;
        depthMaterialStatic.blending = NoBlending;
        depthMaterialStatic.side = FrontSide;

        const materialMap = [];

        this.depthMaterialSkinned = depthMaterialSkinned;
        this.depthMaterialStatic = depthMaterialStatic;
        this.materialMap = materialMap;

        this.renderTarget = new WebGLRenderTarget(this.size.x, this.size.y, {
            minFilter: LinearFilter,
            magFilter: LinearFilter,
            format: RGBAFormat,
            stencilBuffer: false,
            generateMipmaps: false
        });
    }

    render(renderer, camera, scene) {
        const renderTarget = this.renderTarget;

        const materialMap = this.materialMap;
        const depthMaterialSkinned = this.depthMaterialSkinned;
        const depthMaterialStatic = this.depthMaterialStatic;

        // remember renderer state
        const currentVrEnabled = renderer.vr.enabled;
        const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

        renderer.vr.enabled = false; // Avoid camera modification and recursion
        renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

        scene.overrideMaterial = null;

        /**
         *
         * @param {Object3D} object
         */
        function visitSceneObject(object) {
            const material = object.material;
            if (material !== undefined && material.depthWrite) {
                //remember old material
                materialMap[object.id] = material;

                //set new material
                if (material.customDepthMaterial !== undefined) {
                    object.material = material.customDepthMaterial;
                } else if (material.skinning) {
                    object.material = depthMaterialSkinned;
                } else {
                    object.material = depthMaterialStatic;
                }
            }
        }

        //replace materials in the scene
        scene.traverse(visitSceneObject);

        const oldRenderTarget = renderer.getRenderTarget();

        renderer.setRenderTarget(renderTarget);
        renderer.clear();

        renderer.render(scene, camera);

        renderer.setRenderTarget(oldRenderTarget);

        //restore materials
        scene.traverse(function (object) {
            const material = object.material;
            if (material !== undefined) {
                const id = object.id;
                const m = materialMap[id];
                if (m !== undefined) {
                    object.material = m;

                    delete materialMap[id];
                }
            }
        });

        // restore renderer
        scene.overrideMaterial = null;

        renderer.vr.enabled = currentVrEnabled;
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    }
}

