import { ManagedAtlas } from "../../../texture/atlas/ManagedTextureAtlas.js";
import { ParameterSheet } from "./parameter/ParameterSheet.js";
import {
    ClampToEdgeWrapping,
    DataTexture,
    LinearFilter,
    LinearMipMapLinearFilter,
    Matrix4,
    NearestFilter,
    RGBAFormat,
    ShaderMaterial,
    UnsignedByteType,
    Vector2 as ThreeVector2
} from "three";
import { SignalBinding } from "../../../../core/events/signal/SignalBinding.js";
import Vector2 from "../../../../core/geom/Vector2.js";
import Vector4 from "../../../../core/geom/Vector4.js";
import { ParticleParameters } from "./emitter/ParticleParameters.js";
import { capitalize } from "../../../../core/strings/StringUtils.js";
import { HashMap } from "../../../../core/collection/HashMap.js";
import { blendingType2three } from "../../../texture/sampler/blendingType2Three.js";
import { ParticleEmitterFlag } from "./emitter/ParticleEmitterFlag.js";
import { writeSample2DDataToDataTexture } from "../../../texture/sampler/writeSampler2DDataToDataTexture.js";
import { TextureAtlasDebugger } from "../../../texture/atlas/TextureAtlasDebugger.js";

function itemCountToGLType(itemCount) {
    switch (itemCount) {
        case 1:
            return 'float';
        case 2:
            return 'vec2';
        case 3:
            return 'vec3';
        case 4:
            return 'vec4';
        default:
            throw new TypeError(`Unsupported itemCount '${itemCount}'`);
    }
}

/**
 *
 * @param {number} num
 * @returns {string}
 */
function genFloat(num) {
    const str = num.toString();
    if (str.indexOf('.') === -1) {
        return str + '.0';
    } else {
        return str;
    }
}

function genParameterDecoderScalar() {
    return `float decodeParameterValueScalar(const in vec4 value, const in float offset, const in float rangeMultiplier){
        float unscaled = (value.x * 255.0 + value.y * 65280.0 + value.z * 16711680.0 + value.w * 4278190080.0);
        return unscaled * rangeMultiplier + offset;
    }`;
}

function genParameterDecoderVector2() {
    return `vec2 decodeParameterValueVector2(const in vec4 value, const in float offset, const in float rangeMultiplier){
        vec2 unscaled = vec2(value.x * 255.0 + value.y * 65280.0, value.z * 255.0 + value.w * 65280.0);
        return unscaled * rangeMultiplier + offset;
    }`;
}

function genParameterDecoderVector3() {
    return `vec3 decodeParameterValueVector3(const in vec4 value, const in float offset, const in float rangeMultiplier){
        vec3 unscaled = vec3(value.x * 255.0, value.y * 255.0, value.z * 255.0);
        return unscaled * rangeMultiplier + offset;
    }`;
}

function genParameterDecoderVector4() {
    return `vec4 decodeParameterValueVector4(const in vec4 value, const in float offset, const in float rangeMultiplier){
        vec4 unscaled =  vec4(value.x * 255.0, value.y * 255.0, value.z * 255.0, value.w * 255.0);
        return unscaled * rangeMultiplier + offset;
    }`;
}

/**
 *
 * @param {ParticleParameter} parameter
 * @returns {string}
 */
function computeDecoderFunctionName(parameter) {
    const itemSize = parameter.itemSize;
    if (itemSize === 1) {
        return 'decodeParameterValueScalar';
    } else if (itemSize === 2) {
        return 'decodeParameterValueVector2';
    } else if (itemSize === 3) {
        return 'genParameterDecoderVector3';
    } else if (itemSize === 4) {
        return 'decodeParameterValueVector4';
    } else {
        throw new Error(`Unsupported parameter itemSize(=${itemSize})`);
    }
}

/**
 *
 * @param {ParticleParameter} parameter
 * @returns {number}
 */
function computeDecoderValueRangeMultiplier(parameter) {
    const valueRange = parameter.valueMax - parameter.valueMin;

    const itemSize = parameter.itemSize;

    let multiplier;

    if (itemSize === 1) {
        multiplier = 4294967295;
    } else if (itemSize === 2) {
        multiplier = 65535;
    } else if (itemSize === 3 || itemSize === 4) {
        multiplier = 255;
    } else {
        throw new Error(`Unsupported itemSize(=${itemSize})`);
    }

    return valueRange / multiplier;
}

