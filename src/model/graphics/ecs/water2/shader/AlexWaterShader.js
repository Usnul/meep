import { Color, NormalBlending, ShaderMaterial } from "three";

const vs = `void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const fs = `
uniform vec3 waterColor;

void main(){
    gl_FragColor = vec4(waterColor, 1.0) * vec4( 1.0, 1.0, 1.0, 0.6 );
}
`;

function makeMaterial() {
    const uniforms = {
        time: {
            type: 'f',
            value: 0
        },
        waterColor: {
            type: 'c',
            value: new Color()
        }
    };

    const material = new ShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        uniforms,
        blending: NormalBlending,
        lights: false,
        fog: false,
        depthTest: true,
        transparent: true,
        vertexColors: false
    });

    return material;
}

export class AlexWaterShader {
    constructor() {

        this.material = makeMaterial();

    }
}
