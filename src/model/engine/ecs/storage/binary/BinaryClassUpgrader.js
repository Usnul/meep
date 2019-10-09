export class BinaryClassUpgrader {
    constructor() {
        /**
         *
         * @type {number}
         * @protected
         */
        this.__startVersion = 0;
        /**
         *
         * @type {number}
         * @protected
         */
        this.__targetVersion = 0;
    }


    /**
     *
     * @returns {number}
     */
    getStartVersion() {
        return this.__startVersion;
    }

    /**
     *
     * @returns {number}
     */
    getTargetVersion() {
        return this.__targetVersion;
    }

    /**
     *
     * @param {BinaryBuffer} source
     * @param {BinaryBuffer} target
     */
    upgrade(source, target) {
        throw new Error('Not Implemented');
    }
}
