import {
    DataTexture,
    LinearFilter,
    LinearMipMapLinearFilter,
    NormalBlending,
    Points,
    RGBAFormat,
    ShaderMaterial,
    Vector2 as ThreeVector2
} from 'three';
import { MarkerGL } from "./MarkerGL.js";
import { MarkerGLAttributes } from "./MarkerGLAttributes.js";
import { MinimapWorldLayer } from "./MinimapWorldLayer.js";
import { ManagedAtlas } from "../../../model/graphics/texture/atlas/ManagedTextureAtlas.js";
import { ParticleSpecification } from "../../../model/graphics/particles/particular/group/ParticleSpecification.js";
import { ParticleAttributeType, ParticleDataType } from "../../../model/graphics/particles/particular/group/ParticleGroup.js";
import { EntityObserver } from "../../../model/engine/ecs/EntityObserver.js";
import Transform from "../../../model/engine/ecs/components/Transform.js";
import { MinimapMarker } from "../../ecs/minimap/MinimapMarker.js";
import { writeSample2DDataToDataTexture } from "../../../model/graphics/texture/sampler/writeSampler2DDataToDataTexture.js";

/**
 *
 * @return {ShaderMaterial}
 */
function buildMaterial() {
    function vertexShader() {
        return `
            attribute float size;
            attribute vec4 patch;
            
			varying vec4 vPatch;
			
			uniform vec2 resolution;
			
			vec2 extractScale2D(mat4 matrix){
			    float sx = length(matrix[0].xyz);
			    float sz = length(matrix[2].xyz);
			
			    return vec2(sx, sz);
			}
			
			void main() {
			    vPatch = patch;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				
				//extract scale
				vec2 scale =  extractScale2D(projectionMatrix);

                float radius = size / 2.0;
							
				gl_Position = projectionMatrix * mvPosition;
				gl_PointSize = resolution.y * radius * max(scale.x, scale.y);
			}`;
    }

    function fragmentShader() {
        return `
            uniform sampler2D atlas;
            
			varying vec4 vPatch;
			void main() {
			    vec2 uv = gl_PointCoord*vPatch.zw + vPatch.xy;
			    vec4 texel = texture2D( atlas, uv );
			    
			    if(texel.a < 0.1){
			        discard;
			    }
			    
				gl_FragColor = texel;
			}`;
    }


    const dataTexture = new DataTexture(new Uint8Array(4), 1, 1, RGBAFormat);
    dataTexture.flipY = false;
    dataTexture.generateMipmaps = true;
    dataTexture.minFilter = LinearMipMapLinearFilter;
    dataTexture.magFilter = LinearFilter;

    const uniforms = {
        atlas: {
            type: 't',
            value: dataTexture
        },
        resolution: {
            type: 'v2',
            value: new ThreeVector2()
        }
    };

    const material = new ShaderMaterial({
        uniforms,
        vertexShader: vertexShader(),
        fragmentShader: fragmentShader(),
        blending: NormalBlending,
        lights: false,
        fog: false,
        depthTest: false,
        transparent: true,
        vertexColors: false
    });

    return material;
}

/**
 *
 * @param {EntityComponentDataset} entityDataset
 * @param {AssetManager} assetManager
 * @param {Rectangle} worldBounds
 * @param {Vector2} canvasSize
 * @constructor
 */
