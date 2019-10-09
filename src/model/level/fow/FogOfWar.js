import { Sampler2D } from "../../graphics/texture/sampler/Sampler2D.js";
import { ClampToEdgeWrapping, DataTexture, LinearFilter, LuminanceFormat, UnsignedByteType } from "three";
import Vector1 from "../../core/geom/Vector1.js";
import Vector2 from "../../core/geom/Vector2.js";
import Vector3 from "../../core/geom/Vector3.js";
import { assert } from "../../core/assert.js";
import { clamp, max2, min2 } from "../../core/math/MathUtils.js";
import { computeUnsignedDistanceField } from "../../graphics/texture/sampler/distanceField.js";
import Vector4 from "../../core/geom/Vector4.js";
import Signal from "../../core/events/signal/Signal.js";
import {
    deserializeRowFirstTable,
    RowFirstTable,
    serializeRowFirstTable
} from "../../core/collection/table/RowFirstTable.js";
import { RowFirstTableSpec } from "../../core/collection/table/RowFirstTableSpec.js";
import { DataType } from "../../core/collection/table/DataType.js";
import { writeSample2DDataToDataTexture } from "../../graphics/texture/sampler/writeSampler2DDataToDataTexture.js";
import { BinaryClassSerializationAdapter } from "../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

const samplePosition = [];

const corners2d = new Float64Array(8);

/**
 * Measured in Uint8 channel value per second.
 * @example 255 would mean complete fade happens in 1s, 25.5 would mean fade happens over 10 seconds
 * @readonly
 * @type {number}
 */
const FADE_SPEED = 255;

/**
 * pre-fade to enable correct distance field calculation
 * @readonly
 * @type {number}
 */
const INITIAL_FADE_VALUE = 254;

/**
 *
 * @type {RowFirstTableSpec}
 */
const revealMaskTableSpec = new RowFirstTableSpec([
    DataType.Int32, // Index
    DataType.Float32, // Precise current value
    DataType.Float32 // Fade speed
]);

const fadeRow = [];

export class FogOfWar {
    constructor() {
        /**
         *
         * @type {boolean}
         */
        this.textureNeedsUpdate = false;
        /**
         *
         * @type {boolean}
         */
        this.distanceFieldNeedsUpdate = false;

        /**
         *
         * @type {Sampler2D}
         */
        this.sampler = null;
        /**
         *
         * @type {Sampler2D}
         */
        this.distanceSampler = null;

        /**
         *
         * @type {DataTexture|null}
         */
        this.texture = null;

        this.scale = new Vector1(1);

        this.height = new Vector1(0);

        /**
         * Size of the fog area
         * @type {Vector2}
         */
        this.size = new Vector2(0, 0);

        this.color = new Vector4(0.1, 0.1, 0.1, 1);

        /**
         * Contains indices of pixes that are currently being updated
         * @type {RowFirstTable}
         */
        this.fadeMask = new RowFirstTable(revealMaskTableSpec);

        this.on = {
            textureChanged: new Signal()
        };

        this.initialize();
    }

    /**
     *
     * @param {number} timeDelta
     */
    updateFade(timeDelta) {
        const samplerData = this.sampler.data;

        const fadeMask = this.fadeMask;

        let numRows = fadeMask.length;

        let i = 0;

        for (; i < numRows; i++) {
            //read row
            fadeMask.getRow(i, fadeRow);

            //decode row
            const index = fadeRow[0];
            const oldValue = fadeRow[1];
            const speed = fadeRow[2];

            //compute new value
            const value = oldValue + (speed * timeDelta);

            let writeValue = value | 0;

            //write new value
            fadeMask.writeCellValue(i, 1, value);

            if (value <= 0) {
                if (speed < 0) {
                    //we were going down and reached the end, clear row
                    fadeMask.removeRows(i, 1);
                    i--;
                    numRows--;
                }
                writeValue = 0;
            } else if (value >= 255) {
                writeValue = 255;

                if (speed > 0) {
                    //we were going down and reached the end, clear row
                    fadeMask.removeRows(i, 1);
                    i--;
                    numRows--;
                }
            }

            if ((oldValue | 0) !== writeValue) {
                //value has changed
                samplerData[index] = writeValue;
                this.textureNeedsUpdate = true;
            }
        }
    }

