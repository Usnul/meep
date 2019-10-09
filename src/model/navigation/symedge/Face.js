/**
 * User: Alex Goldring
 * Date: 3/27/2014
 * Time: 9:32 PM
 */
import Element from './Element';

const Face = function (v0, v1, v2) {
    this.e0 = null;
    this.e1 = null;
    this.e2 = null;
    this.v0 = v0 || null;
    this.v1 = v1 || null;
    this.v2 = v2 || null;
};
Face.prototype = new Element();
Face.prototype.centroid = function () {
    return this.v0.clone().add(this.v1).add(this.v2).scale(1 / 3);
};
Face.prototype.calculateEdgeIndexFromVertices = function (v0, v1) {
    if (v0 == v1) {
        throw new Error("specified vertices must not be the same");
    }
    const vertices = this.getVertices();
    const i0 = vertices.indexOf(v0);
    const i1 = vertices.indexOf(v1);
    if (i0 < 0 || i1 < 0) {
        throw new Error("one or both of the vertices is not part of the face");
    }
    const max = Math.max(i0, i1);
    const min = Math.min(i0, i1);
    if (max - min == 2) {
        return 2;
    } else {
        return min;
    }
};
Face.prototype.getVertices = function () {
    return [this.v0, this.v1, this.v2];
};
Face.prototype.findCommonVerticesWith = function (otherFace) {
    const result = [];
    const these = this.getVertices();
    const others = otherFace.getVertices();
    for (let i = 0; i < 3; i++) {
        const v0 = these[i];
        for (let j = 0; j < 3; j++) {
            const v1 = others[j];
            if (v0 == v1) {
                result.push(v0);
                break;
            }
        }
    }
    return result;
};
Face.prototype.findCommonEdgeWith = function (otherFace) {
    const these = [this.e0, this.e1, this.e2];
    const others = [otherFace.e0, otherFace.e1, otherFace.e2];
    for (let i = 0; i < 3; i++) {
        const e0 = these[i];
        for (let j = 0; j < 3; j++) {
            const e1 = others[j];
            if (e0 == e1) {
                return e0;
            }
        }
    }
    //no common edges
    return null;
};
Face.prototype.containsPoint = function (pt) {

    function sign(p1, p2, p3) {
        return (p1.x - p3.x) * (p2.z - p3.z) - (p2.x - p3.x) * (p1.z - p3.z);
    }

    const v1 = this.v0;
    const v2 = this.v1;
    const v3 = this.v2;
    let b1, b2, b3;

    b1 = sign(pt, v1, v2) < 0.0;
    b2 = sign(pt, v2, v3) < 0.0;
    b3 = sign(pt, v3, v1) < 0.0;

    return ((b1 == b2) && (b2 == b3));
};
export default Face;
