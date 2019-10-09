/**
 *
 * @enum {number}
 */
import IdPool from "../../../../core/IdPool";
import { BufferAttribute, BufferGeometry, InstancedBufferAttribute, InstancedBufferGeometry } from "three";
import ObservedValue from "../../../../core/model/ObservedValue";


/**
 *
 * @enum {number}
 */
const ParticleDataType = {
    Float32: 0,
    Float64: 1,
    Uint8: 2
};

/**
 *
 * @enum {number}
 */
const ParticleAttributeType = {
    Scalar: 1,
    Vector2: 2,
    Vector3: 3,
    Vector4: 4
};

/**
 *
 * @enum {number}
 */
const OperationType = {
    Remove: 0,
    Add: 1,
    WriteAttribute: 2
};

/**
 *
 * @param {OperationType} operator
 * @param {Array} operands
 * @constructor
 */
function Operation(operator, operands) {
    /**
     *
     * @type {OperationType}
     */
    this.operator = operator;
    /**
     *
     * @type {Array}
     */
    this.operands = operands;
}

/**
 *
 * @param {ParticleAttributeType} type
 */
export function itemSizeFromAttributeType(type) {
    switch (type) {
        case ParticleAttributeType.Scalar:
            return 1;
        case ParticleAttributeType.Vector2:
            return 2;
        case ParticleAttributeType.Vector3:
            return 3;
        case ParticleAttributeType.Vector4:
            return 4;
        default:
            throw new Error(`Unsupported attribute type: ${type}`);
    }
}

/**
 *
 * @param {ParticleDataType} type
 * @returns {*}
 */
export function typedArrayConstructorFromDataType(type) {
    switch (type) {
        case ParticleDataType.Float32:
            return Float32Array;
        case ParticleDataType.Float64:
            return Float64Array;
        case ParticleDataType.Uint8:
            return Uint8Array;
        default:
            throw new Error(`Unsupported type: ${type}`);
    }
}

/**
 *
 * @param {ParticleSpecification} spec
 * @param {boolean} [instanced=false]
 * @constructor
 */
function ParticleGroup(spec, instanced = false) {
    this.instanced = instanced;
    /**
     *
     * @type {ParticleSpecification}
     */
    this.spec = spec;

    this.attributes = [];

    /**
     *
     * @type {ObservedValue<BufferGeometry>}
     */
    this.geometry = new ObservedValue(null);

    /**
     *
     * @type {int}
     */
    this.size = 0;

    /**
     *
     * @type {int}
     */
    this.capacity = 100;

    this.growFactor = 1.1;
    this.shrinkFactor = 0.9;

    this.referenceIndexLookup = new Map();
    this.indexReferenceLookup = [];

    /**
     *
     * @type {Array.<Operation>}
     */
    this.commandQueue = [];

    this.referencePool = new IdPool();

    this.build();
}

/**
 *
 * @param {Float64Array|Float32Array|Uint32Array|Uint16Array|Uint8Array|Int32Array|Int16Array|Int8Array} array
 * @param {int} itemSize
 * @returns {InstancedBufferAttribute|BufferAttribute}
 */
ParticleGroup.prototype.buildNewBufferAttribute = function (array, itemSize) {
    if (this.instanced) {
        return new InstancedBufferAttribute(array, itemSize);
    } else {
        return new BufferAttribute(array, itemSize);
    }
};

/**
 *
 * @returns {InstancedBufferGeometry|BufferGeometry}
 */
ParticleGroup.prototype.buildNewGeometry = function () {
    if (this.instanced) {
        const result = new InstancedBufferGeometry();
        result.maxInstanceCount = this.capacity;
        return result;
    } else {
        return new BufferGeometry();
    }
};

