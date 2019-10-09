import {
    BufferGeometry,
    InstancedBufferAttribute,
    InstancedBufferGeometry,
    MeshDepthMaterial,
    RGBADepthPacking
} from 'three';
import ThreeFactory from "../../three/ThreeFactory";

/**
 *
 * @constructor
 */
function InstancedMeshGroup() {
    this.__threeGeometry = null;
    this.__threeInstanceGeometry = null;

    this.count = 0;
    this.capacity = 0;

    this.growFactor = 1.1;
    /**
     * Minimum spare capacity increase during growing
     * @type {number}
     */
    this.growConstant = 1;

    this.shrinkFactor = 0.8;
    /**
     * Minimum capacity reduction for shrinkage to occur
     * @type {number}
     */
    this.shrinkConstant = 10;

    this.__attributePosition = null;
    this.__attributeRotation = null;
    this.__attributeScale = null;

    this.__material = null;

    this.indices = [];
    this.references = [];

    this.mesh = ThreeFactory.createMesh();
}

/**
 *
 * @param {THREE.BufferGeometry} geometry
 */
InstancedMeshGroup.prototype.setGeometry = function (geometry) {
    if (!(geometry instanceof BufferGeometry)) {
        throw new Error(`Expected THREE.BufferedGeometry, got something else instead.`);
    }

    this.__threeInstanceGeometry = geometry;

    this.build();
};

/**
 *
 * @param {THREE.Material} sourceMaterial
 */
InstancedMeshGroup.prototype.setMaterial = function (sourceMaterial) {
    const material = sourceMaterial.clone();

    const preamble = `
    attribute vec3 instancePosition;
    attribute vec4 instanceRotation;
    attribute vec3 instanceScale;
    
    vec3 instanceTransform( in vec3 position, vec3 T, vec4 R, vec3 S ){
        vec3 result = position;
        
        //applies the scale
        result *= S;
        //computes the rotation where R is a (vec4) quaternion
        result += 2.0 * cross( R.xyz, cross( R.xyz, result ) + R.w * result );
        //translates the transformed 'blueprint'
        result += T;
        
        return result;
    }
    
    mat4 getInstanceMatrix(){
      vec4 q = instanceRotation;
      vec3 s = instanceScale;
      vec3 v = instancePosition;

      vec3 q2 = q.xyz + q.xyz;
      vec3 a = q.xxx * q2.xyz;
      vec3 b = q.yyz * q2.yzz;
      vec3 c = q.www * q2.xyz;
    
      vec3 r0 = vec3( 1.0 - (b.x + b.z) , a.y + c.z , a.z - c.y ) * s.xxx;
      vec3 r1 = vec3( a.y - c.z , 1.0 - (a.x + b.z) , b.y + c.x ) * s.yyy;
      vec3 r2 = vec3( a.z + c.y , b.y - c.x , 1.0 - (a.x + b.x) ) * s.zzz;
    
      return mat4(
          r0 , 0.0,
          r1 , 0.0,
          r2 , 0.0,
          v  , 1.0
      );
    }\n`;

    function rewriteMaterial(shader) {
        const originalVertexShader = shader.vertexShader;
        const newVertexShader = preamble
            + originalVertexShader.replace('#include <begin_vertex>', [
                'vec3 transformed = instanceTransform( position, instancePosition, instanceRotation, instanceScale);'
            ].join('\n'));

        shader.vertexShader = newVertexShader;
    }

    material.onBeforeCompile = rewriteMaterial;

    //we need a custom depth material to ensure shadows will be drawn correctly
    const depthMaterial = new MeshDepthMaterial({
        depthPacking: RGBADepthPacking,
        alphaTest: 0.1
    });
    depthMaterial.onBeforeCompile = rewriteMaterial;


    this.__material = material;

    this.mesh.material = material;
    this.mesh.customDepthMaterial = depthMaterial;
};

InstancedMeshGroup.prototype.setCapacity = function (size) {
    this.capacity = size;
    this.build();
};

InstancedMeshGroup.prototype.ensureCapacity = function (size) {
    const currentCapacity = this.capacity;
    if (currentCapacity < size) {
        const newCapacityRaw = Math.max(size, currentCapacity * this.growFactor, currentCapacity + this.growConstant);
        const newCapacityInteger = Math.ceil(newCapacityRaw);
        this.setCapacity(newCapacityInteger);
    } else if (currentCapacity * this.shrinkFactor > size && currentCapacity - this.shrinkConstant > size) {
        this.setCapacity(size);
    }
};

/**
 *
 * @param {number} index
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
InstancedMeshGroup.prototype.setPositionAt = function (index, x, y, z) {
    this.__attributePosition.setXYZ(index, x, y, z);
    this.__attributePosition.needsUpdate = true;
};

/**
 *
 * @param {number} index
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} w
 */
InstancedMeshGroup.prototype.setRotationAt = function (index, x, y, z, w) {
    this.__attributeRotation.setXYZW(index, x, y, z, w);
    this.__attributeRotation.needsUpdate = true;
};

