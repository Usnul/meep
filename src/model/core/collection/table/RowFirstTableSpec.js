/**
 * @readonly
 * @enum {string}
 */
import { Cache } from "../../Cache";

/**
 * @readonly
 * @enum {string}
 */
export const DataType2DataViewReaders = {
    "uint8": "getUint8",
    "uint16": "getUint16",
    "uint32": "getUint32",
    "uint64": "getUint64",

    "int8": "getInt8",
    "int16": "getInt16",
    "int32": "getInt32",
    "int64": "getInt64",

    "float32": "getFloat32",
    "float64": "getFloat64"
};

/**
 * @readonly
 * @enum {string}
 */
export const DataType2DataViewWriters = {
    "uint8": "setUint8",
    "uint16": "setUint16",
    "uint32": "setUint32",
    "uint64": "setUint64",

    "int8": "setInt8",
    "int16": "setInt16",
    "int32": "setInt32",
    "int64": "setInt64",

    "float32": "setFloat32",
    "float64": "setFloat64"
};

/**
 * @readonly
 * @type {object.<string,number>}
 */
const ByteSizeMap = {
    "uint8": 1,
    "uint16": 2,
    "uint32": 4,
    "uint64": 8,

    "int8": 1,
    "int16": 2,
    "int32": 4,
    "int64": 8,

    "float32": 4,
    "float64": 8
};

/**
 *
 * @param {DataType[]} types
 * @returns {Function}
 */
function genRowReader(types) {
    let offset = 0;

    const lines = [];

    const numTypes = types.length;

    for (let i = 0; i < numTypes; i++) {

        const type = types[i];
        lines.push("result[" + i + "] = dataView." + DataType2DataViewReaders[type] + "(" + offset + " + byteOffset);");
        offset += ByteSizeMap[type];

    }

    const result = new Function(['dataView, byteOffset, result'], lines.join("\n"));

    return result;
}

/**
 *
 * @param {DataType[]} types
 * @returns {Function}
 */
function genRowWriter(types) {
    let offset = 0;

    const lines = [];

    const numTypes = types.length;

    for (let i = 0; i < numTypes; i++) {
        const type = types[i];
        lines.push("dataView." + DataType2DataViewWriters[type] + "(" + offset + " + byteOffset, record[" + i + "]);");
        offset += ByteSizeMap[type];
    }

    const result = new Function(['dataView, byteOffset, record'], lines.join("\n"));
    return result;
}

/**
 *
 * @param {DataType} type
 * @param {number} offset
 * @returns {Function}
 */
function genCellWriter(type, offset) {
    const writeMethod = DataType2DataViewWriters[type];

    return new Function(['dataView, byteOffset, value'], `dataView.${writeMethod}(byteOffset+${offset}, value);`);
}

/**
 *
 * @param {DataType} type
 * @param {number} offset
 * @returns {Function}
 */
function genCellReader(type, offset) {
    const readMethod = DataType2DataViewReaders[type];

    return new Function(['dataView, byteOffset'], `return dataView.${readMethod}(byteOffset+${offset});`);
}

/**
 *
 * @param {DataType[]} types
 * @constructor
 */
export function RowFirstTableSpec(types) {
    const numTypes = types.length;

    /**
     * @readonly
     * @type {DataType[]}
     */
    this.types = types;

    /**
     * @readonly
     * @type {number[]}
     */
    this.columnOffsets = new Array(numTypes);
    let byteOffset = 0;
    types.forEach((type, index) => {
        this.columnOffsets[index] = byteOffset;

        const columnByteSize = ByteSizeMap[type];

        byteOffset += columnByteSize;
    });


    /**
     * @readonly
     * @type {number}
     */
    this.bytesPerRecord = byteOffset;

    /**
     * @readonly
     * @type {Function}
     */
    this.readRowMethod = genRowReader(types);

    /**
     * @readonly
     * @type {Function}
     */
    this.writeRowMethod = genRowWriter(types);


    //generate cell readers/writers
    this.cellWriters = new Array(numTypes);
    this.cellReaders = new Array(numTypes);

    for (let i = 0; i < numTypes; i++) {
        this.cellReaders[i] = genCellReader(types[i], this.columnOffsets[i]);
        this.cellWriters[i] = genCellWriter(types[i], this.columnOffsets[i]);
    }
}


const cache = new Cache();

/**
 *
 * @param {DataType[]} types
 * @returns {RowFirstTableSpec}
 */
RowFirstTableSpec.get = function (types) {
    //compute hash
    const hash = types.join('.');

    const cachedValue = cache.get(hash);

    if (cachedValue !== null) {
        return cachedValue;
    }

    const newValue = new RowFirstTableSpec(types);
    cache.put(hash, newValue);

    return newValue;
};
