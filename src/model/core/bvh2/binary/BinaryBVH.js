/**
 * Created by Alex on 24/05/2016.
 */
import { intersectRay } from '../AABB3Math';

import PrimitiveType from '../../binary/type/PrimitiveTypes';
import BinaryStructure from '../../binary/type/Type';

const NodeType = {
    LEAF: 0,
    BINARY: 1
};

const sBox = new BinaryStructure();
sBox.addField('x0', PrimitiveType.Float32);
sBox.addField('y0', PrimitiveType.Float32);
sBox.addField('z0', PrimitiveType.Float32);
sBox.addField('x1', PrimitiveType.Float32);
sBox.addField('y1', PrimitiveType.Float32);
sBox.addField('z1', PrimitiveType.Float32);

const sNode = sBox.clone();
sNode.addField('type', PrimitiveType.Uint8);

const sNodeLeaf = sNode.clone();
sNodeLeaf.addField('index', PrimitiveType.Uint32);

const sNodeBinary = sNode.clone();
sNodeBinary.addField('left', PrimitiveType.Uint32);
sNodeBinary.addField('right', PrimitiveType.Uint32);


const daNode = sNode.generateDataAccess();

const daNodeLeaf = sNodeLeaf.generateDataAccess();
const daNodeBinary = sNodeBinary.generateDataAccess();

/**
 *
 * @param leafCount
 * @constructor
 */
const BinaryBVH = function (leafCount) {
    const twoLog = Math.log(leafCount) / Math.log(2);

    const twoLeafLimit = Math.pow(2, Math.ceil(twoLog));
    const binaryNodeCount = twoLeafLimit - 1;


    this.nodeByteSize = sNode.byteSize;

    this.leafNodeCount = leafCount;
    this.leafNodeByteSize = this.nodeByteSize + 4;

    this.binaryNodeByteSize = this.nodeByteSize + 4 * 2;

    this.binaryNodeCount = binaryNodeCount;

    this.leafNodesOffset = this.binaryNodeByteSize * binaryNodeCount;

    this.totalByteSize = this.binaryNodeByteSize * this.binaryNodeCount + this.leafNodeByteSize * this.leafNodeCount;

    this.byteBuffer = new ArrayBuffer(this.totalByteSize);
    this.dataView = new DataView(this.byteBuffer);
};


function copyBox(from, to, dataView) {
    const x0 = daNode.read_x0(dataView, from);
    const y0 = daNode.read_y0(dataView, from);
    const z0 = daNode.read_z0(dataView, from);

    const x1 = daNode.read_x1(dataView, from);
    const y1 = daNode.read_y1(dataView, from);
    const z1 = daNode.read_z1(dataView, from);

    daNode.write_x0(dataView, to, x0);
    daNode.write_y0(dataView, to, y0);
    daNode.write_z0(dataView, to, z0);

    daNode.write_x1(dataView, to, x1);
    daNode.write_y1(dataView, to, y1);
    daNode.write_z1(dataView, to, z1);
}

function binaryNodeSetChildren(dataView, binaryNode, childNode0, childNode1) {
    daNodeBinary.write_type(dataView, binaryNode, NodeType.BINARY);
    daNodeBinary.write_left(dataView, binaryNode, childNode0);
    daNodeBinary.write_right(dataView, binaryNode, childNode1);
}

function binaryNodeRefit(dataView, binaryNode, childNode0, childNode1) {

    const ax0 = daNode.read_x0(dataView, childNode0);
    const ay0 = daNode.read_y0(dataView, childNode0);
    const az0 = daNode.read_z0(dataView, childNode0);
    const ax1 = daNode.read_x1(dataView, childNode0);
    const ay1 = daNode.read_y1(dataView, childNode0);
    const az1 = daNode.read_z1(dataView, childNode0);

    const bx0 = daNode.read_x0(dataView, childNode1);
    const by0 = daNode.read_y0(dataView, childNode1);
    const bz0 = daNode.read_z0(dataView, childNode1);
    const bx1 = daNode.read_x1(dataView, childNode1);
    const by1 = daNode.read_y1(dataView, childNode1);
    const bz1 = daNode.read_z1(dataView, childNode1);

    const x0 = Math.min(ax0, bx0);
    const y0 = Math.min(ay0, by0);
    const z0 = Math.min(az0, bz0);

    const x1 = Math.max(ax1, bx1);
    const y1 = Math.max(ay1, by1);
    const z1 = Math.max(az1, bz1);

    daNode.write_x0(dataView, binaryNode, x0);
    daNode.write_y0(dataView, binaryNode, y0);
    daNode.write_z0(dataView, binaryNode, z0);
    daNode.write_x1(dataView, binaryNode, x1);
    daNode.write_y1(dataView, binaryNode, y1);
    daNode.write_z1(dataView, binaryNode, z1);
}