/**
 *
 * @param {string} samplePosition
 * @param {string} uniformName
 * @returns {string}
 */
function genParameterSampleTexel(samplePosition, uniformName) {
    const u = `${uniformName}.x + ${samplePosition} * ${uniformName}.z`;
    const v = `${uniformName}.y + layerPosition * ${uniformName}.w`;

    const textureCoordinates = `vec2( ${u}, ${v} )`;

    return `texture2D( tParameterSheet, ${textureCoordinates} )`;
}

/**
 *
 * @param {string|number} samplePosition
 * @param {ParticleParameter} parameter
 * @returns {string}
 */
function genParameterSampleValue(samplePosition, parameter) {
    const uniformName = computeParameterUniformName(parameter);

    const decoderFunctionName = computeDecoderFunctionName(parameter);

    const v4Texel = genParameterSampleTexel(samplePosition, uniformName);

    const rangeMultiplier = computeDecoderValueRangeMultiplier(parameter);

    if (rangeMultiplier === 0) {
        const glType = itemCountToGLType(parameter.itemSize);
        //no range, don't need to read
        return `${glType}( ${genFloat(parameter.valueMin)} )`;
    }

    return `${decoderFunctionName}(${v4Texel}, ${genFloat(parameter.valueMin)}, ${genFloat(rangeMultiplier)})`;
}

/**
 *
 * @constructor
 */
function MaterialRecord() {
    /**
     *
     * @type {Material}
     */
    this.material = null;

    /**
     *
     * @type {number}
     */
    this.count = 0;

    /**
     *
     * @type {SignalBinding[]}
     */
    this.signalBindings = [];

    /**
     *
     * @type {ParticleEmitter[]}
     */
    this.emitters = [];

    /**
     *
     * @type {ParameterSet|null}
     */
    this.parameters = null;

    /**
     *
     * @type {number}
     */
    this.lastAccessTime = 0;
}

/**
 *
 * @param {ParameterSet} s
 * @returns {number}
 */
function computeParameterSetHash(s) {
    return s.hash();
}


/**
 *
 * @param {ParameterSet} a
 * @param {ParameterSet} b
 * @returns {boolean}
 */
function computeParameterSetEquality(a, b) {
    return a.equals(b);
}

const EMITTER_MATERIAL_FLAGS = ParticleEmitterFlag.DepthSoftDisabled | ParticleEmitterFlag.DepthReadDisabled;

/**
 *
 * @param {ParticleEmitter} emitter
 * @returns {number}
 */
function computeEmitterMaterialHash(emitter) {
    const paramHash = emitter.parameters.hash();

    return paramHash ^ (emitter.flags & EMITTER_MATERIAL_FLAGS);
}

/**
 *
 * @param {ParticleEmitter} a
 * @param {ParticleEmitter} b
 * @returns {boolean}
 */
function computeEmitterMaterialEquality(a, b) {
    const aFlags = a.flags & EMITTER_MATERIAL_FLAGS;
    const bFlags = b.flags & EMITTER_MATERIAL_FLAGS;

    return (aFlags === bFlags) && a.parameters.equals(b.parameters);
}


/**
 * Used for placeholder texture value
 * @readonly
 * @type {Uint8Array}
 */
const FOUR_BYTE_UINT8_ARRAY = new Uint8Array(4);


/**
 *
 * @param {DataTexture} texture
 */
function clearDataTexture(texture) {
    texture.image.data = FOUR_BYTE_UINT8_ARRAY;
    texture.image.width = 1;
    texture.image.height = 1;

    texture.needsUpdate = true;
}

/**
 * @returns {DataTexture}
 */
function buildDataTexture(
    {
        anisotropy = 4,
        generateMipmaps = false,
        minFilter = LinearFilter,
        magFilter = LinearFilter
    }
) {
    const result = new DataTexture(FOUR_BYTE_UINT8_ARRAY, 1, 1, RGBAFormat);

    result.type = UnsignedByteType;
    result.flipY = false;
    result.wrapS = ClampToEdgeWrapping;
    result.wrapT = ClampToEdgeWrapping;

    result.minFilter = minFilter;
    result.magFilter = magFilter;

    // possibly not-power-of-two
    result.generateMipmaps = generateMipmaps;

    result.repeat.set(1, 1);

    result.anisotropy = anisotropy;

    result.needsUpdate = true;

    return result;
}

