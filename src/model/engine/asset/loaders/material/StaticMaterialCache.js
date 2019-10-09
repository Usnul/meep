import { Cache } from "../../../../core/Cache.js";
import { computeHashArray, computeHashFloat, computeHashIntegerArray } from "../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../core/strings/StringUtils.js";


/**
 *
 * @param {Plane} plane
 * @returns {number}
 */
function planeHash(plane) {
    //TODO implement
    return 0;
}

/**
 *
 * @param {Plane} a
 * @param {Plane} b
 * @returns {boolean}
 */
function planesEqual(a, b) {
    return a.equals(b);
}


/**
 * @template T
 * @param {T[]} a
 * @param {T[]} b
 * @param {function(T,T):boolean} elementsEqual
 * @returns {boolean}
 */
function arraysEqual(a, b, elementsEqual) {
    if (a === b) {
        return true;
    }

    if (a === null || b === null || a === undefined || b === undefined) {
        return false
    }

    const l = a.length;
    if (l !== b.length) {
        return false;
    }

    for (let i = 0; i < l; i++) {
        const aE = a[i];
        const bE = b[i];

        if (!elementsEqual(aE, bE)) {
            return false;
        }
    }

    return true;
}

/**
 *
 * @param {Texture} texture
 * @returns {number}
 */
function textureHash(texture) {
    //TODO implement
    return 0;
}

/**
 *
 * @param {Image} a
 * @param {Image} b
 * @returns {boolean}
 */
function textureImagesEqual(a, b) {
    if (a instanceof Image && b instanceof Image) {
        //both are images
        if (a.src === b.src) {
            //same source
            return true;
        }
    }

    return false;
}

/**
 *
 * @param {Texture} a
 * @param {Texture} b
 * @returns {boolean}
 */
function texturesEqual(a, b) {
    if (a === b) {
        return true;
    }

    if (a === null || b === null || a === undefined || b === undefined) {
        return false
    }

    if (
        !textureImagesEqual(a.image, b.image)
        || a.mapping !== b.mapping
        || a.wrapS !== b.wrapS
        || a.wrapT !== b.wrapT
        || a.magFilter !== b.magFilter
        || a.minFilter !== b.minFilter
        || a.anisotropy !== b.anisotropy
        || a.format !== b.format
        || a.type !== b.type
        || !a.offset.equals(b.offset)
        || !a.repeat.equals(b.repeat)
        || !a.center.equals(b.center)
        || a.rotation !== b.rotation
        || a.generateMipmaps !== b.generateMipmaps
        || a.premultiplyAlpha !== b.premultiplyAlpha
        || a.flipY !== b.flipY
        || a.unpackAlignment !== b.unpackAlignment
        || a.encoding !== b.encoding
    ) {
        return false;
    }

    //TODO implement support for other texture types
    return true;
}

/**
 *
 * @param {Material} material
 * @returns {number}
 */
function materialHash(material) {
    let hash = 0;

    hash = computeHashIntegerArray(
        hash,
        computeHashFloat(material.alphaTest),
        material.blendDst,
        material.blendDstAlpha === null ? 0 : computeHashFloat(material.blendDstAlpha),
        material.blendEquation,
        material.blendEquationAlpha === null ? 0 : computeHashFloat(material.blendEquationAlpha),
        material.blending,
        material.blendSrc,
        material.blendSrcAlpha === null ? 0 : computeHashFloat(material.blendSrcAlpha),
        material.clipIntersection ? 0 : 1,
        material.clippingPlanes === null ? 0 : computeHashArray(material.clippingPlanes, planeHash),
        material.clipShadows ? 0 : 1,
        material.colorWrite ? 0 : 1,
        material.depthFunc,
        material.depthTest ? 0 : 1,
        material.depthWrite ? 0 : 1,
        material.fog ? 0 : 1,
        material.lights ? 0 : 1,
        computeHashFloat(material.opacity),
        material.polygonOffset ? 0 : 1,
        computeHashFloat(material.polygonOffsetFactor),
        computeHashFloat(material.polygonOffsetUnits),
        computeStringHash(material.precision),
        material.premultipliedAlpha ? 0 : 1,
        material.dithering ? 0 : 1,
        material.flatShading ? 0 : 1,
        material.side,
        material.transparent ? 0 : 1,
        computeStringHash(material.type),
        material.vertexColors,
        material.vertexTangents ? 0 : 1,
        material.visible ? 0 : 1,
    );

    if (material.isMeshStandardMaterial) {
        //TODO extend hash
    }

    return hash;
}


