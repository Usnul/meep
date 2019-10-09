/**
 * Created by Alex on 29/05/2016.
 */
import { intersectRay } from '../AABB3Math';

/**
 *
 * @enum {number}
 */
const NodeType = {
    LEAF: 0,
    BINARY: 1
};


/**
 *
 * @constructor
 */
const IndexedBinaryBVH = function () {
    this.leafNodeCount = 0;
    this.binaryNodeCount = 0;
    this.boxCount = 0;

    /**
     *
     * @type {null|Float32Array}
     */
    this.data = null;
};

/**
 *
 * @param {int} leafCount
 */
IndexedBinaryBVH.prototype.initialize = function (leafCount) {

    const twoLog = Math.log(leafCount) / Math.log(2);

    const twoLeafLimit = Math.pow(2, Math.ceil(twoLog));
    const binaryNodeCount = twoLeafLimit - 1;

    this.leafNodeCount = leafCount;

    this.binaryNodeCount = binaryNodeCount;

    this.boxCount = this.leafNodeCount + this.binaryNodeCount;

    this.data = new Float32Array(this.boxCount * 6);
};

/**
 *
 * @param {Float32Array} array
 * @param {number} address
 * @param {function} callback
 */
function readBox(array, address, callback) {
    callback(
        array[address],
        array[address + 1],
        array[address + 2],
        array[address + 3],
        array[address + 4],
        array[address + 5]
    );
}

/**
 *
 * @param {Float32Array} array
 * @param {number} address
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 */
function writeBox(array, address, x0, y0, z0, x1, y1, z1) {
    array[address] = x0;
    array[address + 1] = y0;
    array[address + 2] = z0;
    array[address + 3] = x1;
    array[address + 4] = y1;
    array[address + 5] = z1;
}

/**
 *
 * @param {number} from
 * @param {number} to
 * @param {Float32Array} array
 */
function copyBox(from, to, array) {
    readBox(array, from, function (x0, y0, z0, x1, y1, z1) {
        writeBox(array, to, x0, y0, z0, x1, y1, z1);
    });
}

/**
 *
 * @param {number} from
 * @param {number} to
 * @param {Float32Array} array
 */
function copyBoxZeroSize(from, to, array) {
    readBox(array, from, function (x0, y0, z0, x1, y1, z1) {
        writeBox(array, to, x0, y0, z0, x0, y0, z0);
    });
}

/**
 *
 * @param {Float32Array} array
 * @param {number} binaryNode
 * @param {number} childNode0
 * @param {number} childNode1
 */
function binaryNodeRefit(array, binaryNode, childNode0, childNode1) {
    readBox(array, childNode0, function (ax0, ay0, az0, ax1, ay1, az1) {
        readBox(array, childNode1, function (bx0, by0, bz0, bx1, by1, bz1) {
            const x0 = Math.min(ax0, bx0);
            const y0 = Math.min(ay0, by0);
            const z0 = Math.min(az0, bz0);

            const x1 = Math.max(ax1, bx1);
            const y1 = Math.max(ay1, by1);
            const z1 = Math.max(az1, bz1);

            writeBox(array, binaryNode, x0, y0, z0, x1, y1, z1);
        });
    });
}


IndexedBinaryBVH.prototype.unsortedBuiltIntermediate = function () {
    const data = this.data;

    const nodeCount = this.binaryNodeCount;

    const leafNodesOffset = this.binaryNodeCount * 6;

    let level = Math.floor(Math.log(nodeCount) / Math.log(2));

    let i, offset, levelNodeCount;
    //NOTE: building first level separately allows to avoid some switching logic needed to determine what is the type of lower level node
    //build one level above leaf nodes
    levelNodeCount = Math.pow(2, level);
    offset = (levelNodeCount - 1) * 6;

    let parentIndex, childIndex0, childIndex1;

    for (i = 0; i < levelNodeCount; i++) {
        const leafIndex0 = i * 2;
        const leafIndex1 = leafIndex0 + 1;

        const leafOffset0 = leafNodesOffset + leafIndex0 * 6;
        const leafOffset1 = leafNodesOffset + leafIndex1 * 6;

        if (leafIndex1 < this.leafNodeCount) {
            binaryNodeRefit(data, offset, leafOffset0, leafOffset1);
        } else if (leafIndex0 < this.leafNodeCount) {
            copyBox(leafOffset0, offset, data);
        } else {
            //initialize to 0-size box same position as previous node
            copyBoxZeroSize(offset - 6, offset, data);
        }

        offset += 6;
    }

    level--;

    //build intermediate nodes
    for (; level >= 0; level--) {
        levelNodeCount = Math.pow(2, level);
        parentIndex = (levelNodeCount - 1);

        for (i = 0; i < levelNodeCount; i++) {

            childIndex0 = (parentIndex << 1) + 1;
            childIndex1 = childIndex0 + 1;

            binaryNodeRefit(data, parentIndex * 6, childIndex0 * 6, childIndex1 * 6);

            parentIndex++;
        }
    }

    //set bounds of the bvh
    const self = this;
    readBox(data, 0, function (x0, y0, z0, x1, y1, z1) {
        self.x0 = x0;
        self.y0 = y0;
        self.z0 = z0;
        self.x1 = x1;
        self.y1 = y1;
        self.z1 = z1;
    });
};