function debugAtlas(atlas, options) {

    const spriteAtlasDebugger = new TextureAtlasDebugger(atlas, options);

    spriteAtlasDebugger.vAtlasContent.link();
    document.body.appendChild(spriteAtlasDebugger.vAtlasContent.el);
}

/**
 *
 * @param {AssetManager} assetManager
 * @constructor
 */
function ShaderManager(assetManager) {
    /**
     *
     * @type {ManagedAtlas}
     */
    this.spriteAtlas = new ManagedAtlas(assetManager);
    this.spriteAtlas.autoUpdate = false;

    /**
     *
     * @type {ParameterSheet}
     */
    this.parameterSheet = new ParameterSheet();

    /**
     *
     * @type {DataTexture|null}
     */
    this.spriteTexture = buildDataTexture({
        generateMipmaps: true,
        minFilter: LinearMipMapLinearFilter
    });

    /**
     *
     * @type {Texture|null}
     */
    this.depthTexture = null;

    /**
     *
     * @type {DataTexture|null}
     */
    this.parameterTexture = buildDataTexture({
        generateMipmaps: false,
        magFilter: LinearFilter,
        minFilter: NearestFilter,
        anisotropy: 0
    });

    /**
     * material map is identified by parameter hash
     * @readonly
     * @private
     * @type {HashMap<ParticleEmitter, MaterialRecord>}
     */
    this.materialMap = new HashMap({
        keyHashFunction: computeEmitterMaterialHash,
        keyEqualityFunction: computeEmitterMaterialEquality
    });

    /**
     * Number of unused records to keep, this allows reused of records avoiding shader recompilation
     * @type {number}
     */
    this.recordGraveyardSize = 10;

    /**
     * @readonly
     * @private
     * @type {HashMap<ParticleEmitter, MaterialRecord>}
     */
    this.recordGraveyard = new HashMap({
        keyHashFunction: computeEmitterMaterialHash,
        keyEqualityFunction: computeEmitterMaterialEquality
    });

    /**
     *
     * @type {Vector2}
     */
    this.viewportSize = new Vector2(0, 0);

    //watch atlas updates
    this.spriteAtlas.atlas.on.painted.add(this.updateSpriteTexture, this);

    this.parameterSheet.atlas.on.painted.add(this.updateParameterTexture, this);

    // debugAtlas(this.parameterSheet.atlas, { scale: new Vector2(16, 16) });
}

/**
 *
 * @param {ParticleParameter} parameter
 * @param {Vector4} result
 */
function computeParameterSamplingRegion(parameter, result) {
    const patch = parameter.patch;

    if (patch === null) {
        result.set(0, 0, 0, 0);
        return;
    }

    const uv = patch.uv;

    const uHalfPixelOffset = (patch.uv.size.x) / (patch.size.x * 2);

    const u = uv.position.x + uHalfPixelOffset;
    const uRange = uv.size.x * ((patch.size.x - 1) / patch.size.x);

    const trackCount = parameter.getTrackCount();

    let vHalfTrackOffset;


    if (trackCount === 0) {
        //avoid division by zero
        vHalfTrackOffset = 0;
    } else {
        vHalfTrackOffset = patch.uv.size.y / (trackCount * 2);
    }

    const v = uv.position.y + vHalfTrackOffset;

    const patchHeight = patch.size.y;

    let vRange;

    if (patchHeight === 0) {
        //avoid division by zero
        vRange = 0;
    } else {
        vRange = uv.size.y * ((patchHeight - 1) / (patchHeight));
    }

    result.set(u, v, uRange, vRange);
}

/**
 *
 * @param {ParticleParameter} parameter
 * @returns {string}
 */
function computeParameterUniformName(parameter) {
    return 'uPatch' + capitalize(parameter.name);
}


/**
 * Should be called before using shaders managed by this
 */
ShaderManager.prototype.update = function () {
    this.spriteAtlas.atlas.update();
    this.parameterSheet.update();
};

/**
 * @private
 */
ShaderManager.prototype.updateParameterTexture = function () {
    const atlas = this.parameterSheet.atlas.sampler;

    const dataTexture = this.parameterTexture;

    writeSample2DDataToDataTexture(atlas, dataTexture);

    this.materialMap.forEach(function (entry) {
        const material = entry.material;
        material.uniforms.tParameterSheet.value = dataTexture;
    });
};

/**
 * @private
 */
