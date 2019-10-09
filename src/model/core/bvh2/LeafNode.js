/**
 * Created by Alex on 17/11/2014.
 */
import { Node } from './Node';
import { deserializeAABB3, serializeAABB3 } from "./AABB3";


/**
 *
 * @param {Node|LeafNode} node
 * @returns {boolean}
 */
function isLeaf(node) {
    return node.isLeafNode;
}

/**
 *
 * @param {*} object
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @constructor
 */
function LeafNode(object, x0, y0, z0, x1, y1, z1) {
    this.object = object;
    this.parentNode = null;


    this.x0 = x0;
    this.y0 = y0;
    this.z0 = z0;
    this.x1 = x1;
    this.y1 = y1;
    this.z1 = z1;
}

LeafNode.prototype = Object.create(Node.prototype);

/**
 *
 * @type {boolean}
 */
LeafNode.prototype.isLeafNode = true;

LeafNode.prototype.move = function (dx, dy, dz) {
    this.x0 += dx;
    this.x1 += dx;
    this.y0 += dy;
    this.y1 += dy;
    this.z0 += dz;
    this.z1 += dz;
    if (this.parentNode !== null) {
        this.parentNode.bubbleRefit();
    }
};

LeafNode.prototype.resize = function (x0, y0, z0, x1, y1, z1) {
    this.setBounds(x0, y0, z0, x1, y1, z1);

    if (this.parentNode !== null) {
        this.parentNode.bubbleRefit();
    }
};

LeafNode.prototype.clone = function () {
    const clone = new LeafNode(this.object, this.x0, this.y0, this.z0, this.x1, this.y1, this.z1);

    clone.parentNode = this.parentNode;

    return clone;
};


/**
 *
 * @param {BinaryBuffer} buffer
 * @param {LeafNode} node
 * @param {function(buffer:BinaryBuffer, value:*):void} valueSerializer
 */
function serializeLeafNode(buffer, node, valueSerializer) {
    serializeAABB3(buffer, node);
    valueSerializer(buffer, node.object);
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {LeafNode} node
 * @param {function(buffer:BinaryBuffer):void} valueDeserializer
 */
function deserializeLeafNode(buffer, node, valueDeserializer) {
    deserializeAABB3(buffer, node);
    node.object = valueDeserializer(buffer);
}

export {
    isLeaf,
    LeafNode,
    serializeLeafNode,
    deserializeLeafNode
};
