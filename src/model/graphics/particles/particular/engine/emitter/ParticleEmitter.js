import Vector3 from "../../../../../core/geom/Vector3.js";
import List from "../../../../../core/collection/List.js";
import { ParticleAttributeType, ParticleDataType } from "../../group/ParticleGroup.js";
import {
    randomPointInBox,
    randomPointInPoint,
    randomPointInSphere,
    randomPointOnBox,
    randomPointOnSphere
} from "../../../../../core/geom/GeometryMath.js";
import { Box3, BufferGeometry, Frustum, Matrix4, Points, PointsMaterial } from 'three';
import { frustumFromCamera } from "../../../../ecs/camera/CameraSystem.js";
import { ParticlePool } from "./ParticlePool.js";
import { ParticleParameter } from "../parameter/ParticleParameter.js";
import { ParameterSet } from "../parameter/ParameterSet.js";
import { assert } from "../../../../../core/assert.js";
import { LeafNode } from "../../../../../core/bvh2/LeafNode.js";
import { MovingBoundingBox } from "../MovingBoundingBox.js";
import { AABB3 } from "../../../../../core/bvh2/AABB3.js";
import { EmissionFromType, EmissionShapeType, ParticleLayer } from "./ParticleLayer.js";
import { ParticleParameters } from "./ParticleParameters.js";
import { BlendingType } from "../../../../texture/sampler/BlendingType.js";
import Quaternion from "../../../../../core/geom/Quaternion.js";
import { computeHashIntegerArray, lerp, max2, min2 } from "../../../../../core/math/MathUtils.js";
import { ParticleSpecification } from "../../group/ParticleSpecification.js";
import { ParticleAttribute } from "../../group/ParticleAttribute.js";
import { composeMatrix4, composeMatrix4RotationScale } from "../../../../Utils.js";
import { ParticleEmitterFlag } from "./ParticleEmitterFlag.js";

const EMPTY_GEOMETRY = new BufferGeometry();

const PARTICLE_ATTRIBUTE_POSITION = 0;
const PARTICLE_ATTRIBUTE_AGE = 1;
const PARTICLE_ATTRIBUTE_DEATH_AGE = 2;
const PARTICLE_ATTRIBUTE_UV = 3;
const PARTICLE_ATTRIBUTE_SIZE = 4;
const PARTICLE_ATTRIBUTE_LAYER_POSITION = 5;
const PARTICLE_ATTRIBUTE_VELOCITY = 6;
const PARTICLE_ATTRIBUTE_ROTATION = 7;
const PARTICLE_ATTRIBUTE_ROTATION_SPEED = 8;


const SERIALIZABLE_FLAGS = ParticleEmitterFlag.PreWarm
    | ParticleEmitterFlag.DepthSorting
    | ParticleEmitterFlag.DepthReadDisabled
    | ParticleEmitterFlag.DepthSoftDisabled
;

/**
 *
 * @param {EmissionFromType} emissionType
 * @param {EmissionShapeType} emissionShape
 * @returns {function(random: function, result:Vector3):void}
 */
function computeEmissionFunction(emissionType, emissionShape) {
    if (emissionShape === EmissionShapeType.Point) {
        return randomPointInPoint;
    } else if (emissionShape === EmissionShapeType.Sphere) {
        if (emissionType === EmissionFromType.Volume) {
            return randomPointInSphere;
        } else if (emissionType === EmissionFromType.Shell) {
            return randomPointOnSphere;
        } else {
            throw new TypeError(`Unsupported EmissionFrom Type`);
        }
    } else if (emissionShape === EmissionShapeType.Box) {
        if (emissionType === EmissionFromType.Volume) {
            return randomPointInBox;
        } else if (emissionType === EmissionFromType.Shell) {
            return randomPointOnBox;
        } else {
            throw new TypeError(`Unsupported EmissionFrom Type`);
        }
    }
}

/**
 *
 * @param {ParameterSet} parameters
 */
