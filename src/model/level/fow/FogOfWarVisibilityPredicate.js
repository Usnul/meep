import { FogOfWar } from "./FogOfWar.js";

export class FogOfWarVisibilityPredicate {
    constructor() {
        /**
         *
         * @type {FogOfWar}
         */
        this.fow = null;


        /**
         * Distance that the point is allowed to be away from the clear region to pass the test
         * @type {number}
         */
        this.maxClearance = 0;
    }

    /**
     *
     * @param {Camera} camera
     * @param {EntityComponentDataset} ecd
     */
    initialize(camera, ecd) {
        let fogOfWar = null;

        ecd.traverseComponents(FogOfWar, function (fow) {
            fogOfWar = fow;
            return false;
        });

        this.fow = fogOfWar;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {boolean}
     */
    test(x, y, z) {
        const fow = this.fow;

        if (fow !== null) {
            const clearance = fow.getWorldClearance(x, z);

            return clearance <= this.maxClearance;
        } else {
            return true;
        }
    }

    finalize() {

    }
}
