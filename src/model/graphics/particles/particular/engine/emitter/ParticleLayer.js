import Vector3 from "../../../../../core/geom/Vector3.js";
import { NumericInterval } from "../../../../../core/math/interval/NumericInterval.js";
import { ParameterTrackSet } from "../parameter/ParameterTrackSet.js";
import { AABB3 } from "../../../../../core/bvh2/AABB3.js";
import { ParticleParameters } from "./ParticleParameters.js";
import { computeHashFloat, computeHashIntegerArray } from "../../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../../core/strings/StringUtils.js";
import { ConicRay } from "../../../../../core/geom/ConicRay.js";
import { computeConeBoundingBox } from "../../../../../core/geom/3d/ConeMath.js";

/**
 * @readonly
 * @enum {number}
 */
const EmissionShapeType = {
    Sphere: 0,
    Box: 1,
    Point: 3
};

/**
 * @readonly
 * @enum {number}
 */
const EmissionFromType = {
    Shell: 0,
    Volume: 1
};


function ParticleLayer() {
    /**
     *
     * @type {String|null}
     */
    this.imageURL = null;

    /**
     * Patch of the image
     * @private
     * @type {AtlasPatch}
     */
    this.__atlasPatch = null;

    /**
     * Determines a range of particle life expectancy
     * @type {NumericInterval}
     */
    this.particleLife = new NumericInterval(1, 1);

    /**
     *
     * @type {NumericInterval}
     */
    this.particleSize = new NumericInterval(0.1, 0.2);

    /**
     *
     * @type {NumericInterval}
     */
    this.particleRotation = new NumericInterval(0, 0);

    /**
     * Rotation speed of individual particles in Rad/s
     * @type {NumericInterval}
     */
    this.particleRotationSpeed = new NumericInterval(0, 0);

    /**
     *
     * @type {EmissionShapeType|number}
     */
    this.emissionShape = EmissionShapeType.Point;

    /**
     *
     * @type {EmissionFromType|number}
     */
    this.emissionFrom = EmissionFromType.Volume;

    /**
     *
     * @type {number}
     */
    this.emissionRate = 1;
    /**
     * When layer is added - it will immediately emit this number of particles
     * @type {number}
     */
    this.emissionImmediate = 0;

    /**
     *
     * @type {ParameterTrackSet}
     */
    this.parameterTracks = new ParameterTrackSet();

    this.position = new Vector3(0, 0, 0);
    this.scale = new Vector3(1, 1, 1);

    /**
     *
     * @type {ConicRay}
     */
    this.particleVelocityDirection = new ConicRay();
    this.particleSpeed = new NumericInterval(0, 0);

    /**
     * Used to track how much time has past since a particle was last emitted
     * @type {number}
     */
    this.timeSinceLastEmission = 0;

    /**
     * Determines if the layer is spawning new particles or not
     * @type {boolean}
     */
    this.isEmitting = true;

    this.scaledSpriteHalfSize = -1;
    this.baseBoundingBox = new AABB3(0, 0, 0, 0, 0, 0);
}

ParticleLayer.prototype.computeBoundsAttributes = function () {
    this.scaledSpriteHalfSize = this.computeScaledSpriteHalfSize();
    this.computePointBoundingBox(this.baseBoundingBox);
};

/**
 *
 * @returns {number}
 */
ParticleLayer.prototype.computeScaledSpriteHalfSize = function () {

    //compute maximum particle size
    let maxParticleSize = this.particleSize.max;

    const scaleTrack = this.parameterTracks.getTrackByName(ParticleParameters.Scale);

    if (scaleTrack !== undefined) {
        //scale track is present, take it into account
        const lookupTable = scaleTrack.track;

        maxParticleSize = maxParticleSize * lookupTable.valueMax;
    }

    return maxParticleSize / 2;
};

const aabb3 = new AABB3(0, 0, 0, 0, 0, 0);

/**
 * Bounding box without taking sprite size into account
 * @param {AABB3} result
 */
ParticleLayer.prototype.computePointBoundingBox = function (result) {
    let x0, y0, z0, x1, y1, z1;


    //take velocity into account
    const maxDisplacement = this.particleSpeed.max * this.particleLife.max;


    const particleVelocityDirection = this.particleVelocityDirection;
    const direction = particleVelocityDirection.direction;

    //displace by current position
    const position = this.position;

    computeConeBoundingBox(aabb3, position.x, position.y, position.z, direction.x, direction.y, direction.z, particleVelocityDirection.angle, maxDisplacement);

    x0 = aabb3.x0;
    y0 = aabb3.y0;
    z0 = aabb3.z0;
    x1 = aabb3.x1;
    y1 = aabb3.y1;
    z1 = aabb3.z1;

    //scale the emitter layer
    const scale = this.scale;

    if (this.emissionShape !== EmissionShapeType.Point) {
        x0 -= 0.5 * scale.x;
        y0 -= 0.5 * scale.y;
        z0 -= 0.5 * scale.z;

        x1 += 0.5 * scale.x;
        y1 += 0.5 * scale.y;
        z1 += 0.5 * scale.z;
    }


    result.setBounds(x0, y0, z0, x1, y1, z1);
};

/**
 *
 * @param {AtlasPatch} patch
 */
ParticleLayer.prototype.setAtlasPatch = function (patch) {
    this.__atlasPatch = patch;
};