ParticleGroup.prototype.build = function () {
    const geometry = this.buildNewGeometry();
    geometry.dynamic = true;

    const l = this.spec.attributes.length;
    for (let i = 0; i < l; i++) {

        /**
         * @type {ParticleAttribute}
         */
        const attributeSpec = this.spec.attributes[i];

        const itemSize = itemSizeFromAttributeType(attributeSpec.type);
        const TypedArrayConstructor = typedArrayConstructorFromDataType(attributeSpec.dataType);

        const newArrayLength = itemSize * this.capacity;
        const newArray = new TypedArrayConstructor(newArrayLength);

        const attribute = this.attributes[i];
        if (attribute !== undefined && attribute.count !== 0) {
            //copy old data
            newArray.set(attribute.array.subarray(0, Math.min(newArrayLength, attribute.array.length)));
        }

        const newAttribute = this.buildNewBufferAttribute(newArray, itemSize);

        newAttribute.dynamic = true;
        newAttribute.name = attributeSpec.name;

        this.attributes[i] = newAttribute;

        geometry.addAttribute(attributeSpec.name, newAttribute);
    }

    this.geometry.set(geometry);
};

/**
 * attributes can not grow, this means that we need to rebuild entire geometry if we want to make that happen
 */
ParticleGroup.prototype.setCapacity = function (maxSize) {
    if (this.capacity === maxSize) {
        //do nothing
        return;
    }

    if (this.size > maxSize) {
        throw new Error(`Attempted to resize capacity to ${maxSize}. Can't set capacity below current size(=${this.size}).`);
    }

    // console.log(`capacity resized from ${this.capacity} to ${maxSize}`);

    this.capacity = maxSize;
    this.build();
};

ParticleGroup.prototype.reset = function () {
    this.commandQueue = [];
    this.size = 0;

    this.referenceIndexLookup.clear();
    this.indexReferenceLookup = [];
    this.referencePool.reset();

    this.setCapacity(100);
};

/**
 * Flush command queue
 * @returns {boolean} true if some operations were executed, false otherwise
 */
ParticleGroup.prototype.update = function () {
    this.optimizeCommandQueue();
    const numOperations = this.commandQueue.length;
    for (let i = 0; i < numOperations; i++) {
        const operation = this.commandQueue[i];
        this.executeOperation(operation);
    }
    //clear out the queue
    this.commandQueue = [];

    return numOperations > 0;
};