BinaryBVH.prototype.unsortedBuiltIntermediate = function () {
    const dataView = this.dataView;

    const nodeCount = this.binaryNodeCount;

    let level = Math.floor(Math.log(nodeCount) / Math.log(2));

    const leafNodeByteSize = this.leafNodeByteSize;
    const binaryNodeByteSize = this.binaryNodeByteSize;

    let i, offset, levelNodeCount;
    //NOTE: building first level separately allows to avoid some switching logic needed to determine what is the type of lower level node
    //build one level above leaf nodes
    levelNodeCount = Math.pow(2, level);
    offset = ((levelNodeCount >> 1) - 1) * binaryNodeByteSize;


    for (i = 0; i < levelNodeCount; i++) {
        const leafIndex0 = i * 2;
        let leafIndex1 = leafIndex0 + 1;

        let leafOffset0 = this.leafNodesOffset + leafIndex0 * leafNodeByteSize;
        const leafOffset1 = this.leafNodesOffset + leafIndex1 * leafNodeByteSize;

        if (leafIndex1 >= this.totalByteSize) {
            leafIndex1 = -1;
            if (leafOffset0 >= this.totalByteSize) {
                leafOffset0 = -1;
            }
        }

        binaryNodeSetChildren(dataView, offset, leafOffset0, leafIndex1);

        if (leafIndex1 < this.leafNodeCount) {
            binaryNodeRefit(dataView, offset, leafOffset0, leafOffset1);
        } else if (leafIndex0 < this.leafNodeCount) {
            copyBox(leafOffset0, offset, dataView);
        } else {
            //don't care about the rest of the nodes
        }

        offset += binaryNodeByteSize;
    }

    level--;

    //build intermediate nodes
    for (; level > 0; level--) {
        levelNodeCount = Math.pow(2, level);
        offset = ((levelNodeCount >> 1) - 1) * binaryNodeByteSize;

        const childrenOffset = levelNodeCount * binaryNodeByteSize;

        for (i = 0; i < levelNodeCount; i++) {
            const childNode0 = childrenOffset + i * 2 * binaryNodeByteSize;
            const childNode1 = childNode0 + binaryNodeByteSize;

            binaryNodeSetChildren(dataView, offset, childNode0, childNode1);
            binaryNodeRefit(dataView, offset, childNode0, childNode1);

            offset += binaryNodeByteSize;
        }
    }

    //build root
    binaryNodeSetChildren(dataView, 0, binaryNodeByteSize, binaryNodeByteSize * 2);
    binaryNodeRefit(dataView, 0, binaryNodeByteSize, binaryNodeByteSize * 2);

    //set bounds of the bvh
    this.x0 = daNode.read_x0(dataView, 0);
    this.y0 = daNode.read_y0(dataView, 0);
    this.z0 = daNode.read_z0(dataView, 0);
    this.x1 = daNode.read_x1(dataView, 0);
    this.y1 = daNode.read_y1(dataView, 0);
    this.z1 = daNode.read_z1(dataView, 0);
};

BinaryBVH.prototype.setLeafs = function (visitor) {

    const leafNodesOffset = this.leafNodesOffset;

    const leafNodeByteSize = sNodeLeaf.byteSize;

    let byteOffset = leafNodesOffset;

    const dataView = this.dataView;

    let i = 0;
    const l = this.leafNodeCount;
    for (; i < l; i++) {
        const valueToStore = visitor(i, byteOffset, dataView, daNodeLeaf);

        daNodeLeaf.write_type(dataView, byteOffset, NodeType.LEAF);
        daNodeLeaf.write_index(dataView, byteOffset, valueToStore);

        byteOffset += leafNodeByteSize;
    }
    this.unsortedBuiltIntermediate();
};

BinaryBVH.prototype.traversePreOrder = function (visitor, address, type) {
    const dataView = this.dataView;
    const carryOn = visitor(address, type);
    if (carryOn !== false) {

        const leftAddress = daNodeLeaf.read_left(dataView, address);
        const rightAddress = daNodeLeaf.read_right(dataView, address);
        //left
        if (leftAddress >= 0) {
            const leftType = daNode.read_type(dataView, leftAddress);
            if (leftType === NodeType.BINARY) {
                this.traversePreOrder(visitor, leftAddress, leftType);
            } else if (leftType === NodeType.LEAF) {
                visitor(leftAddress, leftType);
            }
        }
        //right
        if (rightAddress >= 0) {
            const rightType = daNode.read_type(dataView, rightAddress);
            if (rightType === NodeType.BINARY) {
                this.traversePreOrder(visitor, rightAddress, rightType);
            } else if (rightType === NodeType.LEAF) {
                visitor(rightAddress, rightType);
            }
        }
    }
};

BinaryBVH.prototype.traverseRayLeafIntersections = function (startX, startY, startZ, directionX, directionY, directionZ, visitor) {

    const dataView = this.dataView;

    this.traversePreOrder(function (address, type) {
        const x0 = daNode.read_x0(dataView, address);
        const y0 = daNode.read_y0(dataView, address);
        const z0 = daNode.read_z0(dataView, address);

        const x1 = daNode.read_x1(dataView, address);
        const y1 = daNode.read_y1(dataView, address);
        const z1 = daNode.read_z1(dataView, address);

        let b = intersectRay(x0, y0, z0, x1, y1, z1, startX, startY, startZ, directionX, directionY, directionZ);

        if (!b) {
            return false;
        }

        if (type === NodeType.LEAF) {
            const value = daNodeLeaf.read_index(dataView, address);
            visitor(value, address, type);
            return false;
        } else {
            return true;
        }
    });
};

export default BinaryBVH;