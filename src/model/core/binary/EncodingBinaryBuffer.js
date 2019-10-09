import { BinaryBuffer } from "./BinaryBuffer.js";

function Dictionary() {
    this.forward = new Map();
    this.backward = new Map();
}

Dictionary.prototype.add = function (value, address) {
    this.forward.set(address, value);
    this.backward.set(value, address);
};

Dictionary.prototype.getAddress = function (value) {
    return this.backward.get(value);
};

Dictionary.prototype.getValue = function (address) {
    return this.forward.get(address);
};


function EncodingBinaryBuffer() {
    BinaryBuffer.call(this);
    this.__dictionary = new Dictionary();
}

EncodingBinaryBuffer.prototype = Object.create(BinaryBuffer.prototype);

EncodingBinaryBuffer.prototype.writeUTF8String = function (value) {
    const address = this.__dictionary.getAddress(value);

    if (address === undefined) {
        this.writeUint8(0); //mark as complete value

        const address1 = this.position;

        BinaryBuffer.prototype.writeUTF8String.call(this, value);

        this.__dictionary.add(value, address1);
    } else {
        //write as reference
        this.writeUint32LE(1 | (address << 1));
    }
};

EncodingBinaryBuffer.prototype.readUTF8String = function () {
    const header0 = this.readUint8();

    if (header0 === 0) {
        //complete value
        return BinaryBuffer.prototype.readUTF8String.call(this);
    } else {
        this.position--;

        const header = this.readUint32LE();

        const address = header >> 1;

        let value = this.__dictionary.getValue(address);

        if (value === undefined) {
            //remember position
            const p = this.position;

            this.position = address;

            value = BinaryBuffer.prototype.readUTF8String.call(this);

            //restore position
            this.position = p;

            this.__dictionary.add(value, address);
        }

        return value;
    }
};


export { EncodingBinaryBuffer };