function generateStandardParameterSet(parameters) {
    const pScale = new ParticleParameter(ParticleParameters.Scale, 1);
    pScale.setDefault([1], [0]);

    const pColor = new ParticleParameter(ParticleParameters.Color, 4);
    pColor.setDefault([1, 1, 1, 1], [0]);

    parameters.add(pScale);
    parameters.add(pColor);
}

export class ParticleEmitter {
    constructor() {
        /**
         * @type {ParameterSet}
         */
        this.parameters = new ParameterSet();
        generateStandardParameterSet(this.parameters);


        /**
         * @private
         * @type {List<ParticleLayer>}
         */
        this.layers = new List();

        /**
         *
         * @type {Vector3}
         */
        this.position = new Vector3(0, 0, 0);
        this.scale = new Vector3(1, 1, 1);
        this.rotation = new Quaternion(0, 0, 0, 1);

        /**
         *
         * @type {Vector3}
         * @private
         */
        this.__lastSpawnPosition = new Vector3(0, 0, 0);

        this.sleepTime = 0;

        /**
         *
         * @type {BlendingType|number}
         */
        this.blendingMode = BlendingType.Normal;

        /**
         *
         * @type {ParticlePool|null}
         */
        this.particles = null;

        /**
         *
         * @type {Object3D|null}
         */
        this.mesh = null;

        const self = this;

        /**
         * @private
         * @type {AABB3}
         */
        this.baseBoundingBox = new AABB3(Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity);

        const boundingBox = new AABB3(Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity);
        this.boundingBox = boundingBox;
        const bvhLeaf = new LeafNode(this, 0, 0, 0, 0, 0, 0);
        this.bvhLeaf = bvhLeaf;

        const movingBoundingBox = new MovingBoundingBox();
        movingBoundingBox.trailBounds = this.bvhLeaf;
        movingBoundingBox.objectBounds = this.boundingBox;

        /**
         * @private
         * @type {MovingBoundingBox}
         */
        this.movingBox = movingBoundingBox;

        this.position.onChanged.add((x, y, z) => {
            movingBoundingBox.move(x, y, z);
            if (bvhLeaf.parentNode !== null) {
                bvhLeaf.parentNode.bubbleRefit();
            }

            this.updateGeometryBounds();
        });

        this.scale.onChanged.add(this.computeBoundingBox, this);

        this.rotation.onChanged.add(this.computeBoundingBox, this);

        /**
         * Bit Field of {@link ParticleEmitterFlag}
         * @type {number}
         */
        this.flags = ParticleEmitterFlag.DepthSorting | ParticleEmitterFlag.HashNeedUpdate | ParticleEmitterFlag.Emitting;

        /**
         *
         * @type {number}
         * @private
         */
        this.__hash = 0;
    }

    /**
     *
     * @param {number|ParticleEmitterFlag} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|ParticleEmitterFlag} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|ParticleEmitterFlag} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|ParticleEmitterFlag} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    /**
     * @private
     */
    registerLayerParameters() {
        const self = this;
        this.parameters.setTrackCount(this.layers.length);
        this.layers.forEach(function (layer, index) {
            self.parameters.setTracks(index, layer.parameterTracks);
        });
    }

    toJSON() {
        return {
            position: this.position.toJSON(),
            scale: this.scale.toJSON(),
            rotation: this.rotation.toJSON(),
            parameters: this.parameters.toJSON(),
            preWarm: this.getFlag(ParticleEmitterFlag.PreWarm),
            readDepth: !this.getFlag(ParticleEmitterFlag.DepthReadDisabled),
            softDepth: !this.getFlag(ParticleEmitterFlag.DepthSoftDisabled),
            blendingMode: this.blendingMode,
            layers: this.layers.toJSON()
        };
    }