export class MinimapMarkersGL extends MinimapWorldLayer {
    /**
     *
     * @param {EntityComponentDataset} entityDataset
     * @param {AssetManager} assetManager
     */
    constructor(entityDataset, assetManager) {
        super();
        const self = this;

        /**
         *
         * @type {EntityComponentDataset}
         */
        this.entityDataset = entityDataset;

        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = assetManager;

        this.atlasManager = new ManagedAtlas(assetManager);
        //disable automatic updates as we have a dedicated pre-render method to update the atlas
        this.atlasManager.autoUpdate = false;

        this.material = buildMaterial();


        /**
         *
         * @type {Map<number, MarkerGL>}
         */
        const markers = this.markers = new Map();

        const particleSpecification = new ParticleSpecification();

        particleSpecification
            .add(new ParticleAttribute("position", ParticleAttributeType.Vector3, ParticleDataType.Float32))
            .add(new ParticleAttribute("size", ParticleAttributeType.Scalar, ParticleDataType.Float32))
            .add(new ParticleAttribute("patch", ParticleAttributeType.Vector4, ParticleDataType.Float32));

        /**
         *
         * @type {ParticleGroup}
         */
        const particles = this.particles = particleSpecification.build();

        this.entityObserver = new EntityObserver([Transform, MinimapMarker], addElement, removeElement);


        /**
         *
         * @param {Number} entity
         * @param {MinimapMarker} marker
         * @param {Transform} transform
         */
        function addElement(transform, marker, entity) {
            const reference = particles.createImmediate();


            const markerGL = new MarkerGL(marker, transform, entity, reference, self);

            markers.set(entity, markerGL);

            markerGL.startup();


        }

        /**
         *
         * @param transform
         * @param marker
         * @param {Number} entity
         */
        function removeElement(transform, marker, entity) {
            const markerGL = markers.get(entity);

            //update IDs of remaining markers
            const id = markerGL.id;

            particles.executeOperationRemove([id]);

            markerGL.shutdown();

            //remove marker from the map
            markers.delete(entity);
        }

        this.shutdownHooks = [];

        //
        this.object = new Points(this.particles.geometry.getValue(), this.material);
        this.object.frustumCulled = false;

        this.viewportSize = new Vector2();
    }

    setViewportSize(x, y) {
        this.viewportSize.set(x, y);

        this.material.uniforms.resolution.value.set(x, y);
        this.needsRender = true;
    }


    handleAtlasUpdate() {
        writeSample2DDataToDataTexture(this.atlasManager.atlas.sampler, this.material.uniforms.atlas.value);

        this.updateSprites();

        this.needsRender = true;
    }

    updateSprites() {

        this.markers.forEach((marker) => {
            const patch = marker.patch;
            if (patch !== null) {
                /**
                 * @type {Rectangle}
                 */
                const patchUv = patch.uv;

                this.particles.executeOperationWriteAttribute_Vector4(
                    marker.id,
                    MarkerGLAttributes.AttributePatch,
                    patchUv.position.x,
                    patchUv.position.y,
                    patchUv.size.x,
                    patchUv.size.y
                );
            }
        });

        this.needsRender = true;
    }

    startup() {
        console.log("MinimapMarkersGL startup");

        const self = this;

        this.entityDataset.addObserver(this.entityObserver, true);

        const atlas = this.atlasManager.atlas;

        const points = this.object;

        function updateGeometry() {
            points.geometry = self.particles.geometry.getValue();
        }

        updateGeometry();

        this.particles.geometry.onChanged.add(updateGeometry);

        this.shutdownHooks.push(function () {
            self.particles.geometry.onChanged.remove(updateGeometry);
        });

        atlas.on.painted.add(this.handleAtlasUpdate, this);
        this.shutdownHooks.push(() => {
            atlas.on.painted.remove(this.handleAtlasUpdate);
        });


        this.handleAtlasUpdate();

        this.needsRender = true;
    }

    update() {
        this.atlasManager.atlas.update();

        this.needsUpdate = false;
    }

    shutdown() {
        console.log("MinimapMarkersGL shutdown");

        this.entityObserver.disconnect();

        this.markers.forEach(function (marker) {
            marker.shutdown();
        });

        this.atlasManager.reset();

        this.markers.clear();

        //clear out data arrays
        this.particles.reset();

        //execute shutdown hooks
        this.shutdownHooks.forEach(function (hook) {
            hook();
        });
        //clear out hooks
        this.shutdownHooks = [];
    }
}
