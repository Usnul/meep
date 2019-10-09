/**
 * Created by Alex on 20/09/2015.
 */
const AlphaBlendShader = {

    uniforms: {

        "tDiffuse1": { type: "t", value: null },
        "tDiffuse2": { type: "t", value: null }
    },

    vertexShader: [

        "varying vec2 vUv;",

        "void main() {",

        "vUv = uv;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

        "}"

    ].join("\n"),

    fragmentShader: [

        "uniform sampler2D tDiffuse1;",
        "uniform sampler2D tDiffuse2;",

        "varying vec2 vUv;",

        "void main() {",

        "vec4 source = texture2D( tDiffuse1, vUv );",
        "vec4 destination = texture2D( tDiffuse2, vUv );",
        "gl_FragColor = source + destination.rgba*(1.0-source.a);",
        //"gl_FragColor = source+destination;",
        "}"

    ].join("\n")

};

export default AlphaBlendShader;