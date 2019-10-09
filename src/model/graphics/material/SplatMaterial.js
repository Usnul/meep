/**
 * Created by Alex on 23/06/2015.
 */
import {
    ClampToEdgeWrapping,
    Color,
    DoubleSide,
    LinearFilter,
    NormalBlending,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
    Vector2
} from 'three';
import TerrainShader from "../shaders/TerrainShader";
import { promiseTextureLoaded } from "../Utils";
import Vector4 from "../../core/geom/Vector4.js";
import { Sampler2D } from "../texture/sampler/Sampler2D.js";

/**
 *
 * @param {Vector4} tex0
 * @param {Vector4} tex1
 * @param {Vector4} tex2
 * @param {Vector4} tex3
 * @param {Vector4} splat
 * @param {Vector4} result
 */
export function blendSplatTextures(tex0, tex1, tex2, tex3, splat, result) {
    const b0 = splat.x;
    const b1 = splat.y;
    const b2 = splat.z;
    const b3 = splat.w;

    const bT = b0 + b1 + b2 + b3;


    result.set(
        (tex0.x * b0 + tex1.x * b1 + tex2.x * b2 + tex3.x * b3) / bT,
        (tex0.y * b0 + tex1.y * b1 + tex2.y * b2 + tex3.y * b3) / bT,
        (tex0.z * b0 + tex1.z * b1 + tex2.z * b2 + tex3.z * b3) / bT,
        (tex0.w * b0 + tex1.w * b1 + tex2.w * b2 + tex3.w * b3) / bT
    );
}

/**
 *
 * @param {Sampler2D[]} diffuse
 * @param {Vector2} diffuseRepeat
 * @param {Sampler2D} splat
 * @param {Vector2} gridSize
 * @param {Vector2} resultTextureSize
 * @returns {Sampler2D}
 */
export function buildTerrainTexture({ diffuse, diffuseRepeat, splat, gridSize, resultTextureSize }) {
    const texture0 = diffuse[0];
    const texture1 = diffuse[1];
    const texture2 = diffuse[2];
    const texture3 = diffuse[3];

    const resultData = new Uint8Array(resultTextureSize.x * resultTextureSize.y * 4);

    const result = new Sampler2D(resultData, 4, resultTextureSize.x, resultTextureSize.y);

    //do the splatting
    let x, y, u, v;

    const tex0 = new Vector4(0, 0, 0, 0);
    const tex1 = new Vector4(0, 0, 0, 0);
    const tex2 = new Vector4(0, 0, 0, 0);
    const tex3 = new Vector4(0, 0, 0, 0);

    const vSplat = new Vector4(0, 0, 0, 0);

    const vTemp = new Vector4(0, 0, 0, 0);

    for (x = 0; x < resultTextureSize.x; x++) {

        u = x / (resultTextureSize.x - 1);

        for (y = 0; y < resultTextureSize.y; y++) {

            v = y / (resultTextureSize.y - 1);

            const dU = (u * diffuseRepeat.x) % 1;
            const dV = (v * diffuseRepeat.y) % 1;

            texture0.sample(dU, dV, tex0);
            texture1.sample(dU, dV, tex1);
            texture2.sample(dU, dV, tex2);
            texture3.sample(dU, dV, tex3);

            splat.sample(u, v, vSplat);

            blendSplatTextures(tex0, tex1, tex2, tex3, vSplat, vTemp);

            result.set(x, y, [vTemp.x, vTemp.y, vTemp.z, 255]);
        }
    }

    return result;
}

export function SplatMaterial(options) {

    const uniforms = UniformsUtils.merge([
        UniformsLib.common,
        UniformsLib.specularmap,
        UniformsLib.envmap,
        UniformsLib.aomap,
        UniformsLib.lightmap,
        UniformsLib.emissivemap,
        UniformsLib.fog,
        UniformsLib.lights,
        {
            "splatMap": { type: "t", value: null },
            "gridResolution": { type: "v2", value: new Vector2(1, 1) },
            "gridBorderWidth": { type: "f", value: 0.1 },
            "diffuseMapRepeat": { type: "v2", value: new Vector2(1, 1) },
            "diffuseMap0": { type: "t", value: null },
            "diffuseMap1": { type: "t", value: null },
            "diffuseMap2": { type: "t", value: null },
            "diffuseMap3": { type: "t", value: null },
            "diffuseGridOverlayMap": { type: "t", value: null }
        },
        {
            "emissive": { type: "c", value: new Color(0x000000) },
            "specular": { type: "c", value: new Color(0xFFFFFF) },
            "shininess": { type: "f", value: 0 }
        },
        {
            "f_CloudsTime": { type: "f", value: 0 },
            "f_CloudsAmount": { type: "f", value: 0.9 },
            "f_CloudsIntensity": { type: "f", value: 0.3 },

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

    if (options.gridResolution !== undefined) {
        uniforms.gridResolution.value.set(options.gridResolution.x, options.gridResolution.y);
    }


    //this is for the water shader, so that back of the terrain reflects in the water, otherwise edges of shoreline look odd
    //TODO check how this can be removed, it would speed water(and ordinary) rendering if back faces could be culled
    const side = DoubleSide;

    const sm = new ShaderMaterial({

        uniforms: uniforms,
        vertexShader: TerrainShader.vertexShader,
        fragmentShader: TerrainShader.fragmentShader,
        side: side,
        blending: NormalBlending,
        depthTest: true,
        depthWrite: true,
        transparent: false,
        lights: true,
        defines: {
            SHADOWMAP_CLOUDS: false,
            DIFFUSE_GRAIN: false,
        }
    });

    uniforms.diffuse.value = new Color(0xFFFFFF);

    const splatMap = options.splatMap;
    if (splatMap !== void 0) {
        //TODO: check power of two
        splatMap.wrapS = splatMap.wrapT = ClampToEdgeWrapping;
        splatMap.minFilter = LinearFilter;
        splatMap.magFilter = LinearFilter;
        uniforms.splatMap.value = splatMap;
    }
    if (options.diffuseMaps !== void 0) {
        const diffuseMaps = options.diffuseMaps;
        let i = 0;
        const l = diffuseMaps.length;
        for (; i < l; i++) {
            const diffuseMap = diffuseMaps[i];
            uniforms['diffuseMap' + i].value = diffuseMap;
            const diffuseMapRepeat = uniforms.diffuseMapRepeat.value;
            if (!diffuseMapRepeat.equals(diffuseMap.repeat)) {
                //repeat not set, copy from first map on which it's available
                diffuseMapRepeat.copy(diffuseMap.repeat);
            }
        }

        Promise.all(diffuseMaps.map(promiseTextureLoaded)).then(function (textures) {
            sm.needsUpdate = true;
        });
    }
    if (options.lightMap !== void 0) {
        sm.aoMap = true;
        uniforms.aoMap.value = options.lightMap;
        uniforms.aoMapIntensity.value = 0.7;
        //
        // sm.lightMap = true;
        // uniforms.lightMap.value = options.lightMap;
        // uniforms.lightMapIntensity.value = 1;
    }
    sm.extensions.derivatives = true; //needed for rendering grid
    sm.needsUpdate = true;

    sm.isSplatMaterial = true;

    return sm;
}