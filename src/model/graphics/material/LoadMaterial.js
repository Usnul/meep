/**
 * Created by Alex on 16/10/2014.
 */


import {
    ClampToEdgeWrapping,
    DataTexture,
    FrontSide,
    LinearEncoding,
    MeshBasicMaterial,
    MeshPhongMaterial,
    RepeatWrapping,
    RGBAFormat,
    sRGBEncoding,
    UnsignedByteType
} from 'three';
import { SplatMaterial } from "./SplatMaterial.js";
import WaterMaterial from "./WaterMaterial";
import loadSampler2D from "../texture/sampler/loadSampler2D";
import { mergeSampler2D } from "../texture/sampler/mergeSampler2D";
import { noop } from "../../core/function/Functions.js";
import { GameAssetType } from "../../engine/asset/GameAssetType.js";

/**
 * @param textures
 * @param repeat
 * @param type
 * @param gridResolution
 * @param bumpScale
 * @param transparent
 * @param {AssetManager} assetManager
 */
export default function loadMaterial(
    {
        textures,
        repeat = { x: 1, y: 1 },
        type,
        gridResolution,
        bumpScale = 1,
        transparent = false,
        assetManager
    }
) {
    let material;
    //
    const diffuse = textures.diffuse;
    const normal = textures.normal;
    const light = textures.light;
    const bump = textures.bump;
    const specular = textures.specular;

    //

    function setTextureParameters(t) {
        t.wrapS = RepeatWrapping;
        t.wrapT = RepeatWrapping;
        t.repeat.set(repeat.x, repeat.y);
        t.anisotropy = 8;
        t.encoding = sRGBEncoding;
    }

    /**
     *
     * @param param
     * @param callback
     * @returns {Texture}
     */
    function loadTexture(param, callback) {
        if (param.isTexture) {
            return param;
        }

        let t;

        assetManager.get(param, GameAssetType.DeferredTexture, function (asset) {
            t = asset.create();
        }, noop);

        setTextureParameters(t);

        return t;
    }

    let result = {};

    let o;
    //treat splat differently
    if (type === "splat") {

        let splatMap;
        //deal with a case where splat map is an missing, and instead "splatMaps' are given
        if (textures.splat !== undefined && textures.splat.length !== undefined && textures.splat instanceof Array) {
            splatMap = new DataTexture();
            setTextureParameters(splatMap);
            splatMap.needsUpdate = true;

            const promises = textures.splat.map((url) => loadSampler2D(url, assetManager));

            result.splat = {
                samplers: promises
            };

            Promise.all(promises).then(function (results) {
                const merged = mergeSampler2D(results);
                splatMap.format = RGBAFormat;
                splatMap.type = UnsignedByteType;
                splatMap.flipY = true;
                splatMap.image = { data: merged.data, width: merged.width, height: merged.height };
                splatMap.needsUpdate = true;

                //No wrapping for splat maps
                splatMap.wrapT = ClampToEdgeWrapping;
                splatMap.wrapS = ClampToEdgeWrapping;

                splatMap.encoding = LinearEncoding;
            }, function (error) {
                console.error(error);
            });
        } else {
            splatMap = loadTexture(textures.splat);
        }

        /**
         * @type {Texture[]}
         */
        const diffuseTextures = textures.diffuse
            .map(loadTexture);

        o = {
            splatMap: splatMap,
            diffuseMaps: diffuseTextures
                .map(t => {
                    t.encoding = sRGBEncoding;

                    return t;
                }),
            gridResolution
        };
    } else {
        o = {
            specular: 0,
            shininess: 10,
            color: 0xFFFFFF,
            side: FrontSide,
            flatShading: false
        };
        if (diffuse !== void 0 && !(diffuse instanceof Array)) {
            o.map = loadTexture(diffuse);
        }
        if (normal !== void 0) {
            o.normalMap = loadTexture(normal);
        }
        if (bump !== void 0) {
            o.bumpMap = loadTexture(bump);
            o.bumpScale = bumpScale;
        }
        if (specular !== void 0) {
            o.specularMap = loadTexture(specular);
            o.shininess = 50;
            o.specular = 0x333333;
        }
    }
    //
    if (transparent) {
        o.transparent = true;
    }
    if (light !== void 0) {
        o.lightMap = loadTexture(light);
    }

    switch (type) {
        case "basic":
            material = new MeshBasicMaterial(o);
            break;
        case "splat":
            //load diffuse maps
            material = new SplatMaterial(o);
            break;
        case "water":
            material = new WaterMaterial(o);
            break;
        default :
        case "phong":
            material = new MeshPhongMaterial(o);
            break;
    }

    result.material = material;

    return result;
};