    fromJSON(json) {
        if (typeof json.blendingMode === "number") {
            this.blendingMode = json.blendingMode;
        } else {
            this.blendingMode = BlendingType.Normal;
        }

        if (json.position !== undefined) {
            this.position.fromJSON(json.position);
        }

        if (json.scale !== undefined) {
            this.scale.fromJSON(json.scale);
        }

        if (json.rotation !== undefined) {
            this.rotation.fromJSON(json.rotation);
        }

        if (json.parameters !== undefined) {
            this.parameters.fromJSON(json.parameters);
        }

        if (typeof json.preWarm === "boolean") {
            this.writeFlag(ParticleEmitterFlag.PreWarm, json.preWarm);
        } else {
            this.writeFlag(ParticleEmitterFlag.PreWarm, false);
        }

        if (typeof json.readDepth === 'boolean') {
            this.writeFlag(ParticleEmitterFlag.DepthReadDisabled, !json.readDepth);
        } else {
            this.writeFlag(ParticleEmitterFlag.DepthReadDisabled, false);
        }

        if (typeof json.softDepth === 'boolean') {
            this.writeFlag(ParticleEmitterFlag.DepthSoftDisabled, !json.softDepth);
        } else {
            this.writeFlag(ParticleEmitterFlag.DepthSoftDisabled, false);
        }

        this.layers.fromJSON(json.layers, ParticleLayer);

        this.writeFlag(ParticleEmitterFlag.Built, false);
        this.setFlag(ParticleEmitterFlag.Emitting);

        //register loaded layers
        this.registerLayerParameters();
    }


    /**
     *
     * @param {ParticleLayer} layer
     */
    addLayer(layer) {
        this.layers.add(layer);

        const numLayers = this.layers.length;
        this.parameters.setTrackCount(numLayers);

        this.parameters.setTracks(numLayers - 1, layer.parameterTracks);
    }

    /**
     *
     * @param {function(layer:ParticleLayer,index:number)} visitor
     * @param {*} [thisArg]
     */
    traverseLayers(visitor, thisArg) {
        const layers = this.layers;

        const l = layers.length;

        for (let i = 0; i < l; i++) {
            const layer = layers.get(i);

            visitor.call(thisArg, layer, i);
        }
    }

    computeBaseBoundingBox() {

        const numLayers = this.layers.length;

        for (let i = 0; i < numLayers; i++) {
            const particleLayer = this.layers.get(i);

            particleLayer.computeBoundsAttributes();

        }

    }

    /**
     * Causes all active particles from a given layer to be destroyed immediately
     * @param {ParticleLayer} layer
     * @return {number} number of particles destroyed
     */
    destroyParticlesFromLayer(layer) {
        const layers = this.layers;

        const targetLayerIndex = layers.indexOf(layer);

        if (targetLayerIndex === -1) {
            //layer doesn't exist
            throw new Error('Layer not found');
        }

        const numLayers = layers.length;

        const particles = this.particles;
        const occupancy = particles.occupancy;

        let removeCount = 0;

        for (let i = occupancy.nextSetBit(0); i !== -1; i = occupancy.nextSetBit(i + 1)) {
            const layerPosition = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_LAYER_POSITION);

            const layerIndex = Math.round(layerPosition * numLayers);

            if (layerIndex !== targetLayerIndex) {
                // not the layer we want
                continue;
            }

            //destroy the particle
            occupancy.set(i, false);

            removeCount++;
        }

        if (removeCount > 0) {
            //remove dead particles from the pool
            particles.compact();
        }

