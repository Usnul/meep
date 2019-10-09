/**
 * Created by Alex on 04/05/2016.
 */


import Vector2 from '../../core/geom/Vector2';
import { RepeatWrapping, TextureLoader } from "three";

function loadCloudTexture(url) {

    const textureLoader = new TextureLoader();
    const t = textureLoader.load(url);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(1, 1);
    return t;
}


class Clouds {
    constructor() {
        /**
         *
         * @type {boolean}
         * @private
         */
        this.__enabled = false;
        /**
         *
         * @type {Array}
         * @private
         */
        this.materials = [];
        this.time = 0;


        this.__speed0 = new Vector2();
        this.__speed1 = new Vector2();
        this.__speed2 = new Vector2();

        //how fast clouds reform
        this.variability = 0.37;

        this.setSpeed(0.5, -0.5);

    }

    /**
     *
     * @param {boolean} val
     */
    set enabled(val) {

        if (val === this.__enabled) {
            return;
        }
        this.__enabled = val;
        this.materials.forEach(this.writeOneEnabled.bind(this));
    }

    /**
     *
     * @returns {boolean}
     */
    get enabled() {
        return this.__enabled;
    }

    setSpeed(x, y) {
        const variability = this.variability;

        this.__speed0.set(x, y);
        this.__speed1.set(x * (1 - variability), y * (1 + variability));
        this.__speed2.set(x * (1 + variability), y * (1 - variability));
    }

    writeOneCloudSpeed(mat) {
        const uniforms = mat.uniforms;

        uniforms.v_CloudsSpeed_0.value.copy(this.__speed0);
        uniforms.v_CloudsSpeed_1.value.copy(this.__speed1);
        uniforms.v_CloudsSpeed_2.value.copy(this.__speed2);
    }

    writeOneEnabled(mat) {
        mat.defines.SHADOWMAP_CLOUDS = this.__enabled;
        mat.needsUpdate = true;
    }

    writeOneTime(mat) {
        const uniforms = mat.uniforms;
        uniforms.f_CloudsTime.value = this.time;
    }


    writeAllTime() {
        this.materials.forEach((m) => {
            this.writeOneTime(m);
        });
    }

    update(timeDelta) {
        this.time += timeDelta;
        this.writeAllTime();
    }

    writeOneCloudTextures(mat) {
        const uniforms = mat.uniforms;
        uniforms.t_Clouds_0.value = loadCloudTexture("data/textures/noise/tile_256.png");
        uniforms.t_Clouds_1.value = loadCloudTexture("data/textures/noise/tile_256.png");
        uniforms.t_Clouds_2.value = loadCloudTexture("data/textures/noise/tile_256.png");
    }

    writeOneCloudUniforms(mat) {

        const uniforms = mat.uniforms;
        uniforms.v_CloudsSize_0.value.set(161, 161);
        uniforms.v_CloudsSize_1.value.set(83, 83);
        uniforms.v_CloudsSize_2.value.set(23, 23);

        uniforms.f_CloudsAmount.value = 0.8;
        uniforms.f_CloudsIntensity.value = 0.2;

        this.writeOneCloudSpeed(mat);
    }

    addMaterial(material) {
        if (typeof material.defines === "object" && material.defines.hasOwnProperty("SHADOWMAP_CLOUDS")) {
            this.writeOneTime(material);
            this.writeOneEnabled(material);
            this.writeOneCloudTextures(material);
            this.writeOneCloudUniforms(material);

            this.materials.push(material);
        } else {
            console.warn("material doesn't support clouds, ignoring");
        }
    }
}


export default Clouds;