/**
 *
 * @param {function(index:number,offset:number,data:*, writeBox:function):*} visitor
 */
IndexedBinaryBVH.prototype.setLeafs = function (visitor) {
    let offset = this.binaryNodeCount * 6;

    const data = this.data;

    let i = 0;
    const l = this.leafNodeCount;
    for (; i < l; i++) {
        visitor(i, offset, data, writeBox);

        offset += 6;
    }
    this.unsortedBuiltIntermediate();
};

/**
 *
 * @param {function(address:Number,type:NodeType):*} visitor
 * @param {Number} startIndex
 */
IndexedBinaryBVH.prototype.traversePreOrderStack = function (visitor, startIndex) {

    const stack = [startIndex];
    let stackSize = 1;

    const nodeThreshold = this.binaryNodeCount * 6;
    const endAddress = this.boxCount * 6;

    while (stackSize > 0) {

        stackSize--;
        const index = stack.pop();
        const address = index * 6;

        const split = visitor(address, NodeType.BINARY);
        if (split) {

            const leftIndex = (index << 1) + 1;
            const rightIndex = leftIndex + 1;

            const leftAddress = leftIndex * 6;
            const rightAddress = rightIndex * 6;

            //right
            if (rightAddress < endAddress) {
                if (rightAddress < nodeThreshold) {
                    stack.push(rightIndex);
                    stackSize++;
                } else {
                    visitor(rightAddress, NodeType.LEAF);
                }
            }

            //left
            if (leftAddress < endAddress) {
                if (leftAddress < nodeThreshold) {
                    stack.push(leftIndex);
                    stackSize++;
                } else {
                    visitor(leftAddress, NodeType.LEAF);
                }
            }
        }
    }
};

/**
 *
 * @param {function} visitor
 * @param {number} index
 * @param {number} type
 */
IndexedBinaryBVH.prototype.traversePreOrder = function (visitor, index, type) {
    const address = index * 6;
    const carryOn = visitor(address, type);
    const nodeThreshold = this.binaryNodeCount * 6;
    const endAddress = this.boxCount * 6;

    if (carryOn !== false) {

        const leftIndex = (index << 1) + 1;
        const rightIndex = leftIndex + 1;

        const leftAddress = leftIndex * 6;
        const rightAddress = rightIndex * 6;
        //left
        if (leftAddress < endAddress) {
            if (leftAddress < nodeThreshold) {
                this.traversePreOrder(visitor, leftIndex, NodeType.BINARY);
            } else {
                visitor(leftAddress, NodeType.LEAF);
            }
        }
        //right
        if (rightAddress < endAddress) {
            if (rightAddress < nodeThreshold) {
                this.traversePreOrder(visitor, rightIndex, NodeType.BINARY);
            } else {
                visitor(rightAddress, NodeType.LEAF);
            }
        }
    }
};

/**
 *
 * @param {number} startX
 * @param {number} startY
 * @param {number} startZ
 * @param {number} directionX
 * @param {number} directionY
 * @param {number} directionZ
 * @param {function} visitor
 */
IndexedBinaryBVH.prototype.traverseRayLeafIntersections = function (startX, startY, startZ, directionX, directionY, directionZ, visitor) {

    const data = this.data;

    const binaryNodeCount = this.binaryNodeCount;

    let b;

    this.traversePreOrderStack(function (address, type) {
        readBox(data, address, function (x0, y0, z0, x1, y1, z1) {
            b = intersectRay(x0, y0, z0, x1, y1, z1, startX, startY, startZ, directionX, directionY, directionZ);
        });

        if (!b) {
            return false;
        }

        if (type === NodeType.LEAF) {
            const value = address / 6 - binaryNodeCount;
            visitor(value, address, type);
            return false;
        } else {
            return true;
        }
    }, 0);
};

export default IndexedBinaryBVH;
