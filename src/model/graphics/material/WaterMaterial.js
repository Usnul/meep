/**
 * Created by Alex on 06/04/2016.
 */
import { Color, FrontSide, NormalBlending, ShaderMaterial, UniformsLib, UniformsUtils, Vector2 } from 'three';

import WaterShader from "../shaders/WaterShader";

const WaterMaterial = function (options) {
    const uniforms = UniformsUtils.merge([
        UniformsLib["common"],
        UniformsLib["aomap"],
        UniformsLib["lightmap"],
        UniformsLib["emissivemap"],
        UniformsLib["bumpmap"],
        UniformsLib["normalmap"],
        UniformsLib["displacementmap"],

        UniformsLib["fog"],
        UniformsLib["lights"],
        {
            "emissive": { type: "c", value: new Color(0x000000) },
            "specular": { type: "c", value: new Color(0x111111) },
            "shininess": { type: "f", value: 30 }
        },
        {
            "f_CloudsTime": { type: "f", value: 0 },
            "f_CloudsAmount": { type: "f", value: 0.9 },
            "f_CloudsIntensity": { type: "f", value: 0.5 },

            "v_CloudsSpeed_0": { type: "v2", value: new Vector2(0.03, -0.03) },
            "v_CloudsSpeed_1": { type: "v2", value: new Vector2(0.011, -0.011) },
            "v_CloudsSpeed_2": { type: "v2", value: new Vector2(0.023, -0.023) },

            "v_CloudsSize_0": { type: "v2", value: new Vector2(40, 40) },
            "v_CloudsSize_1": { type: "v2", value: new Vector2(20, 20) },
            "v_CloudsSize_2": { type: "v2", value: new Vector2(10, 10) },

            "t_Clouds_0": { type: "t", value: null },
            "t_Clouds_1": { type: "t", value: null },
            "t_Clouds_2": { type: "t", value: null }
        }
    ]);

    const sm = new ShaderMaterial({

        uniforms: uniforms,
        vertexShader: WaterShader.vertexShader,
        fragmentShader: WaterShader.fragmentShader,
        side: FrontSide,
        blending: NormalBlending,
        depthTest: true,
        depthWrite: true,
        transparent: false,
        lights: true,
        defines: {
            SHADOWMAP_CLOUDS: false
        }
    });
    //see https://github.com/mrdoob/three.js/pull/8429/files
    sm.shininess = 1e-4;

    if (options.lightMap !== void 0) {
        sm.lightMap = true;
        uniforms.lightMap.value = options.lightMap;
    }
    if (options.map !== void 0) {
        sm.map = true;
        uniforms.map.value = options.map;
    }
    sm.needsUpdate = true;
    return sm;
};
export default WaterMaterial;