/**
 *
 * @param {number} index
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
InstancedMeshGroup.prototype.setScaleAt = function (index, x, y, z) {
    this.__attributeScale.setXYZ(index, x, y, z);
    this.__attributeScale.needsUpdate = true;
};

/**
 * Swap position in attribute arrays of two elements
 * @param {int} indexA
 * @param {int} indexB
 */
InstancedMeshGroup.prototype.swap = function (indexA, indexB) {
    throw new Error('Not Implemented Yet');
};

/**
 *
 * @param {int} size
 */
InstancedMeshGroup.prototype.setCount = function (size) {
    this.ensureCapacity(size);

    this.count = size;
    this.__threeGeometry.maxInstancedCount = size;
};

/**
 *
 * @param {int} reference
 * @returns {int}
 */
InstancedMeshGroup.prototype.add = function (reference) {
    //get index
    const index = this.count;
    //grow
    this.setCount(this.count + 1);

    this.indices[reference] = index;
    this.references[index] = reference;

    return index;
};

/**
 *
 * @param {function(index:int,reference:int)} visitor
 */
InstancedMeshGroup.prototype.traverseReferences = function (visitor) {
    this.indices.forEach(visitor);
};

/**
 *
 * @param {int} reference
 */
InstancedMeshGroup.prototype.remove = function (reference) {
    //dereference
    const index = this.indices[reference];

    if (index === undefined) {
        //reference is not known
        throw new Error(`Reference '${reference}' was not found`);
    }

    delete this.indices[reference];

    const lastIndex = this.count - 1;

    if (index === lastIndex) {
        //easy case, reference is placed at the end, no swap needed, we can just forget about it
        delete this.references[index];
    } else {
        //not at the end, move end reference to this place
        const index3 = index * 3;
        const start3 = lastIndex * 3;
        const end3 = start3 + 3;

        const index4 = index * 4;
        const start4 = lastIndex * 4;
        const end4 = start4 + 4;

        this.__attributePosition.array.copyWithin(index3, start3, end3);
        this.__attributeRotation.array.copyWithin(index4, start4, end4);
        this.__attributeScale.array.copyWithin(index3, start3, end3);

        this.__attributePosition.needsUpdate = true;
        this.__attributeRotation.needsUpdate = true;
        this.__attributeScale.needsUpdate = true;

        //update moved reference index
        const movedReference = this.references[lastIndex];

        if (movedReference === undefined) {
            //moved reference not found
            throw new Error(`Moved reference was not found`);
        }

        delete this.references[lastIndex];

        //assume the place of removed reference
        this.references[index] = movedReference;
        this.indices[movedReference] = index;
    }

    //update size
    this.setCount(this.count - 1);
};

function copyArray(source, target) {
    target.set(source.subarray(0, Math.min(target.length, source.length)), 0)
}

InstancedMeshGroup.prototype.build = function () {
    this.__threeGeometry = new InstancedBufferGeometry();

    const instance = this.__threeInstanceGeometry;
    const geometry = this.__threeGeometry;

    geometry.maxInstancedCount = this.count;
    geometry.dynamic = true;

    //copy instance attributes
    geometry.index = instance.index;
    for (let attributeName in instance.attributes) {
        if (!instance.attributes.hasOwnProperty(attributeName)) {
            continue;
        }

        geometry.attributes[attributeName] = instance.attributes[attributeName];
    }

    //build instanced attributes
    const newPositionArray = new Float32Array(this.capacity * 3);
    const newRotationArray = new Float32Array(this.capacity * 4);
    const newScaleArray = new Float32Array(this.capacity * 3);

    if (this.__attributePosition !== null) {
        //copy old data
        const oldPositionArray = this.__attributePosition.array;
        copyArray(oldPositionArray, newPositionArray);
    }
    if (this.__attributeRotation !== null) {
        //copy old data
        const oldRotationArray = this.__attributeRotation.array;
        copyArray(oldRotationArray, newRotationArray);
    }
    if (this.__attributeScale !== null) {
        const oldScaleArray = this.__attributeScale.array;
        copyArray(oldScaleArray, newScaleArray);

        if (newScaleArray.length > oldScaleArray.length) {
            //fill the rest of the array with scale factor of 1 as a default
            newScaleArray.fill(1, oldScaleArray.length);
        }
    }

    //rewrite old attributes
    this.__attributePosition = new InstancedBufferAttribute(newPositionArray, 3);
    this.__attributeRotation = new InstancedBufferAttribute(newRotationArray, 4);
    this.__attributeScale = new InstancedBufferAttribute(newScaleArray, 3);

    //add attributes to newly created geometry
    geometry.addAttribute("instancePosition", this.__attributePosition);
    geometry.addAttribute("instanceRotation", this.__attributeRotation);
    geometry.addAttribute("instanceScale", this.__attributeScale);


    this.mesh.geometry = geometry;
};

export { InstancedMeshGroup };
