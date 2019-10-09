/**
 * Created by Alex on 20/09/2015.
 */
const ClearShader = {

    defines: {},

    uniforms: {},

    vertexShader: [

        "void main() {",

        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

        "}"

    ].join("\n"),
    fragmentShader: [
        "void main() {",

        "   gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);",

        "}"


    ].join("\n')
};

export default ClearShader;