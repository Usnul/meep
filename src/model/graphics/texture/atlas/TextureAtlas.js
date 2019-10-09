import { MaxRectanglesPacker } from "../../../core/geom/packing/MaxRectangles";
import { Sampler2D } from "../sampler/Sampler2D";
import IdPool from "../../../core/IdPool";
import Vector2 from "../../../core/geom/Vector2";
import { AtlasPatch } from "./AtlasPatch.js";
import { AtlasPatchFlag } from "./AtlasPatchFlag.js";
import Signal from "../../../core/events/signal/Signal.js";
import { max2, min2 } from "../../../core/math/MathUtils.js";
import { assert } from "../../../core/assert.js";

export class TextureAtlas {
    /**
     *
     * @param {number} [size]
     * @constructor
     */
    constructor(size = 16) {
        /**
         *
         * @type {IdPool}
         * @private
         */
        this.idPool = new IdPool();

        /**
         * @private
         * @type {AtlasPatch[]}
         */
        this.patches = [];

        /**
         * @readonly
         * @type {Vector2}
         */
        this.size = new Vector2(size, size);

        /**
         * @readonly
         * @type {Sampler2D}
         */
        this.sampler = Sampler2D.uint8(4, size, size);


        /**
         * @private
         * @type {MaxRectanglesPacker}
         */
        this.packer = new MaxRectanglesPacker(size, size);

        this.on = {
            painted: new Signal()
        };

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__needsUpdate = false;
    }

    /**
     * Whether or not current state of atlas requires calling {#update}
     * @returns {boolean}
     */
    needsUpdate() {
        return this.__needsUpdate;
    }

    /**
     *
     * @param {AtlasPatch} patch
     * @returns {boolean}
     */
    contains(patch) {
        assert.notEqual(patch, null, 'patch is null');
        assert.notEqual(patch, undefined, 'patch is undefined');
        assert.ok(patch.isAtlasPatch, 'patch argument is not an AtlasPatch');

        return this.patches.includes(patch);
    }

