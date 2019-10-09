/**
 * Created by Alex on 06/04/2016.
 */
const chunks = {
    random: [
        "float rand(float v){",
        "   return fract(sin(v) * 43758.5453);",
        "}"
    ].join("\n"),
    clouds_pars_vertex: [
        "#ifdef SHADOWMAP_CLOUDS",
        "   uniform float f_CloudsTime;",

        "   uniform vec2 v_CloudsSpeed_0;",
        "   uniform vec2 v_CloudsSpeed_1;",
        "   uniform vec2 v_CloudsSpeed_2;",

        "   uniform vec2 v_CloudsSize_0;",
        "   uniform vec2 v_CloudsSize_1;",
        "   uniform vec2 v_CloudsSize_2;",

        "   varying vec2 v_Clouds_0_offset;",
        "   varying vec2 v_Clouds_1_offset;",
        "   varying vec2 v_Clouds_2_offset;",
        "#endif"
    ].join("\n"),
    clouds_vertex: [
        "#ifdef SHADOWMAP_CLOUDS",
        "   vec2 cloudsUV = worldPosition.xz;",
        "   v_Clouds_0_offset = (v_CloudsSpeed_0 * f_CloudsTime + cloudsUV) / v_CloudsSize_0;",
        "   v_Clouds_1_offset = (v_CloudsSpeed_1 * f_CloudsTime + cloudsUV) / v_CloudsSize_1;",
        "   v_Clouds_2_offset = (v_CloudsSpeed_2 * f_CloudsTime + cloudsUV) / v_CloudsSize_2;",
        "#endif"
    ].join("\n"),
    clouds_pars_fragment: [
        "#ifdef SHADOWMAP_CLOUDS",

        "   varying vec2 v_Clouds_0_offset;",
        "   varying vec2 v_Clouds_1_offset;",
        "   varying vec2 v_Clouds_2_offset;",

        "   uniform sampler2D t_Clouds_0;",
        "   uniform sampler2D t_Clouds_1;",
        "   uniform sampler2D t_Clouds_2;",

        "   uniform float f_CloudsAmount;",
        "   uniform float f_CloudsIntensity;",
        "#endif"
    ].join("\n"),
    clouds_fragment: [
        "#ifdef SHADOWMAP_CLOUDS",
        "   vec4 shadowmapCloudsColor = texture2D(t_Clouds_0, v_Clouds_0_offset) * texture2D(t_Clouds_1, v_Clouds_1_offset) * texture2D(t_Clouds_2, v_Clouds_2_offset);",
        "   float shadowmapCloudsIntensity = min( max(shadowmapCloudsColor.r-(1.0-f_CloudsAmount),0.0)*(1.0/f_CloudsAmount), 0.05 ) * 20.0;",
        "   reflectedLight.directDiffuse  *=  mix(1.0, 1.0-f_CloudsIntensity, shadowmapCloudsIntensity);",
        "#endif"
    ].join("\n"),
    map_fragment_alternative: [
        "#ifdef USE_MAP",
        "   vec4 texelColor = texture2D( map, vUv );",
        "   texelColor = GammaToLinear( texelColor, float( GAMMA_FACTOR ) );",
        " 	diffuseColor *= texelColor;",
        "#endif"
    ].join("\n")
};

export default chunks;