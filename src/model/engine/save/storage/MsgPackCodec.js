/**
 * Created by Alex on 12/06/2017.
 */

import msgpack from 'msgpack-lite';

function MsgPackCodec() {

}

MsgPackCodec.prototype.encode = function (json) {
    console.time("encoding of value");
    const result = msgpack.encode(json);
    console.timeEnd("encoding of value");
    return result;
};

MsgPackCodec.prototype.decode = function (bytes) {
    return msgpack.decode(bytes);
};

export default MsgPackCodec;