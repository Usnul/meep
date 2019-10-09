import { RowFirstTable } from "../../../core/collection/table/RowFirstTable.js";
import { DataType } from "../../../core/collection/table/DataType";


function TemporalPath() {
    /**
     * How long to track the points for
     * @type {number}
     */
    this.memory = 0;

    /**
     *
     * @type {number}
     */
    this.time = 0;

    /**
     *
     * @type {RowFirstTable}
     */
    this.data = new RowFirstTable([
        DataType.Float32,
        DataType.Float32, DataType.Float32, DataType.Float32
    ]);
}

const tempSequenceRecord = [];

TemporalPath.prototype.updateSequence = function () {
    const sequence = this.data;
    //determine if position sequence can be cropped
    const numRecords = sequence.length;

    if (numRecords === 0) {
        return;
    }

    const lastUsefulMemory = this.time - this.memory;

    let i = 0;

    while (i < numRecords && sequence.readCellValue(i, 0) < lastUsefulMemory) {
        i++;
    }

    if (i > 0) {
        sequence.removeRows(0,i);
    }
};

/**
 *
 * @param {number} timeDelta
 */
TemporalPath.prototype.update = function (timeDelta) {
    this.time += timeDelta;

    this.updateSequence();
};


/**
 *
 * @param {number} t value between 0..1, falls between points p1 and p2
 * @param {number[]} p0
 * @param {number[]} p1
 * @param {number[]} p2
 * @param {number[]} p3
 * @param {number[]} result
 */
function catmullRomSample(t, p0, p1, p2, p3, result) {

    for (let j = 0; j < 4; j++) {
        const v0 = p0[j];
        const v1 = p1[j];
        const v2 = p2[j];
        const v3 = p3[j];

        const t2 = t * t;
        const t3 = t2 * t;

        const qT = 0.5 * (2 * v1 + (v2 - v0) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 + (3 * v1 - v0 - 3 * v2 + v3) * t3);

        result[j] = qT;
    }
}

/**
 * @returns {number}
 */
TemporalPath.prototype.computeLength = function () {

    let i;
    const numRecords = this.data.length;

    if (numRecords === 0) {
        return 0;
    }

    let _x, _y, _z;

    this.data.getRow(0, tempSequenceRecord);

    _x = tempSequenceRecord[1];
    _y = tempSequenceRecord[2];
    _z = tempSequenceRecord[3];


    let result = 0;

    for (i = 1; i < numRecords; i++) {
        this.data.getRow(i, tempSequenceRecord);

        const x = tempSequenceRecord[1];
        const y = tempSequenceRecord[2];
        const z = tempSequenceRecord[3];

        const dX = x - _x;
        const dY = y - _y;
        const dZ = z - _z;

        const d = Math.sqrt(dX * dX + dY * dY + dZ * dZ);

        result += d;

        //remember current coordinates
        _x = x;
        _y = y;
        _z = z;
    }

    return result;
};

/**
 *
 * @param {number} sampleCount
 * @param {Float32Array} result
 */
TemporalPath.prototype.sampleSmoothPath = function (sampleCount, result) {

};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
TemporalPath.prototype.append = function (x, y, z) {
    tempSequenceRecord[0] = this.time;
    tempSequenceRecord[1] = x;
    tempSequenceRecord[2] = y;
    tempSequenceRecord[3] = z;

    this.data.addRow(tempSequenceRecord);
};

export { TemporalPath };