        return removeCount;
    }

    computeBoundingBox() {

        const position = this.position;
        const rotation = this.rotation;
        const scale = this.scale;

        composeMatrix4RotationScale(matrix4, rotation, scale);

        let x0 = Infinity,
            y0 = Infinity,
            z0 = Infinity,
            x1 = -Infinity,
            y1 = -Infinity,
            z1 = -Infinity;

        if (this.getFlag(ParticleEmitterFlag.BaseBoundsNeedUpdate)) {
            //bounding box is not initialized
            this.computeBaseBoundingBox();
        }

        const numLayers = this.layers.length;

        for (let i = 0; i < numLayers; i++) {
            const particleLayer = this.layers.get(i);

            const s_2 = particleLayer.scaledSpriteHalfSize;

            particleLayer.baseBoundingBox.traverseCorners(function (x, y, z) {
                v3.set(x, y, z);
                v3.applyMatrix4_three(matrix4);

                x0 = min2(x0, v3.x - s_2);
                y0 = min2(y0, v3.y - s_2);
                z0 = min2(z0, v3.z - s_2);

                x1 = max2(x1, v3.x + s_2);
                y1 = max2(y1, v3.y + s_2);
                z1 = max2(z1, v3.z + s_2);
            });
        }

        const boundingBox = this.boundingBox;

        boundingBox.x0 = x0;
        boundingBox.y0 = y0;
        boundingBox.z0 = z0;

        boundingBox.x1 = x1;
        boundingBox.y1 = y1;
        boundingBox.z1 = z1;

        this.movingBox.move(position.x, position.y, position.z);

        this.updateGeometryBounds();
    }

    updateGeometryBounds() {

        const particles = this.particles;

        if (particles === null) {
            return;
        }

        const geometry = particles.geometry.getValue();

        if (geometry !== null) {
            geometry.boundingBox.min.set(this.bvhLeaf.x0, this.bvhLeaf.y0, this.bvhLeaf.z0);
            geometry.boundingBox.max.set(this.bvhLeaf.x1, this.bvhLeaf.y1, this.bvhLeaf.z1);
        }
    }

    /**
     * @param {number} limit longest maximum life per layer, layers that exceed this value are ignored. Measured in seconds
     * @returns {number} in seconds
     */
    computeMaxEmittingParticleLife(limit = 60) {
        const layers = this.layers;

        const numLayers = layers.length;

        let i;
        let result = 0;

        for (i = 0; i < numLayers; i++) {
            const layer = layers.get(i);

            if (layer.emissionRate <= 0 && layer.emissionImmediate <= 0) {
                //skip layers with no emission
                continue;
            }

            const maxLifeTime = layer.particleLife.max;

            if (maxLifeTime > limit) {
                //ignore layer, it's above limit
                continue;
            }

            if (maxLifeTime > result) {
                result = maxLifeTime;
            }
        }

        return result;
    }

    build() {

        this.particles = new ParticlePool(particleSpecification);

        //make overallocation a bit more aggressive to prevent frequent resizing
        this.particles.shrinkFactor = 0.5;

        this.particles.build();

        const points = new Points(EMPTY_GEOMETRY, defaultPointsMaterial);
        points.frustumCulled = false;
        points.matrixAutoUpdate = false;

        this.mesh = points;

        //subscribe to geometry changes
        this.particles.geometry.process((geometry) => {
            points.geometry = geometry;

            //set bounding box
            geometry.boundingBox = new Box3();

            this.updateGeometryBounds();
        });

        //compute max particle life
        this.movingBox.memory = this.computeMaxEmittingParticleLife();

        //build parameters
        this.parameters.build();

        //mark bounds for update
        this.writeFlag(ParticleEmitterFlag.BaseBoundsNeedUpdate, true);

        //update bounding box
        this.computeBoundingBox();

        // mark as built
        this.setFlag(ParticleEmitterFlag.Built | ParticleEmitterFlag.HashNeedUpdate);
    }

    initialize() {
        //set buffered position to current position
        this.__lastSpawnPosition.copy(this.position);

        //emit immediate
        let i;
        const numLayers = this.layers.length;

        if (this.getFlag(ParticleEmitterFlag.PreWarm)) {
            //pre-warm the emitter
            for (i = 0; i < numLayers; i++) {
                const layer = this.layers.get(i);
                if (layer.emissionRate > 0 && layer.isEmitting) {
                    const averageLifetime = (layer.particleLife.max + layer.particleLife.min) / 2;
                    this.spawnLayerParticlesContinuous(i, averageLifetime);
                }
            }
        }

        for (i = 0; i < numLayers; i++) {
            //immediate emission
            const layer = this.layers.get(i);
            if (layer.emissionImmediate > 0 && layer.isEmitting) {
                this.spawnLayerParticlesImmediate(i, layer.emissionImmediate);
            }
        }

        // Mark as initialized
        this.setFlag(ParticleEmitterFlag.Initialized);
    }

    computeHash() {
        const parametersHash = this.parameters.hash();
        const layersHash = this.layers.hash();

        /**
         * Extract relevant flags
         * @type {number}
         */
        const flags = this.flags & (SERIALIZABLE_FLAGS);

        return computeHashIntegerArray(parametersHash, layersHash, this.blendingMode, flags);
    }

    hash() {
        if (this.getFlag(ParticleEmitterFlag.HashNeedUpdate)) {
            this.__hash = this.computeHash();
            this.clearFlag(ParticleEmitterFlag.HashNeedUpdate);
        }

        return this.__hash;
    }

    /**
     *
     * @param {ParticleEmitter} other
     * @returns {boolean}
     */
    equals(other) {
        return this.blendingMode === other.blendingMode
            && this.parameters.equals(other.parameters)
            && this.layers.equals(other.layers)
            && this.getFlag(ParticleEmitterFlag.DepthSorting) === other.getFlag(ParticleEmitterFlag.DepthSorting)
            && this.getFlag(ParticleEmitterFlag.PreWarm) === other.getFlag(ParticleEmitterFlag.PreWarm);
    }

    /**
     * PRECONDITION: no dead particles may exist in the pool. Make sure to call {@link ParticlePool#compact} before sorting
     * @private
     * @param {Camera} camera THREE.js camera object
     */
    sort(camera) {
        assert.notEqual(camera, undefined, 'camera is undefined');
        assert.notEqual(camera, null, 'camera is null');

        //sort particles by distance from camera to ensure proper rendering order
        const particles = this.particles;
        const particleCount = particles.size();

        //test pre-condition: NO DEAD PARTICLES IN THE POOL
        assert.notOk(this.particles.hasHoles(), 'Broken pre-condition: particle pool must not have holes. Make sure to call "compact" before sorting');

        //get font plane of camera
        frustumFromCamera(camera, frustum);
        const nearPlane = frustum.planes[0];
        const nearPlaneNormal = nearPlane.normal;

        const planeNormalX = nearPlaneNormal.x;
        const planeNormalY = nearPlaneNormal.y;
        const planeNormalZ = nearPlaneNormal.z;

        //Bind attribute array directly for faster access
        const positionAttribute = particles.attributes[PARTICLE_ATTRIBUTE_POSITION];
        const positionArray = positionAttribute.array;

        function distanceToCamera(index) {
            const address = index * 3;

            // extract position components of the particle
            const x = positionArray[address];
            const y = positionArray[address + 1];
            const z = positionArray[address + 2];

            // compute dot product
            const dot = x * planeNormalX + y * planeNormalY + z * planeNormalZ;

            // use dot product instead of the actual distance to save computation. Difference is going to be constant
            return dot;
        }

        if (particleCount <= 1) {
            //nothing to sort
            return;
        }

        //Stack-based implementation, avoiding recursion for performance improvement
        const stack = [0, particleCount - 1];

        let stackPointer = 2;
        let i, j;

        while (stackPointer > 0) {
            stackPointer -= 2;

            const right = stack[stackPointer + 1];
            const left = stack[stackPointer];

            i = left;
            j = right;

            const pivotIndex = (left + right) >> 1;

            const pivot = distanceToCamera(pivotIndex);

            /* partition */
            while (i <= j) {
                while (distanceToCamera(i) > pivot)
                    i++;
                while (distanceToCamera(j) < pivot)
                    j--;
                if (i <= j) {

                    if (i !== j) {
                        //do swap
                        particles.swap(i, j);
                    }

                    i++;
                    j--;
                }
            }

            /* recursion */
            if (left < j) {
                stack[stackPointer++] = left;
                stack[stackPointer++] = j;
            }
            if (i < right) {
                stack[stackPointer++] = i;
                stack[stackPointer++] = right;
            }
        }
    }

    update() {
        this.particles.update();

        //check if sprites need updating
        if (this.getFlag(ParticleEmitterFlag.SpritesNeedUpdate)) {
            this.updateSprites();
        }
    }

    /**
     *
     * @param {number} timeDelta
     */
    advance(timeDelta) {
        let i;

        //retire dead particles
        const particles = this.particles;

        let liveParticleCount = particles.size();


        for (i = 0; i < liveParticleCount; i++) {

            const age = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_AGE);

            const deathAge = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_DEATH_AGE);

            const newAge = age + timeDelta;

            if (newAge >= deathAge) {
                //add to trash
                particles.remove(i);
                //we're done with this particle
                continue;
            }
            //make older
            particles.writeAttributeScalar(i, PARTICLE_ATTRIBUTE_AGE, newAge);

            //update rotation
            const rotationSpeed = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_ROTATION_SPEED);
            const oldRotation = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_ROTATION);

            particles.writeAttributeScalar(i, PARTICLE_ATTRIBUTE_ROTATION, oldRotation + rotationSpeed * timeDelta);

            //advance position based on velocity
            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, velocity);

            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_POSITION, position);

            position[0] += velocity[0] * timeDelta;
            position[1] += velocity[1] * timeDelta;
            position[2] += velocity[2] * timeDelta;

            particles.writeAttributeVector3(i, PARTICLE_ATTRIBUTE_POSITION, position[0], position[1], position[2]);
        }

        this.emit(timeDelta);

        //update trail bounding box
        this.movingBox.update(timeDelta);
    }

    /**
     * Write sprite UVs
     */
    updateSprites() {
        const particles = this.particles;

        const occupancy = particles.occupancy;

        const layers = this.layers;

        const numLayers = layers.length;

        let missingFlag = false;

        //cycle through each particle
        for (let i = occupancy.nextSetBit(0); i !== -1; i = occupancy.nextSetBit(i + 1)) {
            const layerPosition = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_LAYER_POSITION);

            const layerIndex = Math.round(layerPosition * numLayers);

            const layer = layers.get(layerIndex);

            const atlasPatch = layer.__atlasPatch;

            if (atlasPatch !== null) {
                const uv = atlasPatch.uv;

                const u0 = uv.position.x;
                const v0 = uv.position.y;
                const u1 = uv.size.x;
                const v1 = uv.size.y;

                particles.writeAttributeVector4(i, PARTICLE_ATTRIBUTE_UV, u0, v0, u1, v1);
            } else {
                missingFlag = true;
            }
        }

        this.writeFlag(ParticleEmitterFlag.SpritesNeedUpdate, missingFlag);
    }

    /**
     * @private
     * @param {int} layerIndex
     * @param {number} timeDelta period over which particles are being spawned, this will ensure that spawned particles have different initial age
     */
    spawnLayerParticlesContinuous(layerIndex, timeDelta) {
        assert.ok(layerIndex < this.layers.length && layerIndex >= 0, `layerIndex(=${layerIndex}) is out of bounds`);

        const layer = this.layers.get(layerIndex);

        const random = Math.random;

        /**
         *
         * @type {ParticlePool}
         */
        const particles = this.particles;


        const emissionFunction = computeEmissionFunction(layer.emissionFrom, layer.emissionShape);

        const emissionPeriod = 1 / layer.emissionRate;

        const layerPosition = layerIndex / this.layers.length;

        //compute transform matrix of the emitter
        composeMatrix4(matrix4, this.position, this.rotation, this.scale);

        let time = -layer.timeSinceLastEmission;

        while (time + emissionPeriod < timeDelta) {
            time += emissionPeriod;

            const ref = particles.create();

            // randomize position accross the supplied time interval
            const f = time / timeDelta;

            //compute position for particle
            emissionFunction(random, v3position);

            //apply layer transform
            v3position.multiply(layer.scale);
            v3position.add(layer.position);

            if (this.getFlag(ParticleEmitterFlag.PositionChanged)) {
                //compute position in between
                matrix4.elements[12] = lerp(this.position.x, this.__lastSpawnPosition.x, f);
                matrix4.elements[13] = lerp(this.position.y, this.__lastSpawnPosition.y, f);
                matrix4.elements[14] = lerp(this.position.z, this.__lastSpawnPosition.z, f);
            }

            //apply emitter transform
            v3position.applyMatrix4_three(matrix4);


            //randomize initial age across time delta
            const initialAge = f * timeDelta;

            //write age
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_AGE, initialAge);

            //write rotation
            const rotation = layer.particleRotation.sampleRandom(random);
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_ROTATION, rotation);

            //write rotation speed
            const rotationSpeed = layer.particleRotationSpeed.sampleRandom(random);
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_ROTATION_SPEED, rotationSpeed);

            //initialize velocity
            layer.particleVelocityDirection.sampleRandomDirection(random, v3velocity);
            const speed = layer.particleSpeed.sampleRandom(random);

            v3velocity.multiplyScalar(speed);

            particles.writeAttributeVector3(ref, PARTICLE_ATTRIBUTE_VELOCITY, v3velocity.x, v3velocity.y, v3velocity.z);

            //write position
            particles.writeAttributeVector3(ref, PARTICLE_ATTRIBUTE_POSITION,
                v3position.x + v3velocity.x * initialAge,
                v3position.y + v3velocity.y * initialAge,
                v3position.z + v3velocity.z * initialAge
            );

            //write death age
            const deathAge = layer.particleLife.sampleRandom(random);

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_DEATH_AGE, deathAge);

            //write particle size
            const size = layer.particleSize.sampleRandom(random);

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_SIZE, size);

            //write UV
            const atlasPatch = layer.__atlasPatch;
            if (atlasPatch !== null) {
                const uv = atlasPatch.uv;

                const u0 = uv.position.x;
                const v0 = uv.position.y;
                const u1 = uv.size.x;
                const v1 = uv.size.y;

                particles.writeAttributeVector4(ref, PARTICLE_ATTRIBUTE_UV, u0, v0, u1, v1);
            } else {
                this.setFlag(ParticleEmitterFlag.SpritesNeedUpdate);
            }

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_LAYER_POSITION, layerPosition);
        }

        //update time buffer
        layer.timeSinceLastEmission = timeDelta - time;
    }

    /**
     * @private
     * @param {int} layerIndex
     * @param {number} count how many particles to spawn
     */
    spawnLayerParticlesImmediate(layerIndex, count) {
        if (count <= 0) {
            return;
        }

        assert.ok(layerIndex < this.layers.length && layerIndex >= 0, `layerIndex(=${layerIndex}) is out of bounds`);

        const layer = this.layers.get(layerIndex);

        const random = Math.random;

        /**
         *
         * @type {ParticlePool}
         */
        const particles = this.particles;

        const v3position = new Vector3();
        const v3velocity = new Vector3();

        const emissionFunction = computeEmissionFunction(layer.emissionFrom, layer.emissionShape);

        const layerPosition = layerIndex / this.layers.length;

        //compute transform matrix of the emitter
        composeMatrix4(matrix4, this.position, this.rotation, this.scale);

        //pre-grow particle pool
        particles.growCapacity(particles.capacity + count);

        for (let j = 0; j < count; j++) {
            const ref = particles.create();

            //compute position for particle
            emissionFunction(random, v3position);

            //apply layer transform
            v3position.multiply(layer.scale);
            v3position.add(layer.position);

            //apply emitter transform
            v3position.applyMatrix4_three(matrix4);


            //randomize initial age across time delta
            const initialAge = 0;

            //write age
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_AGE, initialAge);

            //write rotation
            const rotation = layer.particleRotation.sampleRandom(random);
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_ROTATION, rotation);

            //write rotation speed
            const rotationSpeed = layer.particleRotationSpeed.sampleRandom(random);
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_ROTATION_SPEED, rotationSpeed);

            //initialize velocity
            layer.particleVelocityDirection.sampleRandomDirection(random, v3velocity);
            const speed = layer.particleSpeed.sampleRandom(random);

            v3velocity.multiplyScalar(speed);

            particles.writeAttributeVector3(ref, PARTICLE_ATTRIBUTE_VELOCITY, v3velocity.x, v3velocity.y, v3velocity.z);

            //write position
            particles.writeAttributeVector3(ref, PARTICLE_ATTRIBUTE_POSITION,
                v3position.x + v3velocity.x * initialAge,
                v3position.y + v3velocity.y * initialAge,
                v3position.z + v3velocity.z * initialAge
            );

            //write death age
            const deathAge = layer.particleLife.sampleRandom(random);

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_DEATH_AGE, deathAge);

            //write size
            const size = layer.particleSize.sampleRandom(random);

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_SIZE, size);

            //write UV
            const atlasPatch = layer.__atlasPatch;
            if (atlasPatch !== null) {
                const uv = atlasPatch.uv;

                const u0 = uv.position.x;
                const v0 = uv.position.y;
                const u1 = uv.size.x;
                const v1 = uv.size.y;

                particles.writeAttributeVector4(ref, PARTICLE_ATTRIBUTE_UV, u0, v0, u1, v1);
            } else {
                this.setFlag(ParticleEmitterFlag.SpritesNeedUpdate);
            }

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_LAYER_POSITION, layerPosition);

        }
    }

    /**
     * @private
     * @param {number} timeDelta
     */
    emit(timeDelta) {
        if (!this.getFlag(ParticleEmitterFlag.Emitting)) {
            return;
        }

        const layers = this.layers;
        const numLayers = layers.length;

        if (!this.position.equals(this.__lastSpawnPosition)) {
            this.setFlag(ParticleEmitterFlag.PositionChanged);
        }

        //emit new  particles
        for (let i = 0; i < numLayers; i++) {
            /**
             * @type {ParticleLayer}
             */
            const layer = layers.get(i);

            if (!layer.isEmitting) {
                //this layer is not spawning any particles, ignore it
                continue;
            }

            const averageLifetime = (layer.particleLife.max + layer.particleLife.min) / 2;

            //emitting more than averageLifetime lifetime is unproductive, so we'll crop the emission
            let emissionDelta;
            if (timeDelta > averageLifetime) {
                emissionDelta = averageLifetime;
                layer.timeSinceLastEmission = 0;
            } else {
                emissionDelta = timeDelta;
            }

            this.spawnLayerParticlesContinuous(i, emissionDelta);
        }

        if (this.getFlag(ParticleEmitterFlag.PositionChanged)) {
            this.__lastSpawnPosition.copy(this.position);
            this.clearFlag(ParticleEmitterFlag.PositionChanged);
        }
    }

    /**
     *
     * @param json
     * @returns {ParticleEmitter}
     */
    static fromJSON(json) {
        const result = new ParticleEmitter();
        result.fromJSON(json);
        return result
    }
}

ParticleEmitter.typeName = "ParticleEmitter";

ParticleEmitter.SERIALIZABLE_FLAGS = SERIALIZABLE_FLAGS;


const matrix4 = new Matrix4();

const v3 = new Vector3();

const defaultPointsMaterial = new PointsMaterial({ color: 0xFFFFFF });


//build particle spec
const particleSpecification = new ParticleSpecification();

particleSpecification.add(new ParticleAttribute('position', ParticleAttributeType.Vector3, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('age', ParticleAttributeType.Scalar, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('deathAge', ParticleAttributeType.Scalar, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('atlasPatch', ParticleAttributeType.Vector4, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('size', ParticleAttributeType.Scalar, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('layerPosition', ParticleAttributeType.Scalar, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('velocity', ParticleAttributeType.Vector3, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('rotation', ParticleAttributeType.Scalar, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('rotationSpeed', ParticleAttributeType.Scalar, ParticleDataType.Float32));


const frustum = new Frustum();

const velocity = [];
const position = [];

const v3position = new Vector3();
const v3velocity = new Vector3();
