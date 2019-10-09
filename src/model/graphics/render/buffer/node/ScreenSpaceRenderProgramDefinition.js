import { RenderProgramDefinition } from "./RenderProgramDefinition";
import { Mesh, OrthographicCamera, PlaneBufferGeometry, Scene, ShaderMaterial, Vector2, Vector3, Vector4 } from "three";
import { ProgramValueDirectionKind } from "../slot/ProgramValueDirectionKind";
import { ProgramValueType } from "../slot/ProgramValueType";

/**
 * Three.js uniform types
 * @enum {string}
 */
export const ThreeUniformType = {
    Texture: 't',
    Float: 'f',
    Vector2: 'v2',
    Vector3: 'v3',
    Vector4: 'v4',
    Matrix4: 'm4'
};

/**
 *
 * @param {ProgramValueType} t
 * @returns {ThreeUniformType}
 */
function slotType2ThreeUniormType(t) {
    switch (t) {
        case ProgramValueType.FrameBuffer:
            return ThreeUniformType.Texture;
        case ProgramValueType.Scalar:
            return ThreeUniformType.Float;
        case ProgramValueType.Vector2:
            return ThreeUniformType.Vector2;
        case  ProgramValueType.Vector3:
            return ThreeUniformType.Vector3;
        case ProgramValueType.Vector4:
            return ThreeUniformType.Vector4;
        default:
            throw  new TypeError(`Unsupported slot type: '${t}'`);
    }
}

/**
 *
 * @param {ProgramValueType} t
 */
function slotTpe2InitialValue(t) {
    switch (t) {
        case ProgramValueType.FrameBuffer:
            return null;
        case ProgramValueType.Scalar:
            return 0.0;
        case ProgramValueType.Vector2:
            return new Vector2();
        case  ProgramValueType.Vector3:
            return new Vector3();
        case ProgramValueType.Vector4:
            return new Vector4();
        default:
            throw  new TypeError(`Unsupported slot type: '${t}'`);
    }
}

export class ScreenSpaceRenderProgramDefinition extends RenderProgramDefinition {
    /**
     *
     * @param {string} vertexShader
     * @param {string} fragmentShader
     */
    constructor({ vertexShader, fragmentShader }) {
        super();

        this.fragmentShader = fragmentShader;
        this.vertexShader = vertexShader;
    }

    build() {

        const uniforms = {};

        //Build uniforms
        this.slots.forEach(s => {
            if (s.direction !== ProgramValueDirectionKind.In) {
                return;
            }

            const slotName = s.name;

            const slotType = s.type;

            const uniformType = slotType2ThreeUniormType(slotType);
            const uniformValue = slotTpe2InitialValue(slotType);

            uniforms[slotName] = {
                type: uniformType,
                value: uniformValue
            };

        });

        this.uniforms = uniforms;

        //build material
        this.material = new ShaderMaterial({

            defines: {},
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader

        });


        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.scene = new Scene();

        this.quad = new Mesh(new PlaneBufferGeometry(2, 2), this.material);
        this.scene.add(this.quad);
    }
}