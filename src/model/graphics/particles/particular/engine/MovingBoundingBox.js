import { AABB3 } from "../../../../core/bvh2/AABB3.js";
import { RowFirstTable } from "../../../../core/collection/table/RowFirstTable.js";
import Vector3 from "../../../../core/geom/Vector3.js";
import { DataType } from "../../../../core/collection/table/DataType";
import { RowFirstTableSpec } from "../../../../core/collection/table/RowFirstTableSpec";

const tempSequenceRecord = [];

const positionSequenceSpec = new RowFirstTableSpec([
    DataType.Float32,
    DataType.Float32, DataType.Float32, DataType.Float32,
    DataType.Float32, DataType.Float32, DataType.Float32
]);

/**
 * Data structure to keep track of moving bounding box bounds over time. Useful for things like particle emitters where particles may linger after emitter has moved.
 * @constructor
 */
function MovingBoundingBox() {
    /**
     * How long to remember movements for
     * @type {number}
     */
    this.memory = 0;

    /**
     * Bounds of the object being moved
     * @type {AABB3}
     */
    this.objectBounds = new AABB3(0, 0, 0, 0, 0, 0);

    /**
     * Bounds of the motion trail of the object
     * @type {AABB3}
     */
    this.trailBounds = new AABB3(0, 0, 0, 0, 0, 0);

    /**
     * Time series recording changes to the bounding box
     * @type {RowFirstTable}
     */
    this.positionSequence = new RowFirstTable(positionSequenceSpec);

    /**
     * Current position
     * @type {Vector3}
     */
    this.position = new Vector3();

    /**
     * Current time
     * @type {number}
     */
    this.time = 0;
}

/**
 *
 * @param {number} timeDelta
 */
MovingBoundingBox.prototype.update = function (timeDelta) {
    this.time += timeDelta;
    this.updateSequence(timeDelta);
};

MovingBoundingBox.prototype.updateSequence = function () {
    const sequence = this.positionSequence;


    const numRecords = sequence.length;

    //determine if position sequence can be cropped
    if (numRecords === 0) {
        return;
    }

    const lastUsefulMemory = this.time - this.memory;

    let i = 0;

    while (i < numRecords && sequence.readCellValue(i, 0) < lastUsefulMemory) {
        i++;
    }

    if (i > 0) {
        sequence.removeRows(0, i);
        //table content have changed, update the bounds
        this.computeTrailBounds();
    }
};

MovingBoundingBox.prototype.computeTrailBounds = function () {
    const length = this.positionSequence.length;
    let i;

    const p = this.position;

    const ob = this.objectBounds;

    //initialize bounds to current position
    this.trailBounds.setBounds(
        p.x + ob.x0,
        p.y + ob.y0,
        p.z + ob.z0,
        p.x + ob.x1,
        p.y + ob.y1,
        p.z + ob.z1
    );

    for (i = 0; i < length; i++) {
        this.positionSequence.getRow(i, tempSequenceRecord);

        const x0 = tempSequenceRecord[1];
        const y0 = tempSequenceRecord[2];
        const z0 = tempSequenceRecord[3];

        const x1 = tempSequenceRecord[4];
        const y1 = tempSequenceRecord[5];
        const z1 = tempSequenceRecord[6];

        this.trailBounds._expandToFit(x0, y0, z0, x1, y1, z1);
    }

};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
MovingBoundingBox.prototype.move = function (x, y, z) {
    const p = this.position;

    const ob = this.objectBounds;

    //record previous position
    tempSequenceRecord[0] = this.time;

    tempSequenceRecord[1] = p.x + ob.x0;
    tempSequenceRecord[2] = p.y + ob.y0;
    tempSequenceRecord[3] = p.z + ob.z0;

    tempSequenceRecord[4] = p.x + ob.x1;
    tempSequenceRecord[5] = p.y + ob.y1;
    tempSequenceRecord[6] = p.z + ob.z1;

    this.positionSequence.addRow(tempSequenceRecord);

    p.set(x, y, z);

    //update bounds
    //TODO this can be done cheaper by directly modifying the bounding box with just the current move
    this.computeTrailBounds();
};

export { MovingBoundingBox };