ShaderManager.prototype.updateSpriteTexture = function () {
    // console.time("ShaderManager.updateSpriteTexture");

    const atlas = this.spriteAtlas.atlas.sampler;

    const dataTexture = this.spriteTexture;

    writeSample2DDataToDataTexture(atlas, dataTexture);

    this.materialMap.forEach(function (entry) {
        const material = entry.material;
        material.uniforms.tSpriteAtlas.value = dataTexture;

        entry.emitters.forEach(function (emitter) {
            //mark sprites for an update
            emitter.setFlag(ParticleEmitterFlag.SpritesNeedUpdate);
        });
    });

    // console.timeEnd("ShaderManager.updateSpriteTexture");
};

/**
 *
 * @returns {Material}
 * @param {ParticleEmitter} emitter
 */
ShaderManager.prototype.buildMaterial = function (emitter) {
    const parameters = emitter.parameters;

    const parameterArray = parameters.asArray();

    function vertexShader() {
        const paramScale = parameters.getParameterByName(ParticleParameters.Scale);
        const paramColor = parameters.getParameterByName(ParticleParameters.Color);


        const parameterUniforms = parameterArray.map(function (param) {
            return `uniform vec4 ${computeParameterUniformName(param)};`;
        }).join('\n');

        return `
            uniform float cameraNear;
            uniform float cameraFar;
            uniform vec2 resolution;
            uniform sampler2D tParameterSheet;
            
            ${parameterUniforms}
            
            attribute float size;
            attribute vec4 atlasPatch;
            attribute float age;
            attribute float deathAge;
            attribute float layerPosition;
            attribute float rotation;
            
			varying vec4 vPatch;
						
			varying float vSize;
		
			varying float vFadeDistance;
			
			varying vec4 vColor;
			
			varying vec2 vRotationMultiplier;
			
			${genParameterDecoderScalar()}
			${genParameterDecoderVector4()}
			
			void main() {
			    float relativeAge = clamp(age / deathAge, 0.0, 1.0);
			    
			    float paramScale = ${genParameterSampleValue('relativeAge', paramScale)};
			    vColor = ${genParameterSampleValue('relativeAge', paramColor)};
			    
			    vRotationMultiplier = vec2(cos(rotation),sin(rotation));
			    
			    vSize = size * paramScale;
			    vPatch = atlasPatch;
			    								
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				
			    #ifdef DEPTH_SOFT_ENABLED
			    
				vFadeDistance = 1.0 / vSize;
				
				#endif
				
                float radius = vSize/2.0;
                				
                gl_PointSize = resolution.y * projectionMatrix[1][1] * radius / gl_Position.w;
			}`;
    }

    const DEPTH_ERROR_MARGIN = 0.0001;

    /**
     * depthToLinear pulled from here: https://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer
     * @returns {string}
     */
    function fragmentShader() {
        return `
            #include <packing>
            uniform sampler2D tSpriteAtlas;
            uniform sampler2D tDepth;
            uniform float cameraNear;
            uniform float cameraFar;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform vec2 resolution;
            
            varying float vFadeDistance;
			varying vec4 vPatch;
			varying float vSize;
			varying vec4 vColor;
			varying vec2 vRotationMultiplier;
			
            float depthToLinear( float z ) {
                float z_n = 2.0 * z - 1.0;
                
                float z_e = 2.0 * cameraNear * cameraFar / (cameraFar + cameraNear - z_n * (cameraFar - cameraNear));
	        
	            return z_e;
	        }
	        
	        
			float calculateFade(in float particleDepth, in float sceneDepth){
		    	float zFade;
					    			    			    
			    float linearParticleDepth = depthToLinear(particleDepth);
			    
			    float linearSceneDepth = depthToLinear(sceneDepth);
			    			    
			    float depthDelta = (linearSceneDepth - linearParticleDepth);
			    			    			    
			    float inputDepth = depthDelta* vFadeDistance;
			    
			    if ((inputDepth < 1.0) && (inputDepth >= 0.0)){
			        zFade = 0.5 * pow(saturate(2.0*((inputDepth > 0.5) ? (1.0 - inputDepth) : inputDepth)), 2.0);
                    zFade = (inputDepth > 0.5) ? (1.0 - zFade) : zFade;
			    }else{
			        zFade = 1.0;
			    }
			    
			    return zFade;
			}
			
			void main() {
			    float fragmentDepth = gl_FragCoord.z;
			    
			    vec2 pixelPosition = gl_FragCoord.xy / resolution;
			    
			    float sceneDepth =  texture2D( tDepth, pixelPosition ).x;
			    
			    #ifdef DEPTH_READ_ENABLED
			    
			    if(fragmentDepth + ${DEPTH_ERROR_MARGIN} > sceneDepth){
			        discard;
			    }
			    
			    #endif
			   
			    vec2 centeredUv = gl_PointCoord - 0.5;
			    
			    vec2 texelCoordinate = vec2( centeredUv.x* vRotationMultiplier.x - centeredUv.y* vRotationMultiplier.y, centeredUv.x * vRotationMultiplier.y + centeredUv.y * vRotationMultiplier.x) + 0.5;
			    
			    texelCoordinate = clamp(texelCoordinate, vec2(0.0), vec2(1.0) );
			   			    			    
			    vec2 uv = texelCoordinate*vPatch.zw + vPatch.xy;
			    
			    vec4 spriteColor = texture2D( tSpriteAtlas, uv );
			    
			    if(spriteColor.a == 0.0){
			        discard;
			    }
			    
			    vec4 texel = texture2D( tSpriteAtlas, uv ) *vColor;
			    
			    
			    #ifdef DEPTH_SOFT_ENABLED
			    
			    float zFade = calculateFade(fragmentDepth, sceneDepth);
			    
			    texel.a *= zFade;
			    
			    #endif
			    			    
				gl_FragColor = texel;
			}`;
    }

    const uniforms = {
        tSpriteAtlas: {
            type: 't',
            value: this.spriteTexture
        },
        tParameterSheet: {
            type: 't',
            value: this.parameterTexture
        },
        cameraNear: {
            type: 'f',
            value: 1,
        },
        cameraFar: {
            type: 'f',
            value: 1,
        },
        tDepth: {
            type: 't',
            value: this.depthTexture
        },
        modelViewMatrix: {
            type: 'm4',
            value: new Matrix4()
        },
        projectionMatrix: {
            type: 'm4',
            value: new Matrix4()
        },
        resolution: {
            type: 'v2',
            value: new ThreeVector2(this.viewportSize.x, this.viewportSize.y)
        }
    };

    //add parameter uniforms
    parameterArray.forEach(function (param) {
        const uniformName = computeParameterUniformName(param);
        const vec4 = new Vector4();
        computeParameterSamplingRegion(param, vec4);
        uniforms[uniformName] = {
            type: 'v4',
            value: vec4
        };
    });

    const blending = blendingType2three(emitter.blendingMode);

    const defines = {
        DEPTH_READ_ENABLED: !emitter.getFlag(ParticleEmitterFlag.DepthReadDisabled),
        DEPTH_SOFT_ENABLED: !emitter.getFlag(ParticleEmitterFlag.DepthSoftDisabled)
    };

    const material = new ShaderMaterial({
        defines,
        uniforms,
        vertexShader: vertexShader(),
        fragmentShader: fragmentShader(),
        blending,
        lights: false,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        vertexColors: false
    });

    return material;
};

