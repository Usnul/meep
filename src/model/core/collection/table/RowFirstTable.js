/**
 * Created by Alex on 10/04/2016.
 */


import Signal from "../../events/signal/Signal.js";
import { DataTypeIndices } from "./DataTypeIndices";
import { assert } from "../../assert";
import { RowFirstTableSpec } from "./RowFirstTableSpec";


/**
 *
 * @param {RowFirstTableSpec} spec
 * @constructor
 */
function RowFirstTable(spec) {
    assert.notEqual(spec, undefined, 'spec is undefined');
    assert.notEqual(spec, null, 'spec is null');
    assert.ok(spec instanceof RowFirstTableSpec, 'spec is not an instance of RowFirstTableSpec');

    /**
     *
     * @type {RowFirstTableSpec}
     */
    this.spec = spec;

    /**
     * @readonly
     * @type {Array.<DataType>}
     */
    this.types = spec.types;

    /**
     *
     * @type {ArrayBuffer}
     */
    this.data = new ArrayBuffer(0);

    /**
     *
     * @type {number}
     */
    this.bytesPerRecord = spec.bytesPerRecord;

    /**
     * number of records
     * @type {number}
     */
    this.length = 0;

    /**
     * capacity in number of records
     * @type {number}
     */
    this.capacity = 0;

    this.on = {
        added: new Signal()
    };

    this.initialize();
}

/**
 * @private
 */
RowFirstTable.prototype.initialize = function () {
    const spec = this.spec;

    this.types = spec.types;
    this.bytesPerRecord = spec.bytesPerRecord;

    this.readRowMethod = spec.readRowMethod;
    this.writeRowMethod = spec.writeRowMethod;
};

/**
 *
 * @param {int} rowCount
 */
RowFirstTable.prototype.setCapacity = function (rowCount) {
    const oldData = this.data;

    const bytesPerRecord = this.bytesPerRecord;
    const byteSize = rowCount * bytesPerRecord;
    try {
        this.data = new ArrayBuffer(byteSize);
    } catch (e) {
        throw new Error("failed to create a new array buffer of size: " + byteSize);
    }

    //check the size of new array
    if (this.data.byteLength !== byteSize) {
        throw new Error("Generated array was truncated unexpectedly from " + byteSize + " to " + this.data.byteLength);
    }

    const newArray = new Uint8Array(this.data);
    const oldArray = new Uint8Array(oldData);

    const sourceCopyLength = this.length * bytesPerRecord;
    try {
        newArray.set(oldArray.subarray(0, sourceCopyLength), 0);
    } catch (e) {
        if (e instanceof RangeError) {
            throw new Error("Failed to copy contents of original due to to size violation. OldSize: " + sourceCopyLength + ", NewSize: " + this.data.byteLength);
        } else {
            throw e;
        }
    }

    this.capacity = rowCount;

    this.dataView = new DataView(this.data, 0);
};

/**
 * Drop excess capacity, setting capacity exactly to the current length
 */
RowFirstTable.prototype.trim = function () {
    this.setCapacity(this.length);
};

/**
 *
 * @param {number} rowCount
 */
RowFirstTable.prototype.resize = function (rowCount) {
    if (this.capacity < rowCount) {
        //grow
        const growFactor = 1.5;
        const newSize = Math.ceil(rowCount * growFactor);
        this.setCapacity(newSize);
    } else if (this.capacity * 0.5 > rowCount) {
        //shrink
        this.setCapacity(rowCount);
    }
};

/**
 *
 * @param {number} rowIndex
 * @param {number} columnIndex
 * @param {number} value
 */
RowFirstTable.prototype.writeCellValue = function (rowIndex, columnIndex, value) {
    const spec = this.spec;

    const rowAddress = rowIndex * this.bytesPerRecord;

    spec.cellWriters[columnIndex](this.dataView, rowAddress, value);
};

/**
 * read a single cell value from the table
 * @param {number} rowIndex
 * @param {number} columnIndex
 * @returns {number}
 */
RowFirstTable.prototype.readCellValue = function (rowIndex, columnIndex) {
    const spec = this.spec;

    const rowAddress = rowIndex * this.bytesPerRecord;

    return spec.cellReaders[columnIndex](this.dataView, rowAddress);
};

/**
 * Remove rows from the table
 * @param {number} index starting row
 * @param {number} rowCount number of rows to be removed
 */
