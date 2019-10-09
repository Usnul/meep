/**
 * Created by Alex on 10/11/2014.
 */


import * as THREE from 'three';

const samplesPerPixel = 33;
const AmbientOcclusionShader = function () {
    return {

        uniforms: {

            "normalMap": { type: "t", value: null },
            "heightMap": { type: "t", value: null },
            "resolution": { type: "v2", value: new THREE.Vector2(512, 512) }

        },

        vertexShader: [

            "varying vec2 vUv;",

            "void main() {",

            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}"

        ].join("\n"),
//    #define raylength 10.0
//
//    void main(){
//        float occlusion = 0.0;
//        vec3 pos = get(0.0, 0.0);
//        vec3 normal = texture2D(normals, gl_FragCoord.xy/viewport).xyz;
//        vec3 tangent = normalize(cross(normal, vec3(0.0, 0.0, 1.0)));
//        vec3 bitangent = normalize(cross(tangent, normal));
//        mat3 orthobasis = mat3(tangent, normal, bitangent);
//
//        for(int i=1; i<33; i++){
//            float s = float(i)/32.0;
//            float a = sqrt(s*512.0);
//            float b = sqrt(s);
//            float x = sin(a)*b*raylength;
//            float y = cos(a)*b*raylength;
//            vec3 sample_uv = orthobasis * vec3(x, 0.0, y);
//            vec3 sample_pos = get(sample_uv.x, sample_uv.z);
//            vec3 sample_dir = normalize(sample_pos - pos);
//            float lambert = clamp(dot(normal, sample_dir), 0.0, 1.0);
//            float dist_factor = 0.23/sqrt(length(sample_pos - pos));
//            occlusion += dist_factor*lambert;
//        }
//        float incident = 1.0 - occlusion/32.0;
//        gl_FragColor = vec4(incident, incident, incident, 1.0);
        fragmentShader: [

            "uniform vec2 resolution;",
            "uniform sampler2D normalMap;",
            "uniform sampler2D heightMap;",

            "#define raylength 17.0;",

            "varying vec2 vUv;",

            "vec3 get(float x, float y){",
            "   vec2 _uv = vUv.xy + vec2(x,y)/resolution;",
            "   float h = texture2D(heightMap, _uv).x;",
            "   return vec3(_uv.x, h, _uv.y);",
            "}",

            "void main() {",
            "   float occlusion = 0.0;",
            "   vec3 pos = get(0.0, 0.0);",
            "   vec3 normal = texture2D( normalMap, vUv ).xyz;",

            // "   vec3 tangent = normalize(cross(normal, vec3(0.0, 0.0, 1.0)));",
            // "   vec3 bitangent = normalize(cross(tangent, normal));",
            // "   mat3 orthobasis = mat3(tangent, normal, bitangent);",

            "   for(int i=1; i<" + samplesPerPixel + "; i++){",
            "     float s = float(i)/" + (samplesPerPixel - 1) + ".0;",
            "     float a = sqrt(s*512.0);",
            "     float b = sqrt(s)*raylength;",
            "     float x = sin(a)*b;",
            "     float y = cos(a)*b;",

            // "     vec3 sample_uv = orthobasis * vec3(x, 0.0, y);",
            // "     vec3 sample_pos = get(sample_uv.x, sample_uv.z);",

            "     vec3 sample_pos = get(x, y);",

            "     vec3 sample_dir = normalize(sample_pos - pos);",
            "     float vDot = dot(normal, sample_dir);",
            "     float lambert = clamp(vDot, 0.0, 1.0);",
            "     float dist_factor = 0.23/sqrt(length(sample_pos - pos));",
            "     occlusion += dist_factor*lambert;",
            "   }",
            "   float incident = 1.0 - occlusion/" + (samplesPerPixel - 1) + ".0;",
            "   gl_FragColor = vec4(incident, incident, incident, 1.0);",
            "}"

        ].join('\n')

    }
};
export default AmbientOcclusionShader;
