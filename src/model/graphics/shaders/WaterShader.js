/**
 * Created by Alex on 06/04/2016.
 */
import * as THREE from 'three';
import ShaderChunks from './lib/ShaderChunks';

const WaterShader = {


    vertexShader: [

        "#define LAMBERT",

        "varying vec3 vLightFront;",


        THREE.ShaderChunk["common"],
        THREE.ShaderChunk["packing"],
        THREE.ShaderChunk["uv_pars_vertex"],


        THREE.ShaderChunk["uv2_pars_vertex"],
        THREE.ShaderChunk["envmap_pars_vertex"],
        THREE.ShaderChunk["bsdfs"],
        THREE.ShaderChunk["lights_pars"],
        THREE.ShaderChunk["color_pars_vertex"],
        THREE.ShaderChunk["morphtarget_pars_vertex"],
        THREE.ShaderChunk["skinning_pars_vertex"],
        THREE.ShaderChunk["shadowmap_pars_vertex"],
        THREE.ShaderChunk["logdepthbuf_pars_vertex"],

        ShaderChunks.clouds_pars_vertex,

        "void main() {",

        THREE.ShaderChunk["uv_vertex"],
        THREE.ShaderChunk["uv2_vertex"],

        THREE.ShaderChunk["color_vertex"],

        THREE.ShaderChunk["beginnormal_vertex"],
        THREE.ShaderChunk["morphnormal_vertex"],
        THREE.ShaderChunk["skinbase_vertex"],
        THREE.ShaderChunk["skinnormal_vertex"],
        THREE.ShaderChunk["defaultnormal_vertex"],


        THREE.ShaderChunk["begin_vertex"],
        THREE.ShaderChunk["morphtarget_vertex"],
        THREE.ShaderChunk["skinning_vertex"],
        THREE.ShaderChunk["project_vertex"],
        THREE.ShaderChunk["logdepthbuf_vertex"],

        THREE.ShaderChunk["worldpos_vertex"],
        THREE.ShaderChunk["envmap_vertex"],
        THREE.ShaderChunk["lights_lambert_vertex"],
        THREE.ShaderChunk["shadowmap_vertex"],

        ShaderChunks.clouds_vertex,
        "}"

    ].join("\n"),

    fragmentShader: [
        "uniform vec3 diffuse;",
        "uniform vec3 emissive;",
        "uniform float opacity;",
        "varying vec3 vLightFront;",

        THREE.ShaderChunk["common"],
        THREE.ShaderChunk["color_pars_fragment"],
        THREE.ShaderChunk["uv_pars_fragment"],
        THREE.ShaderChunk["uv2_pars_fragment"],
        THREE.ShaderChunk["map_pars_fragment"],
        THREE.ShaderChunk["alphamap_pars_fragment"],
        THREE.ShaderChunk["aomap_pars_fragment"],
        THREE.ShaderChunk["lightmap_pars_fragment"],
        THREE.ShaderChunk["emissivemap_pars_fragment"],
        THREE.ShaderChunk["envmap_pars_fragment"],
        THREE.ShaderChunk["bsdfs"],
        THREE.ShaderChunk["lights_pars"],
        THREE.ShaderChunk["fog_pars_fragment"],
        THREE.ShaderChunk["shadowmap_pars_fragment"],
        THREE.ShaderChunk["shadowmask_pars_fragment"],
        THREE.ShaderChunk["specularmap_pars_fragment"],
        THREE.ShaderChunk["logdepthbuf_pars_fragment"],

        ShaderChunks.clouds_pars_fragment,

        "void main() {",
        "   vec4 diffuseColor = vec4( diffuse, opacity );",

        "	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",
        "	vec3 totalEmissiveRadiance = emissive;",


        THREE.ShaderChunk["logdepthbuf_fragment"],

        ShaderChunks.map_fragment_alternative,


        THREE.ShaderChunk["color_fragment"],
        THREE.ShaderChunk["alphamap_fragment"],
        THREE.ShaderChunk["alphatest_fragment"],
        THREE.ShaderChunk["specularmap_fragment"],
        THREE.ShaderChunk["emissivemap_fragment"],

        // accumulation
        "	reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );",

        THREE.ShaderChunk["lightmap_fragment"],

        ShaderChunks.clouds_fragment,

        "	reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );",

        "	#ifdef DOUBLE_SIDED",

        "		reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;",

        "	#else",

        "		reflectedLight.directDiffuse = vLightFront;",

        "	#endif",

        "	reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();",

        // modulation
        THREE.ShaderChunk["aomap_fragment"],


        "	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",


        THREE.ShaderChunk["envmap_fragment"],


        "	gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

        THREE.ShaderChunk["premultiplied_alpha_fragment"],
        THREE.ShaderChunk["tonemapping_fragment"],
        THREE.ShaderChunk["encodings_fragment"],
        //
        THREE.ShaderChunk["linear_to_gamma_fragment"],

        THREE.ShaderChunk["fog_fragment"],
        "}"

    ].join("\n")
};
export default WaterShader;