export class BinaryClassSerializationAdapter {
    constructor() {
        /**
         * @protected
         * @type {Class}
         */
        this.klass = null;

        /**
         * @protected
         * @type {number}
         */
        this.version = 0;
    }

    /**
     * @template T
     * @returns {Class<T>}
     */
    getClass() {
        return this.klass;
    }

    /**
     *
     * @returns {number}
     */
    getVersion() {
        return this.version;
    }

    initialize(...args) {
        //override as needed
    }

    /**
     * Handle any necessary resource cleanup.
     * Invoked externally as part of the serialization lifecycle
     */
    finalize() {
        //override as need
    }

    /**
     * @param {BinaryBuffer} buffer
     * @param value
     */
    serialize(buffer, value) {
        throw new Error('Not Implemented');
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param value
     */
    deserialize(buffer, value) {
        throw new Error('Not Implemented');
    }
}
