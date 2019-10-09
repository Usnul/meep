/**
 * Created by Alex on 17/10/2016.
 */


import Vector3 from '../../../core/geom/Vector3';

import { CatmullRomCurve3 } from 'three';
import { RingBuffer } from "../../../core/collection/RingBuffer.js";
import { clamp } from "../../../core/math/MathUtils.js";
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

class Path {
    constructor() {
        /**
         *
         * @type {Vector3[]}
         */
        this.points = [];
        /**
         *
         * @type {number}
         */
        this.markerOffset = 0;
        /**
         *
         * @type {number}
         */
        this.markerIndex = 0;
        /**
         *
         * @type {number}
         */
        this.markerDistanceToNext = 0;
    }

    reset() {
        this.markerOffset = 0;
        this.markerIndex = 0;
    }

    /**
     *
     * @returns {Vector3|undefined}
     */
    last() {
        return this.points[this.points.length - 1];
    }

    /**
     *
     * @param {number} distanceDelta
     */
    move(distanceDelta) {
        distanceDelta += this.markerOffset;
        this.markerOffset = 0;
        let marker = this.points[this.markerIndex];
        if (this.isComplete()) {
            return;
        }
        while (distanceDelta > 0) {
            const next = this.points[this.markerIndex + 1];
            const distance = marker.distanceTo(next);
            this.markerDistanceToNext = distance;
            if (distanceDelta < distance) {
                this.markerOffset = distanceDelta;
                return;
            } else {
                this.markerIndex++;
                distanceDelta -= distance;
            }
            marker = next;
            if (this.markerIndex >= this.points.length - 1) {
                //reached the end of the path
                this.markerOffset = 0;
                this.markerIndex = this.points.length - 1;
                break;
            }
        }
    }

    /**
     *
     * @returns {boolean}
     */
    isComplete() {
        return this.markerIndex >= this.points.length - 1;
    }

    /**
     *
     * @returns {Vector3|undefined}
     */
    getCurrentPosition() {
        const previousPoint = this.previousPoint();
        const nextPoint = this.nextPoint();
        if (nextPoint == null) {
            return previousPoint;
        }
        if (this.markerDistanceToNext === 0) {
            return previousPoint.clone();
        } else {
            const normalizedDistance = this.markerOffset / this.markerDistanceToNext;
            return previousPoint.clone().lerp(nextPoint, normalizedDistance);
        }
    }

    /**
     *
     * @returns {Vector3}
     */
    previousPoint() {
        return this.points[this.markerIndex];
    }

    /**
     *
     * @returns {Vector3}
     */
    nextPoint() {
        return this.points[this.markerIndex + 1];
    }

    toJSON() {
        return this.points.map(function (p) {
            return p.toJSON();
        });
    }

    fromJSON(json) {
        this.points = json.map(function (p) {
            const vector3 = new Vector3();
            vector3.fromJSON(p);
            return vector3;
        });
    }

    /**
     *
     * @param {Vector3[]} points
     * @param {number} samples
     * @returns {Vector3[]}
     */
    static smoothPath(points, samples) {

        const curve = new CatmullRomCurve3(points);
        const points2 = curve.getPoints(samples);

        //Convert to engine vector format
        const result = points2.map(function (p) {
            return new Vector3(p.x, p.y, p.z);
        });

        return result;
    }
}


Path.typeName = "Path";

export default Path;

/**
 *
 * @param {Vector3[]} points
 * @param {number} samples
 * @param {Vector3[]} result
 */
function smoothPathY(result, points, samples) {
    const buffer = new RingBuffer(samples);


    const l = points.length;

    let j = 0;
    let i = samples >> 1;


    //fill ahead
    for (j = 0; i < samples; i++, j++) {
        const pIndex = clamp(j, 0, l - 1);

        buffer.push(points[pIndex].y);
    }

    function getAverageWindowValue() {
        let result = 0;

        buffer.forEach(v => {
            result += v;
        });

        return result / buffer.count;
    }


    for (i = 0; i < l; i++, j++) {
        //compute smoothed value
        const v = points[i];
        const y = getAverageWindowValue();


        if (j < l) {
            //read sample into the window
            const sample = points[clamp(j, 0, l - 1)];

            const sampleY = sample.y;
            buffer.push(sampleY);

        } else {
            buffer.shift();
        }

        const out = result[i];
        out.set(v.x, y, v.z);

    }

    return result;
}


export class PathSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = Path;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Path} value
     */
    serialize(buffer, value) {

        const points = value.points;
        const numPoints = points.length;

        buffer.writeUint32(numPoints);

        for (let i = 0; i < numPoints; i++) {
            const point = points[i];
            point.toBinaryBuffer(buffer);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Path} value
     */
    deserialize(buffer, value) {

        const numPoints = buffer.readUint32();

        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const v = new Vector3();

            v.fromBinaryBuffer(buffer);

            points.push(v)
        }

        value.points = points;
    }
}