ParticleGroup.prototype.optimizeCommandQueue = function () {
    const queue = this.commandQueue;

    /**
     * TODO this is pretty slow and should be optimized
     * @param {Array.<Operation>} queue
     */
    function cutRedundantOperations(queue) {
        const queueLength = queue.length;
        loop_Main: for (let i = queueLength - 1; i >= 0; i--) {
            const opA = queue[i];
            if (opA.operator === OperationType.Add) {
                //nothing to do
                continue;
            }
            const operandsA = opA.operands;
            if (opA.operator === OperationType.Remove) {
                //hunt and delete operations before this remove that affect deleted references
                for (let k = 0, kl = operandsA.length; k < kl; k++) {
                    const refA = operandsA[k];

                    //walk the queue back and remove all previous operations on these references
                    loop_B: for (let j = i - 1; j >= 0; j--) {
                        const opB = queue[j];
                        const operandsB = opB.operands;
                        const operatorB = opB.operator;
                        if (operatorB === OperationType.WriteAttribute) {
                            const refB = operandsB[0];
                            if (refA === refB) {
                                //cut operation
                                queue.splice(j, 1);
                                i--;
                            }
                        } else if (operatorB === OperationType.Add) {
                            for (let m = 0, ml = operandsB.length; m < ml; m++) {
                                const refB = operandsB[m];
                                if (refA === refB) {
                                    let jump = 0;
                                    //delete operation and add operation cancel each other out
                                    if (kl > 1) {
                                        operandsA.splice(k, 1);
                                        kl--;
                                        k--;
                                    } else {
                                        queue.splice(i, 1);
                                        i--;
                                        jump |= 2;
                                    }

                                    if (ml > 1) {
                                        operandsB.splice(m, 1);
                                        m--;
                                        ml--;
                                    } else {
                                        //cut operation from the queue
                                        queue.splice(j, 1);
                                        i--;
                                        jump |= 1;
                                    }

                                    if ((jump & 2) !== 0) {
                                        continue loop_Main;
                                    } else if (jump !== 0) {
                                        continue loop_B;
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (opA.operator === OperationType.WriteAttribute) {
                //find other operations that modify the same attribute, any previous operations are redundant at this point
                const refA = operandsA[0];
                const attributeIndexA = operandsA[1];
                //walk the queue back and remove all previous operations on these references
                for (let j = i - 1; j >= 0; j--) {
                    const opB = queue[j];
                    if (opB.operator !== OperationType.WriteAttribute) {
                        //ignore
                        continue;
                    }

                    const operandsB = opB.operands;
                    if (operandsB[0] === refA && operandsB[1] === attributeIndexA) {
                        //operation will be overwritten anyway, cut it
                        queue.splice(j, 1);
                        i--;
                    }
                }
            }
        }
    }

    /**
     *
     * @param {Array.<Operation>} queue
     */
    function groupOperations(queue) {
        let l = queue.length;
        for (let i = 0; i < l; i++) {
            const opA = queue[i];
            const operatorA = opA.operator;
            const operandsA = opA.operands;
            if (operatorA === OperationType.Add || operatorA === OperationType.Remove) {
                for (let j = i + 1; j < l; j++) {
                    const opB = queue[j];
                    if (opB.operator === operatorA) {
                        const operandsB = opB.operands;
                        const numOperands = operandsB.length;

                        for (let k = 0; k < numOperands; k++) {
                            const refB = operandsB[k];
                            if (operandsA.indexOf(refB) === -1) {
                                operandsA.push(refB);
                            }
                        }

                        queue.splice(j, 1);
                        j--;
                        l--;
                    }
                }
            }
        }
    }

    /**
     * @param {Array.<Operation>} queue
     */
    function sortOperations(queue) {
        queue.sort(function (a, b) {
            const operatorA = a.operator;
            const operatorB = b.operator;

            //it's important that Add and Remove operations are sorted to the front of the queue, before Write operations
            if (operatorA < operatorB) {
                return -1;
            } else if (operatorB > operatorA) {
                return 1;
            }

            if (operatorA !== OperationType.WriteAttribute) {
                return 0;
            }

            const attributeIndexA = a.operands[1];
            const attributeIndexB = b.operands[1];

            //sort write operations by buffer index
            return attributeIndexB - attributeIndexA;
        });
    }

    cutRedundantOperations(queue);
    groupOperations(queue);
    sortOperations(queue);
};

/**
 *
 * @param {number} id
 */
ParticleGroup.prototype.createSpecific = function (id) {
    const reference = this.referencePool.getSpecific(id);

    this.commandQueue.push(new Operation(OperationType.Add, [reference]));
};

/**
 * NOTE: Deferred operation, required update before results can be observed
 * @returns {number} particle reference
 */
ParticleGroup.prototype.create = function () {
    //reserve reference
    const reference = this.referencePool.get();

    this.commandQueue.push(new Operation(OperationType.Add, [reference]));

    return reference;
};

/**
 * NOTE: Deferred operation, required update before results can be observed
 */
ParticleGroup.prototype.remove = function (reference) {
    this.commandQueue.push(new Operation(OperationType.Remove, [reference]));
};

/**
 * NOTE: this method does not take pending operations into account
 * @param reference
 */
ParticleGroup.prototype.contains = function (reference) {
    return this.referenceIndexLookup.has(reference);
};

ParticleGroup.prototype.traverseReferences = function (visitor) {
    this.referenceIndexLookup.forEach(function (value, key) {
        visitor(key);
    });
};

/**
 * NOTE: Deferred operation, required update before results can be observed
 * @param {int} reference
 * @param {int} attributeIndex Index of attribute to be written
 * @param {Array.<number>} value
 */
ParticleGroup.prototype.writeAttribute = function (reference, attributeIndex, value) {
    this.commandQueue.push(new Operation(OperationType.WriteAttribute, [reference, attributeIndex, value]));
};

/**
 *
 * @param {number} index
 * @param {number} attributeIndex
 * @param {Array|Float32Array|Float64Array|Uint8Array} result
 */
ParticleGroup.prototype.readAttributeByIndex = function (index, attributeIndex, result) {
    const attribute = this.attributes[attributeIndex];

    const itemSize = attribute.itemSize;

    const offset = index * itemSize;

    for (let i = 0; i < itemSize; i++) {
        const element = attribute.array[offset + i];
        result[i] = element;
    }
};

ParticleGroup.prototype.readAttribute = function (reference, attributeIndex, result) {
    //dereference
    const index = this.referenceIndexLookup.get(reference);

    this.readAttributeByIndex(index, attributeIndex, result);
};
/**
 * Produces reference of a particle by its index
 * @param {number} index
 * @returns {number}
 */
ParticleGroup.prototype.referenceByIndex = function (index) {
    return this.indexReferenceLookup[index];
};

ParticleGroup.prototype.createImmediate = function () {
    const reference = this.referencePool.get();
    this.executeOperationAdd([reference]);

    return reference;
};

ParticleGroup.prototype.executeOperationAdd = function (references) {

    const numAdded = references.length;

    for (let i = 0; i < numAdded; i++) {
        const reference = references[i];
        const index = this.size + i;

        this.referenceIndexLookup.set(reference, index);
        this.indexReferenceLookup[index] = reference;
    }

    this.grow(numAdded);
};

ParticleGroup.prototype.executeOperationRemove = function (references) {
    const numRemoved = references.length;

    const deleteIndices = [];

    for (let i = 0; i < numRemoved; i++) {
        const reference = references[i];
        const index = this.referenceIndexLookup.get(reference);

        this.referenceIndexLookup.delete(reference);

        deleteIndices.push(index);

        //release reference
        this.referencePool.release(reference);
    }

    this.deleteIndices(deleteIndices);
};

/**
 *
 * @param reference
 * @param attributeIndex
 * @param {number[]} value
 */
ParticleGroup.prototype.executeOperationWriteAttribute = function (reference, attributeIndex, value) {

    //de-reference
    const index = this.referenceIndexLookup.get(reference);

    //bind attribute
    const attribute = this.attributes[attributeIndex];

    attribute.array.set(value, index * attribute.itemSize);

    attribute.needsUpdate = true;
    //TODO: set update range on the attribute
};

/**
 *
 * @param reference
 * @param attributeIndex
 * @param {number} value
 */
ParticleGroup.prototype.executeOperationWriteAttribute_Scalar = function (reference, attributeIndex, value) {
    //de-reference
    const index = this.referenceIndexLookup.get(reference);

    //bind attribute
    const attribute = this.attributes[attributeIndex];

    attribute.array[index] = value;

    attribute.needsUpdate = true;
    //TODO: set update range on the attribute
};

/**
 *
 * @param reference
 * @param attributeIndex
 * @param x
 * @param y
 * @param z
 */
ParticleGroup.prototype.executeOperationWriteAttribute_Vector3 = function (reference, attributeIndex, x, y, z) {
    //de-reference
    const index = this.referenceIndexLookup.get(reference);

    //bind attribute
    const attribute = this.attributes[attributeIndex];

    const address = index * 3;

    const array = attribute.array;

    array[address] = x;
    array[address + 1] = y;
    array[address + 2] = z;

    attribute.needsUpdate = true;
    //TODO: set update range on the attribute
};

/**
 *
 * @param reference
 * @param attributeIndex
 * @param x
 * @param y
 * @param z
 * @param w
 */
ParticleGroup.prototype.executeOperationWriteAttribute_Vector4 = function (reference, attributeIndex, x, y, z, w) {
    //de-reference
    const index = this.referenceIndexLookup.get(reference);

    //bind attribute
    const attribute = this.attributes[attributeIndex];

    const address = index * 4;

    const array = attribute.array;

    array[address] = x;
    array[address + 1] = y;
    array[address + 2] = z;
    array[address + 3] = w;

    attribute.needsUpdate = true;
    //TODO: set update range on the attribute
};

/**
 *
 * @param {Operation} operation
 */
ParticleGroup.prototype.executeOperation = function (operation) {
    const operands = operation.operands;

    const self = this;

    function _writeAttribute(operands) {
        const reference = operands[0];
        const attributeIndex = operands[1];
        const value = operands[2];

        self.executeOperationWriteAttribute(reference, attributeIndex, value);
    }

    switch (operation.operator) {
        case OperationType.Add:
            this.executeOperationAdd(operands);
            break;

        case OperationType.Remove:
            this.executeOperationRemove(operands);
            break;

        case OperationType.WriteAttribute:
            _writeAttribute(operands);
            break;

        default:
            throw new Error(`Unsupported operator: ${operation.operator}`);
    }
};

/**
 *
 * @param {Array.<int>} indices
 */
ParticleGroup.prototype.deleteIndices = function (indices) {
    const deleteCount = indices.length;

    if (deleteCount <= 0) {
        //nothing to do
        return;
    }

    const oldSize = this.size;
    const newSize = oldSize - deleteCount;

    //sort indices
    indices.sort();

    const specAttributes = this.spec.attributes;
    const numAttributes = specAttributes.length;

    let numSwapElements = 0;
    const swaps = [];
    let swapDestination = this.size - 1;

    let i, j;

    for (i = deleteCount - 1; i >= 0; i--) {
        const victim = indices[i];

        if (swapDestination === victim) {
            swapDestination--;
        }

        if (victim >= newSize) {
            //is beyond the end of the new array and will be removed anyway, no need to swap
            continue;
        }

        swaps.push(victim, swapDestination);
        numSwapElements += 2;
    }


    for (i = 0; i < numAttributes; i++) {
        const attribute = this.attributes[i];

        const itemSize = attribute.itemSize;

        const oldArray = attribute.array;

        //do swaps in the old array
        for (j = 0; j < numSwapElements; j += 2) {
            const targetIndex = swaps[j] * itemSize;
            const sourceIndex = swaps[j + 1] * itemSize;

            oldArray.copyWithin(targetIndex, sourceIndex, sourceIndex + itemSize);
        }

        attribute.needsUpdate = true;
    }

    //update references

    for (j = 0; j < numSwapElements; j += 2) {
        const targetIndex = swaps[j];
        const sourceIndex = swaps[j + 1];

        const ref = this.indexReferenceLookup[sourceIndex];
        //move reference
        this.indexReferenceLookup[targetIndex] = ref;
        //this reference will be getting a new index
        this.referenceIndexLookup.set(ref, targetIndex);
    }

    //cut tail of index lookup
    for (i = 0; i < deleteCount; i++) {
        this.indexReferenceLookup.pop();
    }

    this.setSize(newSize);
};

/**
 * Swap two particles identified by index
 * @param {number} indexA
 * @param {number} indexB
 */
ParticleGroup.prototype.swap = function (indexA, indexB) {
    const attributes = this.attributes;
    const numAttributes = attributes.length;

    let i, j;

    for (i = 0; i < numAttributes; i++) {
        const attribute = attributes[i];

        const itemSize = attribute.itemSize;

        const offsetA = indexA * itemSize;
        const offsetB = indexB * itemSize;

        const array = attribute.array;

        for (j = 0; j < itemSize; j++) {
            const addressA = offsetA + j;
            const addressB = offsetB + j;

            const elementA = array[addressA];

            array[addressA] = array[addressB];

            array[addressB] = elementA;
        }

        attribute.needsUpdate = true;
    }


};

/**
 *
 * @param {int} numAdded
 */
ParticleGroup.prototype.grow = function (numAdded) {
    const oldSize = this.size;
    const newSize = oldSize + numAdded;

    this.setSize(newSize);
};


const SHRINK_THRESHOLD = 64;
const GROW_MIN_STEP = 16;

ParticleGroup.prototype.preAllocate = function (itemCount) {
    const newSize = this.size + itemCount;

    if (this.capacity < newSize) {
        this.updateCapacity(newSize);
    }
};

ParticleGroup.prototype.updateCapacity = function (newSize) {

    if (newSize > this.capacity) {
        //grow
        const newCapacity = Math.floor(Math.max(newSize, this.capacity * this.growFactor, this.capacity + GROW_MIN_STEP));
        this.setCapacity(newCapacity);
    } else if (newSize < this.capacity * this.shrinkFactor && newSize < this.capacity - SHRINK_THRESHOLD) {
        //shrink
        this.setCapacity(newSize);
    }

    const geometry = this.geometry.getValue();
    geometry.setDrawRange(0, newSize);
};

/**
 *
 * @param {int} newSize
 */
ParticleGroup.prototype.setSize = function (newSize) {
    this.size = newSize;

    this.updateCapacity(newSize);
};

export {
    ParticleGroup,
    ParticleAttributeType,
    ParticleDataType
};