ParticleLayer.prototype.hash = function () {
    return computeHashIntegerArray(
        computeStringHash(this.imageURL),
        this.particleLife.hash(),
        this.particleSize.hash(),
        this.particleRotation.hash(),
        this.particleRotationSpeed.hash(),
        this.emissionShape,
        this.emissionFrom,
        computeHashFloat(this.emissionRate),
        this.emissionImmediate,
        this.parameterTracks.hash(),
        this.position.hash(),
        this.scale.hash(),
        this.particleVelocityDirection.hash(),
        this.particleSpeed.hash()
    );
};

/**
 *
 * @param {ParticleLayer} other
 * @returns {boolean}
 */
ParticleLayer.prototype.equals = function (other) {
    return this.imageURL === other.imageURL
        && this.particleLife.equals(other.particleLife)
        && this.particleSize.equals(other.particleSize)
        && this.particleRotation.equals(other.particleRotation)
        && this.particleRotationSpeed.equals(other.particleRotationSpeed)
        && this.emissionShape === other.emissionShape
        && this.emissionFrom === other.emissionFrom
        && this.emissionRate === other.emissionRate
        && this.emissionImmediate === other.emissionImmediate
        && this.parameterTracks.equals(other.parameterTracks)
        && this.position.equals(other.position)
        && this.scale.equals(other.scale)
        && this.particleVelocityDirection.equals(other.particleVelocityDirection)
        && this.particleSpeed.equals(other.particleSpeed);
};

ParticleLayer.prototype.toJSON = function () {
    return {
        imageURL: this.imageURL,
        particleLife: this.particleLife.toJSON(),
        particleSize: this.particleSize.toJSON(),
        particleRotation: this.particleRotation.toJSON(),
        particleRotationSpeed: this.particleRotationSpeed.toJSON(),
        emissionShape: this.emissionShape,
        emissionFrom: this.emissionFrom,
        emissionRate: this.emissionRate,
        emissionImmediate: this.emissionImmediate,
        parameterTracks: this.parameterTracks.toJSON(),
        position: this.position.toJSON(),
        scale: this.scale.toJSON(),
        particleVelocityDirection: this.particleVelocityDirection.toJSON(),
        particleSpeed: this.particleSpeed.toJSON()
    };
};

ParticleLayer.prototype.fromJSON = function (json) {
    this.imageURL = json.imageURL;
    this.particleLife.fromJSON(json.particleLife);
    this.particleSize.fromJSON(json.particleSize);
    this.particleRotation.fromJSON(json.particleRotation);
    this.particleRotationSpeed.fromJSON(json.particleRotationSpeed);
    this.emissionShape = json.emissionShape;
    this.emissionFrom = json.emissionFrom;

    if (typeof json.emissionRate === "number") {
        this.emissionRate = json.emissionRate;
    } else {
        this.emissionRate = 1;
    }

    if (typeof json.emissionImmediate === "number") {
        this.emissionImmediate = json.emissionImmediate;
    } else {
        this.emissionImmediate = 0;
    }

    if (json.parameterTracks !== undefined) {
        this.parameterTracks.fromJSON(json.parameterTracks);
    } else {
        this.parameterTracks.clear();
    }

    if (json.position !== undefined) {
        this.position.fromJSON(json.position);
    } else {
        this.position.set(0, 0, 0);
    }

    if (json.scale !== undefined) {
        this.scale.fromJSON(json.scale);
    } else {
        this.scale.set(1, 1, 1);
    }

    if (json.particleVelocityDirection !== undefined) {
        this.particleVelocityDirection.fromJSON(json.particleVelocityDirection);
    } else {
        this.particleVelocityDirection.angle = Math.PI;
        this.particleVelocityDirection.direction.set(0, 1, 0);
    }

    if (json.particleSpeed !== undefined) {
        this.particleSpeed.fromJSON(json.particleSpeed);
    } else {
        this.particleSpeed.set(0, 0);
    }

    //reset bounds attributes
    this.scaledSpriteHalfSize = -1;
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ParticleLayer.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeUTF8String(this.imageURL);
    this.particleLife.toBinaryBuffer(buffer);
    this.particleSize.toBinaryBuffer(buffer);
    this.particleRotation.toBinaryBuffer(buffer);
    this.particleRotationSpeed.toBinaryBuffer(buffer);
    buffer.writeUint8(this.emissionShape);
    buffer.writeUint8(this.emissionFrom);
    buffer.writeFloat64(this.emissionRate);
    buffer.writeUint32(this.emissionImmediate);
    this.parameterTracks.toBinaryBuffer(buffer);
    this.position.toBinaryBufferFloat32(buffer);
    this.scale.toBinaryBufferFloat32(buffer);
    this.particleVelocityDirection.toBinaryBuffer(buffer);
    this.particleSpeed.toBinaryBuffer(buffer);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ParticleLayer.prototype.fromBinaryBuffer = function (buffer) {
    this.imageURL = buffer.readUTF8String();
    this.particleLife.fromBinaryBuffer(buffer);
    this.particleSize.fromBinaryBuffer(buffer);
    this.particleRotation.fromBinaryBuffer(buffer);
    this.particleRotationSpeed.fromBinaryBuffer(buffer);
    this.emissionShape = buffer.readUint8();
    this.emissionFrom = buffer.readUint8();
    this.emissionRate = buffer.readFloat64();
    this.emissionImmediate = buffer.readUint32();
    this.parameterTracks.fromBinaryBuffer(buffer);
    this.position.fromBinaryBufferFloat32(buffer);
    this.scale.fromBinaryBufferFloat32(buffer);
    this.particleVelocityDirection.fromBinaryBuffer(buffer);
    this.particleSpeed.fromBinaryBuffer(buffer);

    //reset bounds attributes
    this.scaledSpriteHalfSize = -1;
};

export { ParticleLayer, EmissionShapeType, EmissionFromType };
