/**
 * Created by Alex Goldring on 21.02.2015.
 */
import { BufferAttribute, PlaneBufferGeometry } from 'three';
import Vector3 from "../../core/geom/Vector3.js";
import { assert } from "../../core/assert.js";


/**
 *
 * @param bufferGeometry
 * @param index
 * @property {Quad|null} next
 * @property {Quad|null} previous
 * @constructor
 */
function Quad(bufferGeometry, index) {
    this.geometry = bufferGeometry;
    this.index = index;
    this.direction = new Vector3(0, 1, 0);
    //defines a point from which D and C are offset on the same line
    this.position = new Vector3();

    this.next = null;
    this.previous = null;

    this.computePosition();
}

Quad.prototype.computePosition = function () {
    const p = this.position;
    this.getVertexC(p);
    const x = p.x,
        y = p.y,
        z = p.z;
    this.getVertexD(p);
    p.x += x;
    p.y += y;
    p.z += z;
    p.multiplyScalar(0.5);
};

Quad.prototype.setAttributeIndex = function (index, value) {
    const indexBuffer = this.geometry.index;
    const aIndex = indexBuffer.array;
    const offset = (this.index * 6) + index;
    aIndex[offset] = value;
    indexBuffer.needsUpdate = true;
};
Quad.prototype.getAttributeIndex = function (index) {
    const aIndex = this.geometry.index.array;
    const offset = (this.index * 6) + index;
    return aIndex[offset];
};
Quad.prototype.getAttributePosition = function (index, result) {
    const aPosition = this.geometry.attributes.position.array;
    const offset = index * 3;
    result.set(aPosition[offset], aPosition[offset + 1], aPosition[offset + 2]);
};
Quad.prototype.setAttributePosition = function (index, v3) {
    const position = this.geometry.attributes.position;
    const aPosition = position.array;
    const offset = index * 3;
    aPosition[offset] = v3.x;
    aPosition[offset + 1] = v3.y;
    aPosition[offset + 2] = v3.z;
    position.needsUpdate = true;
};
Quad.prototype.setA = function (index) {
    this.setAttributeIndex(0, index);
};
Quad.prototype.setB = function (index) {
    this.setAttributeIndex(1, index);
    this.setAttributeIndex(3, index);
};
Quad.prototype.setC = function (index) {
    this.setAttributeIndex(2, index);
    this.setAttributeIndex(5, index);
};
Quad.prototype.setD = function (index) {
    this.setAttributeIndex(4, index);
};

Quad.prototype.getA = function () {
    return this.getAttributeIndex(0);
};
Quad.prototype.getB = function () {
    return this.getAttributeIndex(1);
};
Quad.prototype.getC = function () {
    return this.getAttributeIndex(2);
};
Quad.prototype.getD = function () {
    return this.getAttributeIndex(4);
};

Quad.prototype.getVertexA = function (result) {
    this.getAttributePosition(this.getA(), result);
};
Quad.prototype.getVertexB = function (result) {
    this.getAttributePosition(this.getB(), result);
};
Quad.prototype.getVertexC = function (result) {
    this.getAttributePosition(this.getC(), result);
};
Quad.prototype.getVertexD = function (result) {
    this.getAttributePosition(this.getD(), result);
};
Quad.prototype.setVertexA = function (value) {
    this.setAttributePosition(this.getA(), value);
};
Quad.prototype.setVertexB = function (value) {
    this.setAttributePosition(this.getB(), value);
};
Quad.prototype.setVertexC = function (value) {
    this.setAttributePosition(this.getC(), value);
};
Quad.prototype.setVertexD = function (value) {
    this.setAttributePosition(this.getD(), value);
};
Quad.prototype.computeDirection = (function () {
    const t0 = new Vector3();
    const t1 = new Vector3();
    const t2 = new Vector3();

    function computeDirection() {
        this.getVertexA(t0);
        this.getVertexB(t1);
        t0.add(t1).multiplyScalar(0.5);

        this.getVertexC(t2);
        this.getVertexD(t1);
        t2.add(t1).multiplyScalar(0.5);

        t2.sub(t0).normalize();

        this.direction.copy(t2);
    }

    return computeDirection;
})();

function fillArray(arr, val) {
    let i = 0;
    const l = arr.length;
    for (; i < l; i++) {
        arr[i] = val;
    }
}

/**
 *
 * @param length
 * @param width
 * @constructor
 */
function Ribbon(length, width) {
    assert.equal(typeof length, "number");
    assert.equal(typeof width, "number");

    const geometry = this.geometry = new PlaneBufferGeometry(length, width, length, 1);

    const position = geometry.attributes.position;
    const opacity = new Float32Array(position.count);

    fillArray(opacity, 1);

    geometry.addAttribute("opacity", new BufferAttribute(opacity, 1));
    //make quads
    this.quads = new Array(length);
    let lastQuad = null;
    for (let i = 0; i < length; i++) {

        const quad = new Quad(geometry, i);

        quad.previous = lastQuad;

        if (lastQuad !== null) {
            lastQuad.next = quad;
        }

        this.quads[i] = quad;

        lastQuad = quad;
    }

    this.__tail = this.quads[0];
    this.__head = this.quads[length - 1];

    this.length = length;
    //this.validate();
}

