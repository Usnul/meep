/**
 * Created by Alex on 13/04/2017.
 */


import { resolvePath } from '../../../core/json/JsonUtils';
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";

function PropertySet(options) {
    this.data = {};

    if (options !== null && options !== undefined) {
        this.fromJSON(options);
    }
}

PropertySet.typeName = "PropertySet";


PropertySet.prototype.get = function (path) {
    return resolvePath(this.data, path);
};

/**
 *
 * @param {String} path
 * @param {Number|Boolean|String} value
 */
PropertySet.prototype.set = function (path, value) {
    if (path.charAt(0) === '/') {
        //strip leading slash if it is present
        path = path.slice(1);
    }

    const parts = path.split("/");

    const l = parts.length;

    if (parts.length === 0) {
        this.data = value;
    } else {

        let current = this.data;

        for (let i = 0; i < l - 1; i++) {
            const part = parts[i];

            if (!current.hasOwnProperty(part)) {
                current[part] = {};
            }
            current = current[part];
        }

        const lastPropertyName = parts[l - 1];

        current[lastPropertyName] = value;
    }
};

PropertySet.prototype.toJSON = function () {
    return JSON.parse(JSON.stringify(this.data));
};

PropertySet.prototype.fromJSON = function (json) {
    this.data = json;
};


/**
 *
 * @param {BinaryBuffer} buffer
 */
PropertySet.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeUTF8String(JSON.stringify(this.data));
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
PropertySet.prototype.fromBinaryBuffer = function (buffer) {
    const string = buffer.readUTF8String();

    this.data = JSON.parse(string);
};

export default PropertySet;

export class PropertySetSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = PropertySet;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {PropertySet} value
     */
    serialize(buffer, value) {
        buffer.writeUTF8String(JSON.stringify(value.data));
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {PropertySet} value
     */
    deserialize(buffer, value) {
        const string = buffer.readUTF8String();

        value.data = JSON.parse(string);
    }
}
