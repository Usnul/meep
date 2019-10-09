import { BinaryNode, deserializeBinaryNode, serializeBinaryNode } from "./BinaryNode";
import { BinaryBuffer } from "../binary/BinaryBuffer";
import { byteArrayToString, jsonToStringToByteArray } from "../binary/ByteArrayTools";
import { LeafNode } from "./LeafNode";
import { validateNode, validateTree } from "./NodeValidator.js";
import { isLeaf } from "./LeafNode.js";

/**
 *
 * @param {AABB3} expected
 * @param {AABB3} actual
 * @param {number} [numDigits]
 */
function compareBounds(expected, actual, numDigits = 2) {
    expect(actual.x0).toBeCloseTo(expected.x0, numDigits);
    expect(actual.y0).toBeCloseTo(expected.y0, numDigits);
    expect(actual.z0).toBeCloseTo(expected.z0, numDigits);
    expect(actual.x1).toBeCloseTo(expected.x1, numDigits);
    expect(actual.y1).toBeCloseTo(expected.y1, numDigits);
    expect(actual.z1).toBeCloseTo(expected.z1, numDigits);
}

/**
 *
 * @param {NodeDescription} expected
 * @param {NodeDescription} actual
 */
function compareNodes(expected, actual) {
    if (expected === undefined) {
        expect(actual).toBeUndefined();
    }
    if (expected === null) {
        expect(actual).toBeNull();
    }

    if (expected instanceof BinaryNode) {
        expect(actual instanceof BinaryNode).toBeTruthy();
        compareBounds(expected, actual);

        compareNodes(expected.left, actual.left);
        compareNodes(expected.right, actual.right);
    } else if (expected instanceof LeafNode) {
        expect(actual instanceof LeafNode).toBeTruthy();
        compareBounds(expected, actual);
        expect(actual.object).toEqual(expected.object);
    }
}

expect.extend({
    toBeValid(node) {
        const violations = [];

        function violationCallback(v) {
            violations.push(v);
        }

        let pass = true;
        if (isLeaf(node)) {
            pass = pass && validateNode(node, violationCallback);
        } else {
            pass = pass && validateTree(node, violationCallback);
        }

        if (!pass) {
            let message = violations.map((v) => v.toString()).join("\n");

            if (message.trim().length === 0) {
                message = `node is not valid`;
            }

            return {
                message: function () {
                    return message
                },
                pass: false
            };
        }

        return {
            pass: true
        };
    },
    /**
     *
     * @param {BinaryNode} container
     * @param node
     */
    toContainNode(container, node) {
        let found = false;
        let message;
        container.traversePreOrderUsingStack(function (n) {
            if (n === node) {
                found = true;
                //stop traversal
                return false;
            }
        });

        if (!found) {
            message = `node is not contained within the tree`;
        }

        return {
            message,
            pass: found
        };
    }
});

test("constructor", () => {
    const node = new BinaryNode();

    expect(node.left).toBeNull();
    expect(node.right).toBeNull();
    expect(node.parentNode).toBeNull();
});

test("insert single leaf", () => {
    const binaryNode = new BinaryNode();
    binaryNode.setNegativelyInfiniteBounds();

    const leafNode = new LeafNode(7, 1, 2, 3, 4, 5, 6);

    binaryNode.insertNode(leafNode);

    expect(binaryNode).toBeValid();
    expect(leafNode).toBeValid();

    expect(binaryNode).toContainNode(leafNode);
    expect(leafNode.parentNode).toBe(binaryNode);
});

test("insert many leaves", () => {
    const binaryNode = new BinaryNode();
    binaryNode.setNegativelyInfiniteBounds();

    const leaves = [];

    for (let i = 0; i < 17; i++) {
        const leafNode = new LeafNode(i, i, i, i, i + 1, i + 1, i + 1);
        binaryNode.insertNode(leafNode);

        leaves.push(leafNode);
    }

    expect(binaryNode).toBeValid();

    for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];

        expect(leaf.computeRoot()).toBe(binaryNode);

        expect(binaryNode).toContainNode(leaf);
    }
});

