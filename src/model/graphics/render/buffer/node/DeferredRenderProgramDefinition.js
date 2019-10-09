import { RenderProgramDefinition } from "./RenderProgramDefinition.js";
import { ProgramValueSlotDefinition } from "../slot/ProgramValueSlotDefinition.js";
import { ProgramValueType } from "../slot/ProgramValueType.js";
import { ProgramValueDirectionKind } from "../slot/ProgramValueDirectionKind.js";
import { ProgramValueSlotParameter } from "../slot/parameter/ProgramValueSlotParameter.js";
import { RenderTargetParameters } from "../slot/parameter/RenderTargetParameters.js";
import { ProgramValueSlotParameterType } from "../slot/parameter/ProgramValueSlotParameterType.js";
import { FrontSide, MeshDepthMaterial, NoBlending, RGBADepthPacking, RGBAFormat } from "three";

const DepthOutput = new ProgramValueSlotDefinition({
    type: ProgramValueType.FrameBuffer,
    name: 'depth',
    direction: ProgramValueDirectionKind.Out
});

DepthOutput.parameters.add(new ProgramValueSlotParameter({
    name: RenderTargetParameters.Format,
    type: ProgramValueSlotParameterType.UnsignedInteger,
    value: RGBAFormat
}));

const ColorOutput = new ProgramValueSlotDefinition({
    type: ProgramValueType.FrameBuffer,
    name: 'color',
    direction: ProgramValueDirectionKind.Out
});

ColorOutput.parameters.add(new ProgramValueSlotParameter({
    name: RenderTargetParameters.Format,
    type: ProgramValueSlotParameterType.UnsignedInteger,
    value: RGBAFormat
}));


function makeDepthRenderer() {
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

    function renderMethod(renderer, camera, scene, renderTarget) {

        const currentVrEnabled = renderer.vr.enabled;
        const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

        renderer.vr.enabled = false; // Avoid camera modification and recursion
        renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

        scene.overrideMaterial = null;

        //replace materials in the scene
        scene.traverse(function (object) {
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
        });

        renderer.render(scene, camera, renderTarget, true);

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

        scene.overrideMaterial = null;

        renderer.vr.enabled = currentVrEnabled;
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    }

    return renderMethod;
}

export class DeferredRenderProgramDefinition extends RenderProgramDefinition {
    constructor() {
        super();

        const slots = this.slots;

        slots.push(ColorOutput);
        slots.push(DepthOutput);

        this.__depthRenderMethod = makeDepthRenderer();
    }

    /**
     *
     * @param {RenderProgramInstance} instance
     * @param {WebGLRenderer} renderer
     * @param {PerspectiveCamera|OrthographicCamera} camera
     * @param {Scene} scene
     */
    execute(instance, renderer, camera, scene) {
        const sColor = instance.getSlotValue(ColorOutput);
        const sDepth = instance.getSlotValue(DepthOutput);

        const rtColor = sColor.getValue();
        const rtDepth = sDepth.getValue();

        //disable stencil
        rtDepth.stencilBuffer = false;

        //draw depth
        this.__depthRenderMethod(renderer, camera, scene, rtDepth);

        //draw color
        renderer.render(scene, camera, rtColor);

    }
}

DeferredRenderProgramDefinition.OutputColor = ColorOutput;
DeferredRenderProgramDefinition.OutputDepth = DepthOutput;