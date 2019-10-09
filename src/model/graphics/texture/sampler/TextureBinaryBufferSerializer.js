import { DataTypeIndices } from "../../../core/collection/table/DataTypeIndices.js";
import { Sampler2D } from "./Sampler2D.js";
import { EndianType } from "../../../core/binary/BinaryBuffer.js";
import { DataType } from "../../../core/collection/table/DataType";


/**
 *
 * @param {TypedArray} arr
 * @returns {DataType}
 */
function dataTypeFromTypedArray(arr) {
    if (arr instanceof Float32Array) {
        return DataType.Float32;
    } else if (arr instanceof Float64Array) {
        return DataType.Float64;
    } else if (arr instanceof Uint8Array) {
        return DataType.Uint8;
    } else if (arr instanceof Uint16Array) {
        return DataType.Uint16;
    } else if (arr instanceof Uint32Array) {
        return DataType.Uint32;
    } else if (arr instanceof Int8Array) {
        return DataType.Int8;
    } else if (arr instanceof Int16Array) {
        return DataType.Int16;
    } else if (arr instanceof Int32Array) {
        return DataType.Int32;
    } else if (arr instanceof Array) {
        //if array is untyped, use Float64 as numbers in JS are 64 bit
        return DataType.Float64;
    } else {
        throw new TypeError(`Unknown array type`);
    }
}

/**
 *
 * @param {number} index
 * @returns {DataType}
 */
function dataTypeByTypeIndex(index) {
    for (let type in DataTypeIndices) {
        const typeIndex = DataTypeIndices[type];
        if (typeIndex === index) {
            return type;
        }
    }

    throw new Error(`No type found with index ${index}`);
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {DataType} type
 * @param {number} length
 */
function readTypedArray(buffer, type, length) {
    const oldEndianness = buffer.endianness;
    buffer.endianness = EndianType.LittleEndian;

    let result = null;
    switch (type) {
        case DataType.Uint8:
            result = new Uint8Array(length);
            buffer.readUint8Array(result, 0, length);
            break;
        case DataType.Uint16:
            result = new Uint16Array(length);
            buffer.readUint16Array(result, 0, length);
            break;
        case DataType.Uint32:
            result = new Uint32Array(length);
            buffer.readUint32Array(result, 0, length);
            break;
        case DataType.Int8:
            result = new Int8Array(length);
            buffer.readInt8Array(result, 0, length);
            break;
        case DataType.Int16:
            result = new Int16Array(length);
            buffer.readInt16Array(result, 0, length);
            break;
        case DataType.Int32:
            result = new Int32Array(length);
            buffer.readInt32Array(result, 0, length);
            break;
        case DataType.Float32:
            result = new Float32Array(length);
            buffer.readFloat32Array(result, 0, length);
            break;
        case DataType.Float64:
            result = new Float64Array(length);
            buffer.readFloat64Array(result, 0, length);
            break;
        default:
            result = null;
    }

    //restore
    buffer.endianness = oldEndianness;

    if (result === null) {
        throw new TypeError(`Unsupported data type ${type}`);
    }

    return result;
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {Sampler2D} texture
 */
export function serializeTexture(buffer, texture) {
    buffer.writeUint32(texture.width);
    buffer.writeUint32(texture.height);
    buffer.writeUint8(texture.itemSize); //number of channels

    const type = dataTypeFromTypedArray(texture.data);
    buffer.writeUint8(DataTypeIndices[type]);
    const array = texture.data;

    const byteBuffer = array.buffer;

    if (byteBuffer === undefined) {
        throw new TypeError(`No buffer found on data array, only TypedArrays are supported. It appears that data array is not a TypedArray`);
    }

    buffer.writeBytes(new Uint8Array(byteBuffer));
}


/**
 *
 * @param {BinaryBuffer} buffer
 * @returns {Sampler2D}
 */
export function deserializeTexture(buffer) {
    const width = buffer.readUint32();
    const height = buffer.readUint32();

    const itemSize = buffer.readUint8();

    const dataTypeId = buffer.readUint8();

    const type = dataTypeByTypeIndex(dataTypeId);

    const length = width * height * itemSize;

    const array = readTypedArray(buffer, type, length);


    return new Sampler2D(array, itemSize, width, height);
}