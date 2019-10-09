/**
 * Created by Alex on 23/04/2014.
 */


import { assert } from "../../../core/assert.js";
import { computeStringHash } from "../../../core/strings/StringUtils.js";
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";

export class Tag {
    /**
     *
     * @param {string} [name]
     * @constructor
     */
    constructor(name) {
        this.name = name;
    }

    toJSON() {
        return this.name;
    }

    fromJSON(json) {
        assert.typeOf(json, 'string', 'json');

        this.name = json;
    }

    /**
     *
     * @return {number}
     */
    hash() {
        return computeStringHash(this.name);
    }

    /**
     *
     * @param {Tag} other
     * @return {boolean}
     */
    equals(other) {
        return this.name === other.name;
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

export class TagSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = Tag;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Tag} value
     */
    serialize(buffer, value) {
        buffer.writeUTF8String(value.name);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Tag} value
     */
    deserialize(buffer, value) {
        value.name = buffer.readUTF8String();
    }
}
