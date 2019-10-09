/**
 * Created by Alex Goldring on 22.02.2015.
 */
import { Color, DoubleSide, NormalBlending, ShaderMaterial } from 'three';

const vertexShader = [
    "attribute float opacity;",

    "varying float vOpacity;",
    "varying vec2 vUv;",

    "void main() {",

    "   vOpacity = opacity;",
    "   vUv = uv;",
    "   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

    "}"

].join("\n");

const fragmentShader = [
    "varying float vOpacity;",
    "varying vec2 vUv;",

    "uniform vec3 diffuse;",
    "uniform sampler2D texture;",


    "void main() {",

    "   vec4 tcolor = texture2D( texture, vUv );",

    "	gl_FragColor = vec4(tcolor.rgb, tcolor.a*vOpacity);",

    "}"

].join("\n");

const TrailMaterial = function () {

    const uniforms = {
        diffuse: { type: "c", value: new Color(0xFFFFFF) },
        texture: { type: "t", value: null }
    };

    const side = DoubleSide;

    const shaderMaterial = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: side,
        blending: NormalBlending,
        lights: false,
        depthTest: true,
        depthWrite: false,
        transparent: true
    });

    shaderMaterial.needsUpdate = true;

    //shaderMaterial.defaultAttributeValues.tangent = [0, 1, 0];
    return shaderMaterial;
};

export default TrailMaterial;