/**
 *
 * @param {Material|MeshStandardMaterial} a
 * @param {Material|MeshStandardMaterial} b
 * @returns {boolean}
 */
function materialEquals(a, b) {
    if (a.type !== b.type) {
        return false;
    }

    if (
        a.alphaTest !== b.alphaTest
        || a.blendDst !== b.blendDst
        || a.blendDstAlpha !== b.blendDstAlpha
        || a.blendEquation !== b.blendEquation
        || a.blendEquationAlpha !== b.blendEquationAlpha
        || a.blending !== b.blending
        || a.blendSrc !== b.blendSrc
        || a.blendSrcAlpha !== b.blendSrcAlpha
        || a.clipIntersection !== b.clipIntersection
        || !arraysEqual(a.clippingPlanes, b.clippingPlanes, planesEqual)
        || a.clipShadows !== b.clipShadows
        || a.colorWrite !== b.colorWrite
        || a.depthFunc !== b.depthFunc
        || a.depthTest !== b.depthTest
        || a.depthWrite !== b.depthWrite
        || a.fog !== b.fog
        || a.lights !== b.lights
        || a.opacity !== b.opacity
        || a.polygonOffset !== b.polygonOffset
        || a.polygonOffsetFactor !== b.polygonOffsetFactor
        || a.polygonOffsetUnits !== b.polygonOffsetUnits
        || a.precision !== b.precision
        || a.premultipliedAlpha !== b.premultipliedAlpha
        || a.dithering !== b.dithering
        || a.flatShading !== b.flatShading
        || a.side !== b.side
        || a.transparent !== b.transparent
        || a.vertexColors !== b.vertexColors
        || a.vertexTangents !== b.vertexTangents
        || a.visible !== b.visible
    ) {
        return false;
    }

    if (a.isMeshStandardMaterial) {
        if (
            !a.color.equals(b.color)
            || a.roughness !== b.roughness
            || a.metalness !== b.metalness
            || !texturesEqual(a.map, b.map)
            || !texturesEqual(a.lightMap, b.lightMap)
            || a.lightMapIntensity !== b.lightMapIntensity
            || !texturesEqual(a.aoMap, b.aoMap)
            || a.aoMapIntensity !== b.aoMapIntensity
            || !a.emissive.equals(b.emissive)
            || a.emissiveIntensity !== b.emissiveIntensity
            || !texturesEqual(a.emissiveMap, b.emissiveMap)
            || !texturesEqual(a.bumpMap, b.bumpMap)
            || a.bumpScale !== b.bumpScale
            || !texturesEqual(a.normalMap, b.normalMap)
            || a.normalMapType !== b.normalMapType
            || !a.normalScale.equals(b.normalScale)
            || !texturesEqual(a.displacementMap, b.displacementMap)
            || a.displacementScale !== b.displacementScale
            || a.displacementBias !== b.displacementBias
            || !texturesEqual(a.roughnessMap, b.roughnessMap)
            || !texturesEqual(a.metalnessMap, b.metalnessMap)
            || !texturesEqual(a.alphaMap, b.alphaMap)
            || !texturesEqual(a.envMap, b.envMap)
            || a.envMapIntensity !== b.envMapIntensity
            || a.refractionRatio !== b.refractionRatio
            || a.wireframe !== b.wireframe
            || a.wireframeLinewidth !== b.wireframeLinewidth
            || a.skinning !== b.skinning
            || a.morphTargets !== b.morphTargets
            || a.morphNormals !== b.morphNormals
        ) {
            return false;
        }
    } else {
        //TODO implement other material types
        return false;
    }

    return true;
}


export class StaticMaterialCache {
    constructor() {

        this.materialCache = new Cache({
            maxWeight: 1000,
            keyHashFunction: materialHash,
            keyEqualityFunction: materialEquals
        });

    }

    /**
     *
     * @param {Material} material
     * @returns {Material}
     */
    acquire(material) {
        const existingMaterial = this.materialCache.get(material);
        if (existingMaterial === null) {
            //doesn't exist, add
            this.materialCache.put(material, material);
            return material;
        } else {
            return existingMaterial;
        }
    }
}