RowFirstTable.prototype.removeRows = function (index, rowCount) {
    //validate presence to requested rows
    assert.ok(index + rowCount <= this.length, `index(=${index}) + count(=${rowCount}) went past the end of the table. Length = ${this.length}`);

    const data = this.data;

    const bytesPerRecord = this.bytesPerRecord;

    const array = new Uint8Array(data);

    //shift tail of the table forward
    const target = index * bytesPerRecord;
    const end = this.length * bytesPerRecord;
    const start = target + rowCount * bytesPerRecord;

    array.copyWithin(target, start, end);

    //adjust new length
    this.length -= rowCount;

    //resize table
    this.resize(this.length);
};

/**
 *
 * @param {Array.<Number>} values
 */
RowFirstTable.prototype.addRow = function (values) {

    const newRowCount = this.length + 1;

    this.resize(newRowCount);

    const rowIndex = this.length;

    this.length = newRowCount;


    this.writeRowMethod(this.dataView, this.bytesPerRecord * rowIndex, values);

    this.on.added.dispatch(rowIndex, values);
};

/**
 *
 * @param {int} count number of rows to be added
 * @param {function} valueSupplier supplier of row values, called with row index and an empty row to be filled
 */
RowFirstTable.prototype.addRows = function (count, valueSupplier) {
    const newRowCount = this.length + count;

    this.resize(newRowCount);

    let i = this.length;
    this.length = newRowCount;

    const row = new Array(this.getNumColumns());

    const bytesPerRecord = this.bytesPerRecord;
    const dataView = this.dataView;
    const writeRowMethod = this.writeRowMethod;

    const onAdded = this.on.added;

    function addOneSignaling(index) {
        addOneSilent(index);
        onAdded.dispatch(index, row);
    }

    function addOneSilent(i) {
        valueSupplier(i, row);
        writeRowMethod(dataView, bytesPerRecord * i, row);
    }

    //depending on whether signal is being listened, pick signaling or silent generator
    const addOne = onAdded.hasHandlers() ? addOneSignaling : addOneSilent;

    for (; i < newRowCount; i++) {
        addOne(i);
    }

};

/**
 *
 * @param {int} index
 * @param {Array} result where row values are to be stored
 */
RowFirstTable.prototype.getRow = function (index, result) {
    this.readRowMethod(this.dataView, this.bytesPerRecord * index, result);
};

/**
 * clear out all the data and free memory
 */
RowFirstTable.prototype.clear = function () {
    //clear out data
    this.length = 0;
    this.setCapacity(0);
};


/**
 *
 * @returns {Number}
 */
RowFirstTable.prototype.getNumColumns = function () {
    return this.types.length;
};

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {RowFirstTable} table
 */
function serializeRowFirstTable(buffer, table) {
    //write types
    buffer.writeUint16(table.types.length);
    table.types.forEach(function (type) {
        const typeIndex = DataTypeIndices[type];
        buffer.writeUint8(typeIndex);
    });

    //write record length
    buffer.writeUint32(table.bytesPerRecord);

    //write number of records
    buffer.writeUint32(table.length);

    //write data
    const numDataBytes = table.length * table.bytesPerRecord;
    buffer.writeBytes(new Uint8Array(table.data).subarray(0, numDataBytes));
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {RowFirstTable} table
 */
function deserializeRowFirstTable(buffer, table) {
    /**
     *
     * @param {number} index
     * @returns {DataType|null}
     */
    function typeByIndex(index) {
        for (let type in DataTypeIndices) {
            if (!DataTypeIndices.hasOwnProperty(type)) {
                continue;
            }

            const typeIndex = DataTypeIndices[type];
            if (typeIndex === index) {
                return type;
            }
        }

        return null;
    }

    //read types
    const numTypes = buffer.readUint16();
    const types = [];
    for (let i = 0; i < numTypes; i++) {
        const typeIndex = buffer.readUint8();
        const type = typeByIndex(typeIndex);
        if (type === null) {
            throw new Error(`Unknown DataType index ${typeIndex}`);
        }
        types[i] = type;
    }

    //record size
    const bytesPerRecord = buffer.readUint32();

    //read number of records
    const numRecords = buffer.readUint32();

    const numDataBytes = bytesPerRecord * numRecords;
    const data = new Uint8Array(numDataBytes);

    //read data
    buffer.readBytes(data, 0, numDataBytes);

    //update table
    table.spec = RowFirstTableSpec.get(types);
    table.length = numRecords;
    table.capacity = numRecords;
    table.data = data.buffer;
    table.dataView = new DataView(table.data);

    table.initialize();
}

export {
    RowFirstTable,
    serializeRowFirstTable,
    deserializeRowFirstTable
};