test("disconnect single leaf", () => {
    const binaryNode = new BinaryNode();
    binaryNode.setNegativelyInfiniteBounds();

    const leafNode = new LeafNode(7, 1, 2, 3, 4, 5, 6);

    binaryNode.insertNode(leafNode);

    expect(binaryNode).toContainNode(leafNode);

    leafNode.disconnect();

    expect(leafNode.parentNode).toBeNull();

    expect(binaryNode).not.toContainNode(leafNode);

    expect(binaryNode).toBeValid();
});

test("disconnect many leaves", () => {
    const binaryNode = new BinaryNode();
    binaryNode.setNegativelyInfiniteBounds();

    const leaves = [];

    for (let i = 0; i < 17; i++) {
        const leafNode = new LeafNode(i, i, i, i, i + 1, i + 1, i + 1);
        binaryNode.insertNode(leafNode);

        leaves.push(leafNode);
    }

    expect(binaryNode).toBeValid();

    for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];
        leaf.disconnect();

        expect(leaf.parentNode).toBeNull();

        expect(binaryNode).not.toContainNode(leaf);

        expect(binaryNode).toBeValid();
    }
});

test("serialization deserialization consistency", () => {
    const expected = new BinaryNode();

    expected.setNegativelyInfiniteBounds();

    expected.insert(1, 2, 3, 4, 5, 6, "hello");
    expected.insert(7, 8, 9, 10, 11, 12, "goodbye");
    expected.insert(-6, -5, -4, -3, -2, -1, "world is cruel");

    const buffer = new BinaryBuffer();

    serializeBinaryNode(buffer, expected, function (buffer, value) {
        const byteArray = jsonToStringToByteArray(value);
        const numBytes = byteArray.length;
        buffer.writeUint32(numBytes);
        buffer.writeBytes(byteArray);
    });

    //reset position for reading
    buffer.position = 0;

    //
    const actual = new BinaryNode();

    deserializeBinaryNode(buffer, actual, function (buffer) {
        const numBytes = buffer.readUint32();
        const uint8Array = new Uint8Array(numBytes);
        buffer.readBytes(uint8Array, 0, numBytes);

        const text = byteArrayToString(uint8Array);
        return JSON.parse(text);
    });


    compareNodes(expected, actual);
});

test("serialization deserialization consistency via to/fromBinaryBuffer", () => {
    const expected = new BinaryNode();

    expected.setNegativelyInfiniteBounds();

    expected.insert(1, 2, 3, 4, 5, 6, "hello");
    expected.insert(7, 8, 9, 10, 11, 12, "goodbye");
    expected.insert(-6, -5, -4, -3, -2, -1, "world is cruel");

    const buffer = new BinaryBuffer();

    expected.toBinaryBuffer(buffer, function (buffer, value) {
        const byteArray = jsonToStringToByteArray(value);
        const numBytes = byteArray.length;
        buffer.writeUint32(numBytes);
        buffer.writeBytes(byteArray);
    });

    //reset position for reading
    buffer.position = 0;

    //
    const actual = new BinaryNode();

    actual.fromBinaryBuffer(buffer, function (buffer) {
        const numBytes = buffer.readUint32();
        const uint8Array = new Uint8Array(numBytes);
        buffer.readBytes(uint8Array, 0, numBytes);

        const text = byteArrayToString(uint8Array);
        return JSON.parse(text);
    });


    compareNodes(expected, actual);
});

test("setChildren", () => {
    const root = new BinaryNode();

    const a = new BinaryNode();
    a.setBounds(0, 1, 2, 1, 1, 3);

    const b = new BinaryNode();
    b.setBounds(-1, -2, -3, 0, 2, 2);

    root.setChildren(a, b);

    expect(a.parentNode).toBe(root);
    expect(b.parentNode).toBe(root);

    expect(root.left).toBe(a);
    expect(root.right).toBe(b);

    //check refitting
    expect(root.x0).toBe(-1);
    expect(root.y0).toBe(-2);
    expect(root.z0).toBe(-3);
    expect(root.x1).toBe(1);
    expect(root.y1).toBe(2);
    expect(root.z1).toBe(3);

    expect(root).toBeValid();
});

