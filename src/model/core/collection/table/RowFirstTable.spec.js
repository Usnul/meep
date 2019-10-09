import { deserializeRowFirstTable, RowFirstTable, serializeRowFirstTable } from "./RowFirstTable";
import { BinaryBuffer } from "../../binary/BinaryBuffer";
import { DataType } from "./DataType";
import { RowFirstTableSpec } from "./RowFirstTableSpec.js";

test("constructor doesn't throw", () => {
    new RowFirstTable(new RowFirstTableSpec([]));
});

test("add row then read back", () => {
    const sut = new RowFirstTable(new RowFirstTableSpec([DataType.Float64, DataType.Uint8]));

    sut.addRow([1.4, 8]);

    const result = [];
    sut.getRow(0, result);

    expect(result).toEqual([1.4, 8]);
});

test("add two rows, then read back", () => {
    const sut = new RowFirstTable(new RowFirstTableSpec([DataType.Float64, DataType.Uint8]));

    sut.addRow([1.4, 8]);
    sut.addRow([1.5, 9]);

    expect(sut.length).toBe(2);

    const result = [];

    sut.getRow(0, result);

    expect(result).toEqual([1.4, 8]);

    sut.getRow(1, result);

    expect(result).toEqual([1.5, 9]);
});

test("serialization deserialization consistency", () => {

    const expected = new RowFirstTable(new RowFirstTableSpec([DataType.Float64, DataType.Uint8]));

    expected.addRow([1.4, 8]);
    expected.addRow([1.5, 9]);

    const buffer = new BinaryBuffer();
    serializeRowFirstTable(buffer, expected);

    //rewind buffer
    buffer.position = 0;

    const actual = new RowFirstTable(new RowFirstTableSpec([]));
    deserializeRowFirstTable(buffer, actual);

    const result = [];

    actual.getRow(0, result);
    expect(result).toEqual([1.4, 8]);

    actual.getRow(1, result);
    expect(result).toEqual([1.5, 9]);
});

test("removeRows 1 in the middle", () => {

    const sut = new RowFirstTable(new RowFirstTableSpec([DataType.Float64, DataType.Uint8]));

    sut.addRow([1.4, 8]);
    sut.addRow([1.5, 9]);
    sut.addRow([1.6, 10]);

    //remove row in the middle
    sut.removeRows(1, 1);

    expect(sut.length).toEqual(2);


    const result = [];

    sut.getRow(0, result);
    expect(result).toEqual([1.4, 8]);

    sut.getRow(1, result);
    expect(result).toEqual([1.6, 10]);
});

test("removeRows 2 in the middle", () => {

    const sut = new RowFirstTable(new RowFirstTableSpec([DataType.Float64, DataType.Uint8]));

    sut.addRow([1.4, 8]);
    sut.addRow([1.5, 9]);
    sut.addRow([1.6, 10]);
    sut.addRow([1.7, 11]);

    //remove row in the middle
    sut.removeRows(1, 2);

    expect(sut.length).toEqual(2);


    const result = [];

    sut.getRow(0, result);
    expect(result).toEqual([1.4, 8]);

    sut.getRow(1, result);
    expect(result).toEqual([1.7, 11]);
});

test("removeRows 1 at the start", () => {

    const sut = new RowFirstTable(new RowFirstTableSpec([DataType.Float64, DataType.Uint8]));

    sut.addRow([1.4, 8]);
    sut.addRow([1.5, 9]);

    //remove row in the middle
    sut.removeRows(0, 1);

    expect(sut.length).toEqual(1);


    const result = [];

    sut.getRow(0, result);
    expect(result).toEqual([1.5, 9]);
});

test("removeRows 1 at the end", () => {
    const sut = new RowFirstTable(new RowFirstTableSpec([DataType.Float64, DataType.Uint8]));

    sut.addRow([1.4, 8]);
    sut.addRow([1.5, 9]);

    //remove row in the middle
    sut.removeRows(1, 1);

    expect(sut.length).toEqual(1);


    const result = [];

    sut.getRow(0, result);
    expect(result).toEqual([1.4, 8]);
});

test("writeCellValue", () => {

    const sut = new RowFirstTable(new RowFirstTableSpec([DataType.Float64, DataType.Uint8]));

    sut.addRow([1.4, 8]);
    sut.addRow([1.5, 9]);

    sut.writeCellValue(1, 0, 99);

    expect(sut.length).toEqual(2);

    const result = [];

    sut.getRow(0, result);
    expect(result).toEqual([1.4, 8]);

    sut.getRow(1, result);
    expect(result).toEqual([99, 9]);


    sut.writeCellValue(1, 1, 71);

    sut.getRow(1, result);
    expect(result).toEqual([99, 71]);
});

test("readCellValue", () => {
    const sut = new RowFirstTable(new RowFirstTableSpec([DataType.Float64, DataType.Uint8]));

    sut.addRow([1.4, 8]);
    sut.addRow([1.5, 9]);


    expect(sut.readCellValue(0,0)).toEqual(1.4);
    expect(sut.readCellValue(0,1)).toEqual(8);
    expect(sut.readCellValue(1,0)).toEqual(1.5);
    expect(sut.readCellValue(1,1)).toEqual(9);
});
