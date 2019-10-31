/**
 * Created by Alex on 23/04/2014.
 */


import { computeStringHash } from "../../../core/strings/StringUtils.js";
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";
import { BinaryClassUpgrader } from "../storage/binary/BinaryClassUpgrader.js";

export class Tag {
    /**
     *
     * @param {string} [name]
     * @constructor
     */
    constructor(name) {

        /**
         * @private
         * @type {String[]}
         */
        this.values = [];


        if (name !== undefined) {
            this.add(name);

            console.warn('constructor arguments are deprecated');
        }
    }

    /**
     *
     * @param {String} v
     */
    set name(v) {
        console.warn('name property is deprecated');

        this.clear();
        this.add(v);
    }

    /**
     *
     * @returns {String}
     */
    get name() {
        console.warn('name property is deprecated');

        return this.getFirst();
    }

    clear() {
        this.values.splice(0, this.values.length);
    }

    /**
     * Once the tag is added to the dataset it should be considered immutable, hence why this method is protected
     * @protected
     * @param {String} value
     * @returns {boolean}
     */
    add(value) {
        if (this.contains(value)) {
            return false;
        }

        this.values.push(value);

        return true;
    }

    /**
     *
     * @returns {String}
     */
    getFirst() {
        return this.values[0];
    }

    /**
     *
     * @param {String} value
     * @returns {boolean}
     */
    contains(value) {
        return this.values.indexOf(value) !== -1;
    }

    /**
     *
     * @param {String[]} values
     * @returns {boolean}
     */
    containsOneOf(values) {
        const s0 = this.values;
        const s1 = values;

        const n0 = s0.length;
        const n1 = s1.length;

        for (let i = 0; i < n0; i++) {
            const v0 = s0[i];

            for (let j = 0; j < n1; j++) {
                const v1 = s1[j];

                if (v0 === v1) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * NOTE: do not modify this value
     * @returns {string[]}
     */
    getValues() {
        return this.values;
    }

    /**
     *
     * @param {function(string)} visitor
     * @param {*} [thisArg]
     */
    traverse(visitor, thisArg) {
        this.values.forEach(visitor, thisArg);
    }

    /**
     *
     * @return {number}
     */
    hash() {
        let hash = 0;

        const values = this.values;

        const n = values.length;

        for (let i = 0; i < n; i++) {

            const value = values[i];

            hash = ((hash << 5) - hash) + computeStringHash(value);

            hash |= 0; // Convert to 32bit integer
        }

        return hash;
    }

    /**
     *
     * @param {Tag} other
     * @return {boolean}
     */
    equals(other) {

        const s0 = this.values;

        const s1 = other.values;

        const n0 = s0.length;
        const n1 = s1.length;

        if (n0 !== n1) {
            //wrong length
            return false;
        }

        for (let i = 0; i < n0; i++) {
            const v0 = s0[i];
            const v1 = s1[i];

            if (v0 !== v1) {
                return false;
            }
        }

        return true;
    }

    toJSON() {
        return this.values;
    }

    fromJSON(json) {
        if (typeof json === "string") {
            this.clear();
            this.add(json);
        } else if (Array.isArray(json)) {
            this.values = json;
        }
    }


    /**
     *
     * @param json
     * @returns {Tag}
     */
    static fromJSON(json) {
        const r = new Tag();

        r.fromJSON(json);

        return r;
    }
}

Tag.typeName = "Tag";

export default Tag;

export class TagSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Tag;
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Tag} value
     */
    serialize(buffer, value) {
        const values = value.getValues();

        const n = values.length;

        buffer.writeUintVar(n);

        for (let i = 0; i < n; i++) {
            const v = values[i];

            buffer.writeUTF8String(v);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Tag} value
     */
    deserialize(buffer, value) {
        value.clear();

        const tagCount = buffer.readUintVar();

        for (let i = 0; i < tagCount; i++) {
            const v = buffer.readUTF8String();

            value.add(v);
        }
    }
}


export class TagSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {
        const tag = source.readUTF8String();

        //write tag count
        target.writeUintVar(1);
        target.writeUTF8String(tag);
    }
}
