import List from "../../../../core/collection/List.js";

class InputBinding {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.path = "";
        /**
         *
         * @type {string}
         */
        this.event = "";
    }

    /**
     *
     * @param {string} path
     * @param {string} event
     */
    set(path, event) {
        this.path = path;
        this.event = event;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        buffer.writeUTF8String(this.path);
        buffer.writeUTF8String(this.event);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        this.path = buffer.readUTF8String();
        this.event = buffer.readUTF8String();
    }
}

export class Input {
    constructor() {
        /**
         *
         * @type {List<InputBinding>}
         */
        this.bindings = new List();
    }

    /**
     *
     * @param {string} path
     * @param {string} event
     * @returns {boolean}
     */
    exists(path, event) {
        return this.bindings.some(b => b.path === path && b.event === event);
    }

    /**
     *
     * @param {string} path
     * @param {string} event
     * @returns {boolean}
     */
    bind(path, event) {
        if (this.exists(path, event)) {
            //binding exists
            return false;
        }

        const binding = new InputBinding();

        binding.set(path, event);

        this.bindings.add(binding);

        return true;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        this.bindings.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        this.bindings.fromBinaryBuffer(buffer, InputBinding);
    }
}

/**
 * @readonly
 * @type {string}
 */
Input.typeName = "Input";

/**
 * @readonly
 * @type {boolean}
 * TODO make serializable when the rest of the engine is ready for it
 */
Input.serializable = false;
