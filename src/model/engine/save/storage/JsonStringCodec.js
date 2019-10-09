/**
 * Created by Alex on 12/06/2017.
 */


import { byteArrayToString } from "../../../core/binary/ByteArrayTools";
import { stringify } from "../../../core/json/JsonUtils";

function JsonStringCodec() {
}

JsonStringCodec.prototype.encode = function (json) {
    console.time("stringification of value");
    const saveString = stringify(json);
    console.timeEnd("stringification of value");
    return saveString;
};

JsonStringCodec.prototype.decode = function (bytes) {
    const stringValue = byteArrayToString(bytes);
    return JSON.parse(stringValue);
};

export default JsonStringCodec;