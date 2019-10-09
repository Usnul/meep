import Vector3 from "../../core/geom/Vector3.js";

import SimplexNoise from 'simplex-noise';
import { clamp, makeCubicCurve, seededRandom } from "../../core/math/MathUtils.js";
import { Behavior } from "../../engine/intelligence/behavior/Behavior.js";
import { BehaviorStatus } from "../../engine/intelligence/behavior/BehaviorStatus.js";
import Quaternion from "../../core/geom/Quaternion.js";

export class CameraShakeTraumaBehavior extends Behavior {

    /**
     *
     * @param {CameraShakeBehavior} shakeBehavior
     * @param {number} decay amount by which trauma decays per second
     */
    constructor({
                    shakeBehavior,
                    decay = 1,
                }) {
        super();


        this.decay = decay;
        this.trauma = 0;

        this.shakeBehavior = shakeBehavior;

        this.formula = makeCubicCurve(0, 0.1, 0.1, 1);
    }

    tick(timeDelta) {
        const shake = this.formula(clamp(this.trauma, 0, 1));

        this.trauma = clamp(this.trauma - timeDelta * this.decay, 0, 1);


        this.shakeBehavior.strength = shake;

        return BehaviorStatus.Running;
    }
}

export class CameraShakeBehavior extends Behavior {
    /**
     *
     * @param {number} maxPitch
     * @param {number} maxYaw
     * @param {number} maxRoll
     * @param {number} maxOffsetX
     * @param {number} maxOffsetY
     * @param {number} maxOffsetZ
     * @param {number} strength
     * @param {TopDownCameraController} controller
     */
    constructor(
        {
            maxPitch = 0,
            maxYaw = 0,
            maxRoll = 0,
            maxOffsetX = 0,
            maxOffsetY = 0,
            maxOffsetZ = 0,
            strength = 0,

            controller
        }
    ) {
        super();

        /**
         *
         * @type {TopDownCameraController}
         */
        this.controller = controller;

        this.time = 0;

        this.timeScale = 1;

        this.strength = strength;

        this.shake = new CameraShake();

        this.shake.limitsRotation.set(maxPitch, maxYaw, maxRoll);
        this.shake.limitsOffset.set(maxOffsetX, maxOffsetY, maxOffsetZ);

        this.__target = new Vector3();
        this.__rotation = new Vector3();
    }

    initialize() {
        super.initialize();

        //remember controller transform
        this.__rotation.set(this.controller.pitch, this.controller.yaw, this.controller.roll);
        this.__target.copy(this.controller.target);
    }

    tick(timeDelta) {
        this.time += timeDelta * this.timeScale;

        const offset = new Vector3();
        const rotation = new Vector3();

        //read out shake values
        this.shake.read(this.strength, this.time, offset, rotation);

        const q = new Quaternion();

        q.fromEulerAngles(this.__rotation.x, this.__rotation.y, this.__rotation.z);

        offset.applyQuaternion(q);

        //update controller
        this.controller.target.set(
            this.__target.x + offset.x,
            this.__target.y + offset.y,
            this.__target.z + offset.z,
        );

        this.controller.pitch = this.__rotation.x + rotation.x;
        this.controller.yaw = this.__rotation.y + rotation.y;
        this.controller.roll = this.__rotation.z + rotation.z;

        return BehaviorStatus.Running;
    }
}

/**
 * Based on a 2016 GDC talk by Squirrel Eiserloh "Math for Game Programmers: Juicing Your Cameras With Math"
 */
export class CameraShake {
    constructor() {


        this.time = 0;

        /**
         * Shake rotational limits, yaw, pitch and roll
         * @type {Vector3}
         */
        this.limitsRotation = new Vector3();

        /**
         * Shake offset limits
         * @type {Vector3}
         */
        this.limitsOffset = new Vector3();


        const r = seededRandom(1);

        this.noiseRotataion = new SimplexNoise(r);
        this.noiseOffset = new SimplexNoise(r);

    }

    /**
     *
     * @param {number} value between 0 and 1
     * @param {number} time
     * @param {Vector3} offset
     * @param {Vector3} rotation
     */
    read(value, time, offset, rotation) {

        const t = time;

        const nR = this.noiseRotataion;

        rotation.set(
            this.limitsRotation.x * value * (nR.noise2D(t, 1) * 2 - 1),
            this.limitsRotation.y * value * (nR.noise2D(t, 2) * 2 - 1),
            this.limitsRotation.z * value * (nR.noise2D(t, 3) * 2 - 1),
        );

        const nO = this.noiseOffset;

        offset.set(
            this.limitsOffset.x * value * (nO.noise2D(t, 1) * 2 - 1),
            this.limitsOffset.y * value * (nO.noise2D(t, 2) * 2 - 1),
            this.limitsOffset.z * value * (nO.noise2D(t, 3) * 2 - 1)
        );
    }


}