    /**
     * Clear canvas and update patch flags
     */
    erase() {
        //clear all painted patches

        const patches = this.patches;

        const l = patches.length;

        for (let i = 0; i < l; i++) {
            const atlasPatch = patches[i];

            atlasPatch.clearFlag(AtlasPatchFlag.Painted);
        }


        //erase data
        this.sampler.data.fill(0);

        this.__needsUpdate = true;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    resize(x, y) {
        //check if any patches would be cut
        const patches = this.patches;
        const numPatches = patches.length;
        const patchBoundsViolated = patches.some(patch => {

            if (!patch.getFlag(AtlasPatchFlag.Packed)) {
                //only care about packed patches
                return false;
            }

            const x1 = patch.position.x + patch.size.x + patch.padding;
            const y1 = patch.position.y + patch.size.y + patch.padding;

            return x1 >= x || y1 >= y;
        });

        if (patchBoundsViolated) {
            //Resizing atlas would result in some patches not fitting
            return false;
        }

        //update patch UVs
        for (let i = 0; i < numPatches; i++) {
            const patch = patches[i];

            if (patch.getFlag(AtlasPatchFlag.Packed)) {
                patch.updateUV(x, y);
            }
        }

        this.size.set(x, y);
        this.packer.resize(x, y);
        this.sampler.resize(x, y);

        return true;
    }

    /**
     *
     * @param {AtlasPatch} patch
     * @private
     */
    paintPatch(patch) {
        // console.time('TextureAtlas.paintPatch');

        const target = this.sampler;

        const source = patch.sampler;

        const patchPosition = patch.position;
        const patchSize = patch.size;

        target.copy_sameItemSize(
            source,
            0, 0,
            patchPosition.x, patchPosition.y, patchSize.x, patchSize.y
        );

        patch.setFlag(AtlasPatchFlag.Painted);

        // console.timeEnd('TextureAtlas.paintPatch');
    }

    /**
     *
     * @param {AtlasPatch} patch
     * @private
     */
    erasePatch(patch) {
        //erase the patch
        const packing = patch.packing;

        const x0 = packing.x0;
        const y0 = packing.y0;
        const x1 = packing.x1;
        const y1 = packing.y1;

        this.eraseArea(x0, y0, x1, y1);


        patch.clearFlag(AtlasPatchFlag.Painted);
    }

    /**
     * @private
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     */
    eraseArea(x0, y0, x1, y1) {
        const sampler = this.sampler;

        sampler.zeroFill(x0, y0, x1, y1);
    }

    /**
     *
     * @param {Sampler2D} sampler
     * @param {number} padding
     * @return {AtlasPatch}
     */
    add(sampler, padding = 4) {

        const patch = new AtlasPatch();

        patch.id = this.idPool.get();
        patch.sampler = sampler;
        patch.size.set(sampler.width, sampler.height);
        patch.padding = padding;

        const padding2 = padding * 2;

        patch.packing.set(0, 0, sampler.width + padding2, sampler.height + padding2);

        this.patches.push(patch);


        this.__needsUpdate = true;

        return patch;
    }

    /**
     *
     * @param {AtlasPatch} patch
     * @return {boolean}
     */
    remove(patch) {
        const patchIndex = this.patches.indexOf(patch);

        if (patchIndex === -1) {
            //not on the atlas, do nothing
            return false;
        }

        this.patches.splice(patchIndex, 1);
        this.idPool.release(patch.id);

        if (patch.getFlag(AtlasPatchFlag.Packed)) {
            this.packer.remove(patch.packing);
        }

        if (patch.getFlag(AtlasPatchFlag.Painted)) {
            //erase the patch
            this.erasePatch(patch);
        }

        return true;
    }

    /**
     * Re-packs all patches, this is useful for reclaiming fragmented space after extended usage
     * @returns {boolean}
     */
    repack() {
        const patches = this.patches;

        const numPatches = patches.length;

        for (let i = 0; i < numPatches; i++) {
            const patch = patches[i];

            if (patch.getFlag(AtlasPatchFlag.Packed)) {
                patch.clearFlag(AtlasPatchFlag.Packed | AtlasPatchFlag.Packed);

                this.packer.remove(patch.packing);
            }
        }

        this.pack();

        this.__needsUpdate = true;
    }

    /**
     * Pack any patches that are not packed yet
     * @private
     * @returns {boolean}
     */
    pack() {
        const patches = this.patches;

        const numPatches = patches.length;
        let i, l;

        const additions = [];

        for (i = 0; i < numPatches; i++) {
            const patch = patches[i];

            if (!patch.getFlag(AtlasPatchFlag.Packed)) {
                additions.push(patch.packing);
            }
        }

        //perform additions
        if (additions.length <= 0) {
            //nothing to pack
            return true;
        }

        //add all at once, this allows packer to optimize order internally to achieve better results
        if (this.packer.addMany(additions)) {
            //all packed, we're done
        } else {

            //packing failed, lets try a fresh re-pack
            const repacker = new MaxRectanglesPacker(this.size.x, this.size.y);

            // Clone existing placements to make sure our attempt can be reverted
            const originalPlacements = this.packer.boxes.map(b => b.clone());

            // Add packed boxes
            Array.prototype.push.apply(additions, this.packer.boxes);

            const repackSuccessful = repacker.addMany(additions);

            if (!repackSuccessful) {
                // repack failed

                for (i = 0, l = originalPlacements.length; i < l; i++) {
                    const originalPlacement = originalPlacements[i];

                    const box = this.packer.boxes[i];

                    //restore packing
                    box.copy(originalPlacement);
                }

                return false;
            }

            //repack succeeded, actualize placements
            for (i = 0, l = originalPlacements.length; i < l; i++) {
                const source = this.packer.boxes[i];

                const originalPlacement = originalPlacements[i];


                if (source.equals(originalPlacement)) {
                    //same position retained
                    // console.log("patch retained");
                } else {
                    //find patch

                    const atlasPatch = this.patches.find(p => p.packing === source);

                    assert.notEqual(atlasPatch, undefined);

                    //clear our original patch area
                    this.eraseArea(originalPlacement.x0, originalPlacement.y0, originalPlacement.x1, originalPlacement.y1);

                    //mark patch for re-paint
                    atlasPatch.clearFlag(AtlasPatchFlag.Painted);

                    // console.log("patch erased");
                }

                //replace packing
            }


            //mark all patches for a repaint
            // this.erase();

            //replace packer with the new one
            this.packer = repacker;
        }

        for (i = 0; i < numPatches; i++) {
            const patch = patches[i];

            //mark patch as packed
            patch.setFlag(AtlasPatchFlag.Packed);

            patch.updatePositionFromPacking(this.size.x, this.size.y);
        }


        return true;
    }

    /**
     * @private
     */
    paint() {
        // console.time('TextureAtlas.paint');
        const patches = this.patches;

        const l = patches.length;

        let paintCount = 0;

        for (let i = 0; i < l; i++) {
            const patch = patches[i];

            if (!patch.getFlag(AtlasPatchFlag.Painted)) {
                this.paintPatch(patch);

                paintCount++;
            }
        }

        // console.timeEnd('TextureAtlas.paint');

        if (paintCount > 0) {
            //notify that atlas was painted
            this.on.painted.dispatch();
        }
    }

    /**
     *
     */
    update() {
        if (!this.__needsUpdate) {
            //no update required
            return;
        }

        // console.group("TextureAtlas.update");
        // console.time('TextureAtlas.update');

        const maxPower = 12; //4096

        const initialPower = Math.floor(
            max2(
                0,
                Math.log2(
                    min2(this.size.x, this.size.y)
                )
            )
        );

        let power = initialPower;

        while (!this.pack()) {
            //packing failed, grow canvas

            while (true) {
                power++;

                if (power > maxPower) {
                    throw new Error(`Packing failed, could not pack ${this.patches.length} into ${Math.pow(2, maxPower)} resolution texture. Initial power: ${initialPower}`);
                }

                const size = Math.pow(2, power);

                if (this.resize(size, size)) {
                    break;
                }
            }
        }

        this.paint();

        this.__needsUpdate = false;

        // console.timeEnd('TextureAtlas.update');
        // console.groupEnd("TextureAtlas.update");

    }

    /**
     * Drops all the data
     */
    reset() {
        this.sampler.data.fill(0);

        this.patches = [];

        this.packer.clear();

        this.idPool.reset();
    }
}