/**
 *
 * @param {ParticleEmitter} emitter
 * @param {ShaderManager} shaderManager
 * @returns {MaterialRecord}
 */
function createShaderEntry(emitter, shaderManager) {
    const entry = new MaterialRecord();
    entry.count = 0;
    entry.parameters = emitter.parameters;

    const parameters = emitter.parameters.asArray();

    function updatePatches() {
        const material = entry.material;

        parameters.forEach(function (param) {
            const uniformName = computeParameterUniformName(param);
            const uniform = material.uniforms[uniformName];

            computeParameterSamplingRegion(param, uniform.value);
        });
    }

    //add parameters to parameter sheet
    for (let i = 0; i < parameters.length; i++) {
        const particleParameter = parameters[i];
        shaderManager.parameterSheet.add(particleParameter);

        //watch for UV patch changes. These can occur when atlas is re-packed or re-sized
        const uv = particleParameter.patch.uv;

        const sbSize = new SignalBinding(uv.size.onChanged, updatePatches);
        const sbPosition = new SignalBinding(uv.position.onChanged, updatePatches);

        entry.signalBindings.push(
            sbSize,
            sbPosition
        );
    }

    const material = shaderManager.buildMaterial(emitter);

    entry.material = material;

    //link all signal bindings
    entry.signalBindings.forEach(function (b) {
        b.link();
    });

    return entry;
}

/**
 *
 * @param {ParticleEmitter} emitter
 */