    initialize() {
        this.sampler = new Sampler2D(new Uint8Array(0), 1, 0, 0);
        this.distanceSampler = new Sampler2D(new Uint8Array(0), 1, 0, 0);

        this.textureNeedsUpdate = true;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     */
    revealPoint(x, y) {
        const fadeMask = this.fadeMask;

        const sampler = this.sampler;

        const samplerData = sampler.data;

        const samplerWidth = sampler.width;

        const index = (y + 1) * samplerWidth + (x + 1);

        if (samplerData[index] === 255) {
            samplerData[index] = INITIAL_FADE_VALUE;

            //add record to fade mask
            fadeRow[0] = index;
            fadeRow[1] = INITIAL_FADE_VALUE;
            fadeRow[2] = -FADE_SPEED;

            fadeMask.addRow(fadeRow);

            this.distanceFieldNeedsUpdate = true;
        }
    }

    clear() {
        this.fadeMask.clear();

        this.sampler.data.fill(255);

        this.distanceFieldNeedsUpdate = true;
        this.textureNeedsUpdate = true;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     */
    reveal(x, y, radius) {

        const sampler = this.sampler;
        const samplerWidth = sampler.width;

        const lastPixelY = sampler.height - 1;
        const lastPixelX = samplerWidth - 1;

        let changeFlag = false;
        const samplerData = sampler.data;

        const fadeMask = this.fadeMask;

        sampler.traverseCircle(x + 1, y + 1, radius, function (x, y, sampler) {

            if (x <= 0 || x >= lastPixelX || y <= 0 || y >= lastPixelY) {
                //edges are reserved to preserve cover outside of the working area
                return;
            }

            const index = y * samplerWidth + x;

            if (samplerData[index] === 255) {
                samplerData[index] = INITIAL_FADE_VALUE;

                //add record to fade mask
                fadeRow[0] = index;
                fadeRow[1] = INITIAL_FADE_VALUE;
                fadeRow[2] = -FADE_SPEED;

                fadeMask.addRow(fadeRow);

                changeFlag = true;
            }

        });

        if (changeFlag) {

            this.rebuildDistanceField();


        }
    }

    dispose() {
        if (this.texture !== null) {
            this.texture.dispose();
        }
    }

    updateTexture() {
        const s = this.sampler;

        /**
         *
         * @type {Uint8Array}
         */
        const data = s.data;

        if (this.texture === null) {

            const texture = new DataTexture(data, s.width, s.height, LuminanceFormat, UnsignedByteType);

            texture.flipY = false;
            texture.wrapS = ClampToEdgeWrapping;
            texture.wrapT = ClampToEdgeWrapping;

            texture.generateMipmaps = false;

            texture.magFilter = LinearFilter;
            texture.minFilter = LinearFilter;

            texture.needsUpdate = true;

            this.texture = texture;

        } else {

            writeSample2DDataToDataTexture(s, this.texture);

        }


        this.on.textureChanged.dispatch();

        //clear flag
        this.textureNeedsUpdate = false;
    }

    /**
     *
     * @param {number} timeDelta
     */
    update(timeDelta) {
        this.updateFade(timeDelta);

        if (this.textureNeedsUpdate) {
            this.updateTexture();
        }

        if (this.distanceFieldNeedsUpdate) {
            this.rebuildDistanceField();
        }
    }

    /**
     * Compute bounding box of revealed area in grid space, where coordinate system maps to discrete texels of the fog
     * @param {AABB2} result
     */
    computeRevealedGridBoundingRectangle(result) {
        const sampler = this.sampler;
        const data = sampler.data;

        const l = data.length;

        const width = sampler.width;

        let i = 0;

        let x0 = width - 1, y0 = sampler.height - 1, x1 = 0, y1 = 0;

        let x, y;

        for (; i < l; i++) {
            const value = data[i];

            if (value !== 255) {
                //revealed
                x = i % width;
                y = Math.floor(i / width);

                x0 = min2(x, x0);
                y0 = min2(y, y0);

                x1 = max2(x, x1);
                y1 = max2(y, y1);
            }
        }

        result.set(x0, y0, x1, y1);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number[]} result
     */
    worldToSamplePosition(x, y, result) {
        const scale = this.scale.getValue();

        const size = this.size;

        const sizeX = size.x;
        const sizeY = size.y;

        const scaleX = (sizeX - 1) / (scale * sizeX);
        const scaleY = (sizeY - 1) / (scale * sizeY);

        result[0] = x * scaleX + 1;
        result[1] = y * scaleY + 1;
    }

    /**
     *
     * @param {AABB3} aabb
     * @param {Vector3} cameraFocalPoint
     * @param {number} clearance distance to nearest non-occluding cell
     */
    computeAABBVisibility(aabb, cameraFocalPoint, clearance) {
        assert.typeOf(clearance, 'number', 'clearance');

        let sx0 = this.size.x - 1;
        let sy0 = this.size.y - 1;
        let sx1 = 0;
        let sy1 = 0;

        let i;

        //cast ray from object's position along inverted view plane normal
        corners2d[0] = aabb.x0;
        corners2d[1] = aabb.z0;

        corners2d[2] = aabb.x0;
        corners2d[3] = aabb.z1;

        corners2d[4] = aabb.x1;
        corners2d[5] = aabb.z0;

        corners2d[6] = aabb.x1;
        corners2d[7] = aabb.z1;

        const distanceSampler = this.distanceSampler;

        //check corners, this is fast compared to checking each cell of fog overlapping bounding box
        for (i = 0; i < 8; i += 2) {

            const x = corners2d[i];
            const z = corners2d[i + 1];

            //scale down position to obtain sample position
            this.worldToSamplePosition(x, z, samplePosition);
            const sampleX = samplePosition[0];
            const sampleY = samplePosition[1];

            const sX = clamp(sampleX, 0, this.size.x - 1);
            const sY = clamp(sampleY, 0, this.size.y - 1);

            const distance = distanceSampler.getNearest(sX, sY);

            //Check if cell is visible
            if (distance <= clearance) {
                //if fog is not 100% opaque - return as visible
                return true;
            }

            sx0 = min2(sx0, sX);
            sy0 = min2(sy0, sY);

            sx1 = max2(sx1, sX);
            sy1 = max2(sy1, sY);
        }

        sx0 = Math.floor(sx0);
        sy0 = Math.floor(sy0);
        sx1 = Math.ceil(sx1);
        sy1 = Math.ceil(sy1);

        const shExtX = Math.ceil((sx1 - sx0) / 2);
        const shExtY = Math.ceil((sy1 - sy0) / 2);

        const sMidX = sx0 + shExtX;
        const sMidY = sy0 + shExtY;

        const centerOcclusionDistance = distanceSampler.getNearest(sMidX, sMidY);

        const maxDistanceFromCenter = max2(shExtX, shExtY);

        const distanceToNearestClearance = centerOcclusionDistance - maxDistanceFromCenter;

        if (distanceToNearestClearance > clearance) {
            //distance from center of the rectangle to nearest non-occluded region is too great,  treat as fully occluded
            return false;
        } else {
            return true;
        }
    }

    /**
     * Returns fog clearance from a set of world coordinates
     * @param {number} x world X coordinate
     * @param {number} y world Y coordinate
     * @returns {number} clearance value
     */
    getWorldClearance(x, y) {
        this.worldToSamplePosition(x, y, samplePosition);

        const sampleX = samplePosition[0];
        const sampleY = samplePosition[1];

        return this.distanceSampler.getNearest(sampleX, sampleY);
    }

    rebuildDistanceField() {
        console.time('computeSignedDistanceField');
        computeUnsignedDistanceField(this.sampler, this.distanceSampler, 255);
        console.timeEnd('computeSignedDistanceField');
        this.distanceFieldNeedsUpdate = false;
    }

    rebuildDistanceSampler() {
        const array = new Uint8Array(this.sampler.width * this.sampler.height);
        array.fill(0);

        this.distanceSampler.data = array;
        this.distanceSampler.width = this.sampler.width;
        this.distanceSampler.height = this.sampler.height;

        this.distanceSampler.initialize();

        this.rebuildDistanceField();
    }

    rebuildSampler() {

        //resize the sampler
        const samplerHeight = this.size.x + 2;
        const samplerWidth = this.size.y + 2;
        const uint8Array = new Uint8Array(samplerWidth * samplerHeight);

        uint8Array.fill(255);

        const sampler = new Sampler2D(uint8Array, 1, samplerWidth, samplerHeight);

        sampler.copy(this.sampler, 0, 0, 0, 0, this.sampler.width, this.sampler.height);

        //rewrite sampler
        this.sampler.data = sampler.data;
        this.sampler.width = sampler.width;
        this.sampler.height = sampler.height;

        this.sampler.initialize();

        //rebuild distance sampler
        this.rebuildDistanceSampler();


        //Mark texture for update
        this.textureNeedsUpdate = true;

    }


    /**
     *
     * @param {number} w
     * @param {number} h
     * @param scale
     */
    resize(w, h, scale) {
        this.size.set(w, h);
        this.scale.set(scale);

        //TODO update fade mask as necessary

        this.rebuildSampler();
    }
}

FogOfWar.typeName = 'FogOfWar';


export class FogOfWarSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = FogOfWar;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {FogOfWar} value
     */
    serialize(buffer, value) {
        value.scale.toBinaryBuffer(buffer);

        value.height.toBinaryBuffer(buffer);

        value.size.toBinaryBuffer(buffer);

        value.sampler.toBinaryBuffer(buffer);

        //serialize reveal state
        serializeRowFirstTable(buffer, value.fadeMask);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {FogOfWar} value
     */
    deserialize(buffer, value) {
        value.scale.fromBinaryBuffer(buffer);

        value.height.fromBinaryBuffer(buffer);

        value.size.fromBinaryBuffer(buffer);

        value.sampler.fromBinaryBuffer(buffer);

        //deserialize reveal state
        deserializeRowFirstTable(buffer, value.fadeMask);

        //
        value.textureNeedsUpdate = true;
        value.rebuildDistanceSampler();
    }
}