/**
 *
 * @returns {Quad}
 */
Ribbon.prototype.head = function () {
    return this.__head;
};

/**
 *
 * @returns {Quad}
 */
Ribbon.prototype.tail = function () {
    return this.__tail;
};

/**
 *
 * @param {Vector3} v3
 */
Ribbon.prototype.moveToPoint = function (v3) {
    const position = this.geometry.attributes.position;
    const array = position.array;

    const l = position.count * 3;

    for (let i = 0; i < l; i += 3) {
        array[i] = v3.x;
        array[i + 1] = v3.y;
        array[i + 2] = v3.z;
    }
};

(function () {

    const
        vA = new Vector3(),
        vB = new Vector3(),
        vC = new Vector3(),
        vD = new Vector3(),
        vTailMid = new Vector3(),
        vRelativePosition = new Vector3(),
        vCross = new Vector3();


    /*
     Head quad has following structure
     + ---- A ---- C
     |      | Head |  <- Unconnected side (Tip)
     |      |      |
     + ---- B ---- D
     */

    /**
     *
     * @param {Vector3} position
     * @param {Vector3} normal
     * @param {number} width
     */
    Ribbon.prototype.positionHead = function positionHead(position, normal, width) {
        const head = this.head();

        const halfWidth = width / 2;

        //read previous positions of the tip edge
        head.getVertexA(vA);
        head.getVertexB(vB);

        //compute new tip positions
        vTailMid
            .copy(vA)
            .add(vB)
            .multiplyScalar(0.5);

        vRelativePosition.copy(position).sub(vTailMid);

        vCross.copy(vRelativePosition)
            .cross(normal);

        if (vCross.isZero()) {
            //use old positions as markers, since cross product didn't yield a perpendicular vector
            vC.copy(vA).sub(vTailMid).normalize().multiplyScalar(halfWidth).add(position);
            vD.copy(vB).sub(vTailMid).normalize().multiplyScalar(halfWidth).add(position);
        } else {
            vCross.normalize();

            vC.copy(vCross).multiplyScalar(halfWidth).add(position);
            vD.copy(vCross).negate().multiplyScalar(halfWidth).add(position);
        }

        head.setVertexC(vC);
        head.setVertexD(vD);
    }
})();

/**
 *
 * @param {number} startValue
 * @param {number} endValue
 * @param {function} callback
 */
Ribbon.prototype.traverseLerpEdges = function (startValue, endValue, callback) {

    const valueDelta = (endValue - startValue);

    this.traverseEdges(function (a, b, index, maxIndex) {
        const value = startValue + (index / maxIndex) * valueDelta;
        callback(a, b, value);
    });

};

/**
 *
 * @param {function(a:number, b:number, i:number, length:number)} callback
 */
Ribbon.prototype.traverseEdges = function (callback) {
    const quads = this.quads;
    let q = quads[0];


    const numQuads = this.length;

    const numEdges = numQuads + 1;

    callback(q.getA(), q.getB(), 0, numEdges);

    let i = 0;
    for (let q = this.__head; q !== null; q = q.previous, i++) {
        callback(q.getC(), q.getD(), i, numEdges);
    }
};

Ribbon.prototype.validate = function () {
    let i0, i1;
    let q0 = this.quads[0];
    for (let i = 1; i < this.quads.length; i++) {
        const q1 = this.quads[i];

        let q0a = q0.getA();
        let q0b = q0.getB();
        const q0c = q0.getC();
        const q0d = q0.getD();

        const q1a = q1.getA();
        const q1b = q1.getB();
        let q1c = q1.getC();
        let q1d = q1.getD();

        if (q0c !== q1a || q0d !== q1b) {
            //segments are disconnected
            throw new Error("segments are disconnected");
        }
        q0 = q1;
    }
};

/**
 * moves last segment of ribbon to become new head
 */
Ribbon.prototype.rotate = function () {
    //take first quad
    const quads = this.quads;
    const length = quads.length;

    //take current head
    const tail = this.__tail;
    const head = this.__head;

    //patch tail to become new head
    const a = tail.getA();
    const b = tail.getB();

    tail.setC(a);
    tail.setD(b);

    const c = head.getC();
    const d = head.getD();

    tail.setA(c);
    tail.setB(d);
    //rotate array
    head.next = tail;
    tail.previous = head;
    //set new tail's end
    const newTail = tail.next;
    newTail.previous = null;
    tail.next = null;

    //update tail and head references
    this.__tail = newTail;
    this.__head = tail;

    //this.validate();
    return this;
};
export default Ribbon;