import { BinaryNode } from "../../core/bvh2/BinaryNode";
import {
    deserializeRowFirstTable,
    RowFirstTable,
    serializeRowFirstTable
} from "../../core/collection/table/RowFirstTable";
import { InstancedMeshGroup } from "../../graphics/geometry/instancing/InstancedMeshGroup";
import Vector3 from "../../core/geom/Vector3";
import { LeafNode } from "../../core/bvh2/LeafNode";
import Vector4 from "../../core/geom/Vector4";

import { BufferGeometry } from 'three';
import { computeGeometryBoundingSphereMiniball } from "../../graphics/Utils.js";
import { DataType } from "../../core/collection/table/DataType";
import { RowFirstTableSpec } from "../../core/collection/table/RowFirstTableSpec";
import { BitSet } from "../../core/binary/BitSet.js";

/**
 * @readonly
 * @type {RowFirstTableSpec}
 */
const dataSpec = new RowFirstTableSpec([
    DataType.Float32, DataType.Float32, DataType.Float32, //position
    DataType.Float32, DataType.Float32, DataType.Float32, DataType.Float32, //rotation
    DataType.Float32, DataType.Float32, DataType.Float32 //scale
]);

/**
 *
 * @constructor
 */
function InstancedFoliage() {
    /**
     * Minimum area on the screen to be occupied by an instance, if instance bounding sphere occupies less than this - it will be culled
     * Measured in pixels
     * @type {number}
     */
    this.minScreenArea = 32;

    /**
     *
     * @type {BinaryNode}
     */
    this.bvh = new BinaryNode();
    this.bvh.setNegativelyInfiniteBounds();

    /**
     *
     * @type {RowFirstTable}
     */
    this.data = new RowFirstTable(dataSpec);

    /**
     *
     * @type {InstancedMeshGroup}
     */
    this.instances = new InstancedMeshGroup();

    this.geometry = null;
    this.instanceBoundingSphere = new Vector4(0, 0, 0, 0);
}

InstancedFoliage.prototype.initialize = function () {

};

/**
 *
 * @param {Vector3} position
 * @param {Quaternion} rotation
 * @param {Vector3} scale
 */
InstancedFoliage.prototype.add = function (position, rotation, scale) {
    const index = this.data.length;

    //update data
    this.data.addRow([
        position.x, position.y, position.z,
        rotation.x, rotation.y, rotation.z, rotation.w,
        scale.x, scale.y, scale.z
    ]);

    const leaf = new LeafNode(
        index,
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY
    );

    //compute bounding box for this instance
    this.expandBoundingBoxForInstance(position, rotation, scale, leaf);

    //insert bounding box into the spatial index
    this.bvh.insertNode(leaf);
};

/**
 *
 * @param {int} index Instance index
 * @param {Vector3} position Position of instance will be read into this vector
 * @param {Quaternion} rotation Rotation of instance will be read into this quaternion
 * @param {Vector3} scale Scale of the instance will be read into this Vector
 */
InstancedFoliage.prototype.read = function (index, position, rotation, scale) {
    const elementData = [];
    //read transform data for instance
    this.data.getRow(index, elementData);

    const positionX = elementData[0];
    const positionY = elementData[1];
    const positionZ = elementData[2];

    const rotationX = elementData[3];
    const rotationY = elementData[4];
    const rotationZ = elementData[5];
    const rotationW = elementData[6];

    const scaleX = elementData[7];
    const scaleY = elementData[8];
    const scaleZ = elementData[9];


    position.set(positionX, positionY, positionZ);

    rotation.set(rotationX, rotationY, rotationZ, rotationW);

    scale.set(scaleX, scaleY, scaleZ);
};

/**
 *
 * @param {AABB3} result
 * @param {Vector3} position
 * @param {Quaternion} rotation
 * @param {Vector3} scale
 */
InstancedFoliage.prototype.expandBoundingBoxForInstance = function (position, rotation, scale, result) {

    const vertexData = this.geometry.attributes.position.array;

    const rXYZ = new Vector3(rotation.x, rotation.y, rotation.z);

    const v = new Vector3(0, 0, 0);

    const c0 = new Vector3(0, 0, 0);
    const c1 = new Vector3(0, 0, 0);
    const c2 = new Vector3(0, 0, 0);

    for (let i = 0, l = vertexData.length; i < l; i += 3) {
        const x = vertexData[i];
        const y = vertexData[i + 1];
        const z = vertexData[i + 2];

        v.set(x, y, z);

        //transform point

        //apply scale
        v.multiply(scale);

        //apply rotation
        c1.copy(v).multiplyScalar(rotation.w);
        c0.copy(rXYZ).cross(v).add(c1);
        c2.copy(rXYZ).cross(c0).multiplyScalar(2);

        v.add(c2);

        //apply translation
        v.add(position);

        result._expandToFitPoint(v.x, v.y, v.z);
    }
};

InstancedFoliage.prototype.computeInstanceBoundingSphere = function () {
    this.instanceBoundingSphere = computeGeometryBoundingSphereMiniball(this.geometry);
};