ShaderManager.prototype.register = function (emitter) {
    const spriteAtlas = this.spriteAtlas;

    // load sprites
    emitter.layers.forEach(function (layer) {
        const patchPromise = spriteAtlas.acquire(layer.imageURL);

        patchPromise.then(function (patch) {
            layer.setAtlasPatch(patch);
        });
    });

    // obtain material
    let material, entry;
    if (this.materialMap.has(emitter)) {
        entry = this.materialMap.get(emitter);


        material = entry.material;
    } else {

        // entry is not in the cache, create it
        entry = createShaderEntry(emitter, this);

        material = entry.material;

        this.materialMap.set(emitter, entry);
    }

    entry.lastAccessTime = performance.now();

    entry.count++;

    entry.emitters.push(emitter);

    // assign material
    emitter.mesh.material = material;
};

/**
 * Perform intenal cleanup, remove unused material records
 */
ShaderManager.prototype.cleanup = function () {
    const recordGraveyardSize = this.recordGraveyardSize;

    while (this.recordGraveyard.size > recordGraveyardSize) {
        let bestAccessTime = Infinity;
        let bestKey = null;

        this.recordGraveyard.forEach(function (value, key) {
            if (value.lastAccessTime < bestAccessTime) {
                bestAccessTime = value.lastAccessTime;
                bestKey = key;
            }
        });

        if (!this.recordGraveyard.delete(bestKey)) {
            console.error(`Failed to remove record from the graveyard`, bestKey, this.recordGraveyard);

            this.recordGraveyard.verifyHashes(console.error);

            console.warn('Recomputing hashes ... ');

            this.recordGraveyard.updateHashes();
            this.materialMap.updateHashes();
        }

        this.materialMap.delete(bestKey);
    }
};

/**
 *
 * @param {MaterialRecord} entry
 */
ShaderManager.prototype.destroyMaterialRecord = function (entry) {

    const parameters = entry.parameters.asArray();

    //remove parameters from parameter sheet
    for (let i = 0; i < parameters.length; i++) {
        const particleParameter = parameters[i];
        this.parameterSheet.remove(particleParameter);
    }

    //unlink signal bindings
    entry.signalBindings.forEach(function (binding) {
        binding.unlink();
    });

    //decommission material
    entry.material.dispose();
};

/**
 *
 * @param {ParticleEmitter} emitter
 */
ShaderManager.prototype.deregister = function (emitter) {
    const entry = this.materialMap.get(emitter);

    if (entry === undefined) {
        console.error(`Attempted to deregisted emitter that was not registered (not found in materialMap). Request ignored.`, emitter);
        return;
    }

    entry.count--;

    //release material
    const spriteAtlas = this.spriteAtlas;

    //release sprites
    emitter.layers.forEach(function (layer) {
        spriteAtlas.release(layer.imageURL);
    });


    if (entry.count <= 0) {
        //last usage removed
        this.recordGraveyard.set(emitter, entry);
        this.cleanup();

    } else {
        //remove reference to material from the entry
        const emitterIndex = entry.emitters.indexOf(emitter);

        if (emitterIndex === -1) {
            console.warn('Emitter was not found in the shader manager');
            return;
        }

        //remove
        entry.emitters.splice(emitterIndex, 1);
    }
};

/**
 *
 * @param {Camera} camera THREE.js Camera object
 */
ShaderManager.prototype.setCamera = function (camera) {
    this.camera = camera;

    const projectionMatrix = camera.projectionMatrix;
    const modelViewMatrix = (new Matrix4()).multiplyMatrices(camera.matrixWorldInverse, camera.matrixWorld);
    const cameraNear = camera.near;
    const cameraFar = camera.far;

    this.materialMap.forEach(function (entry) {
        const uniforms = entry.material.uniforms;

        uniforms.projectionMatrix.value = projectionMatrix;
        uniforms.modelViewMatrix.value = modelViewMatrix;
        uniforms.cameraNear.value = cameraNear;
        uniforms.cameraFar.value = cameraFar;
    });
};

/**
 *
 * @param {Texture} texture
 */
ShaderManager.prototype.setDepthTexture = function (texture) {
    this.depthTexture = texture;

    this.materialMap.forEach(function (entry) {
        const material = entry.material;
        material.uniforms.tDepth.value = texture;
    });
};

/**
 *
 * @param {number} x
 * @param {number} y
 */
ShaderManager.prototype.setViewportSize = function (x, y) {
    this.viewportSize.set(x, y);

    this.materialMap.forEach(function (entry) {
        entry.material.uniforms.resolution.value.set(x, y);
    });
};

export { ShaderManager };