InstancedFoliage.prototype.setInstance = function (geometry, material) {
    if (material === undefined) {
        throw new Error(`Material is undefined`);
    }

    if (geometry === undefined) {
        throw new Error(`Geometry is undefined`);
    }


    let bufferGeometry;
    if ((geometry instanceof BufferGeometry)) {
        bufferGeometry = geometry;
    } else {
        bufferGeometry = new BufferGeometry();
        bufferGeometry.fromGeometry(geometry);
    }


    this.geometry = bufferGeometry;

    this.instances.setMaterial(material);
    this.instances.setGeometry(bufferGeometry);

    this.computeInstanceBoundingSphere();

    //TODO: compute haul for the mesh, to use for fast AABB computation

};

InstancedFoliage.prototype.deserialize = function (buffer) {
    deserializeRowFirstTable(buffer, this.data);

    const valueByteSize = buffer.readUint8();

    let deserializeLeafValue;

    if (valueByteSize === 1) {
        deserializeLeafValue = deserializeLeafValueUint8;
    } else if (valueByteSize === 2) {
        deserializeLeafValue = deserializeLeafValueUint16;
    } else if (valueByteSize === 4) {
        deserializeLeafValue = deserializeLeafValueUint32;
    } else {
        throw new Error(`Invalid value byteSize '${valueByteSize}'`);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @returns {number}
     */
    function deserializeLeafValueUint8(buffer) {
        return buffer.readUint8();
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @returns {number}
     */
    function deserializeLeafValueUint16(buffer) {
        return buffer.readUint16();
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @returns {number}
     */
    function deserializeLeafValueUint32(buffer) {
        return buffer.readUint32();
    }

    this.bvh.fromBinaryBuffer(buffer, deserializeLeafValue);
};

InstancedFoliage.prototype.serialize = function (buffer) {
    //serialize data
    serializeRowFirstTable(buffer, this.data);

    const numRows = this.data.length;

    let serializeLeafValue;

    let valueByteSize = 0;

    if (numRows < 256) {
        valueByteSize = 1;
        serializeLeafValue = serializeLeafValueUint8
    } else if (numRows <= 65535) {
        valueByteSize = 2;
        serializeLeafValue = serializeLeafValueUint16;
    } else if (numRows <= 4294967295) {
        valueByteSize = 4;
        serializeLeafValue = serializeLeafValueUint32;
    } else {
        throw new Error(`Data is too large to be written (length=${numRows})`);
    }

    buffer.writeUint8(valueByteSize);

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {number} value
     */
    function serializeLeafValueUint8(buffer, value) {
        buffer.writeUint8(value);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {number} value
     */
    function serializeLeafValueUint16(buffer, value) {
        buffer.writeUint16(value);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {number} value
     */
    function serializeLeafValueUint32(buffer, value) {
        buffer.writeUint32(value);
    }

    this.bvh.toBinaryBuffer(buffer, serializeLeafValue);
};

const visibleElementSet = new BitSet();

/**
 *
 * @param {Frustum[]} frustums
 * @param {function[]} [visibilityFilters]
 */
InstancedFoliage.prototype.update = function (frustums, visibilityFilters = []) {
    const instances = this.instances;

    visibleElementSet.reset();

    const elementsToRemove = [];

    const numVisibilityFilters = visibilityFilters.length;

    function visitLeaf(node) {
        const index = node.object;

        for (let i = 0; i < numVisibilityFilters; i++) {
            const visibilityFilter = visibilityFilters[i];
            if (!visibilityFilter(node)) {
                return;
            }
        }

        //TODO check screen space size to decide if element should be seen or not
        visibleElementSet.set(index, true);
    }

    //build visible set
    this.bvh.threeTraverseFrustumsIntersections(frustums, visitLeaf);

    // console.log(`Visible: `, elementsToAdd.size);

    /**
     *
     * @param index
     * @param {int} ref
     */
    function visitInstancedReference(index, ref) {
        if (!visibleElementSet.get(ref)) {
            //no longer visible
            elementsToRemove.push(ref);
        } else {
            //visible, and is already in the group, update the set
            visibleElementSet.set(ref, false);
        }
    }

    //remove those that are no longer visible
    instances.traverseReferences(visitInstancedReference);

    //cull instances that are no longer visible
    for (let i = 0, l = elementsToRemove.length; i < l; i++) {
        const ref = elementsToRemove[i];
        instances.remove(ref);
    }

    const elementData = [];

    const data = this.data;

    //process entities that have become newly visible
    for (let index = visibleElementSet.nextSetBit(0); index !== -1; index = visibleElementSet.nextSetBit(index + 1)) {
        //read transform data for instance
        data.getRow(index, elementData);

        const positionX = elementData[0];
        const positionY = elementData[1];
        const positionZ = elementData[2];

        const rotationX = elementData[3];
        const rotationY = elementData[4];
        const rotationZ = elementData[5];
        const rotationW = elementData[6];

        const scaleX = elementData[7];
        const scaleY = elementData[8];
        const scaleZ = elementData[9];

        const i = instances.add(index);

        //apply instance transforms
        instances.setPositionAt(i, positionX, positionY, positionZ);
        instances.setRotationAt(i, rotationX, rotationY, rotationZ, rotationW);
        instances.setScaleAt(i, scaleX, scaleY, scaleZ);
    }
};


export { InstancedFoliage };
