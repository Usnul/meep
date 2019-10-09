/**
 * Created by Alex on 16/11/2014.
 */


import computeMortonCode from './Morton';
import Vector3, { v3_dot } from '../geom/Vector3';
import { _boxSurfaceArea2, intersectRay, intersectSegment } from "./AABB3Math";


/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @constructor
 */
function AABB3(x0, y0, z0, x1, y1, z1) {
    this.setBounds(x0, y0, z0, x1, y1, z1);
    this._surfaceArea = -1;
}

AABB3.prototype.computeMortonCode = function () {
    const cx = (this.x0 + this.x1) >> 1;
    const cy = (this.y0 + this.y1) >> 1;
    const cz = (this.z0 + this.z1) >> 1;
    return computeMortonCode(cx, cy, cz);
};

/**
 *
 * @returns {number}
 */
AABB3.prototype.computeSurfaceArea = function () {
    return _boxSurfaceArea2(this.x0, this.y0, this.z0, this.x1, this.y1, this.z1);
};

/**
 *
 * @returns {number}
 */
AABB3.prototype.getSurfaceArea = function () {
    if (typeof this._surfaceArea !== "number" || this._surfaceArea <= 0) {
        this._surfaceArea = this.computeSurfaceArea();
    }
    return this._surfaceArea;
};

/**
 *
 * @param {AABB3} other
 */
AABB3.prototype.copy = function (other) {
    this.setBounds(other.x0, other.y0, other.z0, other.x1, other.y1, other.z1);
};

/**
 *
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} z0
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} z1
 */
AABB3.prototype.setBounds = function (x0, y0, z0, x1, y1, z1) {
    this.x0 = x0;
    this.y0 = y0;
    this.z0 = z0;
    this.x1 = x1;
    this.y1 = y1;
    this.z1 = z1;
};

/**
 *
 * @param {AABB3} other
 * @returns {boolean}
 */
AABB3.prototype.equals = function (other) {
    return this._equals(other.x0, other.y0, other.z0, other.x1, other.y1, other.z1);
};

/**
 *
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} z0
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} z1
 * @returns {boolean}
 */
AABB3.prototype._equals = function (x0, y0, z0, x1, y1, z1) {
    return this.x0 === x0 && this.y0 === y0 && this.z0 === z0 && this.x1 === x1 && this.y1 === y1 && this.z1 === z1;
};

/**
 * Same as setBounds, but does not require component pairs to be ordered (e.g. x0 <= x1). Method will enforce the correct order and invoke setBounds internally
 * @param {Number} x0
 * @param {Number} y0
 * @param {Number} z0
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} z1
 */
AABB3.prototype.setBoundsUnordered = function (x0, y0, z0, x1, y1, z1) {
    let _x0, _y0, _z0, _x1, _y1, _z1;
    if (x0 < x1) {
        _x0 = x0;
        _x1 = x1;
    } else {
        _x0 = x1;
        _x1 = x0;
    }
    if (y0 < y1) {
        _y0 = y0;
        _y1 = y1;
    } else {
        _y0 = y1;
        _y1 = y0;
    }
    if (z0 < z1) {
        _z0 = z0;
        _z1 = z1;
    } else {
        _z0 = z1;
        _z1 = z0;
    }
    this.setBounds(_x0, _y0, _z0, _x1, _y1, _z1);
};

AABB3.prototype.setNegativelyInfiniteBounds = function () {
    this.setBounds(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
};

AABB3.prototype.setInfiniteBounds = function () {
    this.setBounds(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
};

/**
 *
 * @param {AABB3} box
 * @returns {number}
 */
AABB3.prototype.distanceToBox = function (box) {
    return this._distanceToBox(box.x0, box.y0, box.z0, box.x1, box.y1, box.z1);
};

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @returns {number}
 */
AABB3.prototype._distanceToBox = function (x0, y0, z0, x1, y1, z1) {
    const _x0 = this.x0;
    const _y0 = this.y0;
    const _z0 = this.z0;
    const _x1 = this.x1;
    const _y1 = this.y1;
    const _z1 = this.z1;

    //do projection
    const xp0 = _x0 - x1;
    const xp1 = x0 - _x1;
    const yp0 = _y0 - y1;
    const yp1 = y0 - _y1;
    const zp0 = _z0 - z1;
    const zp1 = z0 - _z1;

    //calculate separation in each axis
    const dx = Math.max(xp0, xp1);
    const dy = Math.max(yp0, yp1);
    const dz = Math.max(zp0, zp1);

    //straight-line distance
    let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dx < 0 && dy < 0 && dz < 0) {
        //penetration
        return -distance;
    } else {
        return distance;
    }
};

/**
 *
 * @param {AABB3} other
 * @returns {number}
 */
AABB3.prototype.costForInclusion = function (other) {
    return this._costForInclusion(other.x0, other.y0, other.z0, other.x1, other.y1, other.z1);
};

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @returns {number}
 */
AABB3.prototype._costForInclusion = function (x0, y0, z0, x1, y1, z1) {
    let x = 0;
    let y = 0;
    let z = 0;
    //
    const _x0 = this.x0;
    const _y0 = this.y0;
    const _z0 = this.z0;
    const _x1 = this.x1;
    const _y1 = this.y1;
    const _z1 = this.z1;
    //
    if (_x0 > x0) {
        x += _x0 - x0;
    }
    if (_x1 < x1) {
        x += x1 - _x1;
    }
    if (_y0 > y0) {
        y += _y0 - y0;
    }
    if (_y1 < y1) {
        y += y1 - _y1;
    }
    if (_z0 > z0) {
        z += _z0 - z0;
    }
    if (_z1 < z1) {
        z += z1 - _z1;
    }

    const dx = _x1 - _x0;
    const dy = _y1 - _y0;
    const dz = _z1 - _z0;

    return (x * (dy + dz) + y * (dx + dz) + z * (dx + dy));
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {boolean}
 */
AABB3.prototype._expandToFitPoint = function (x, y, z) {
    let expanded = false;
    if (x < this.x0) {
        this.x0 = x;
        expanded = true;
    }
    if (y < this.y0) {
        this.y0 = y;
        expanded = true;
    }
    if (z < this.z0) {
        this.z0 = z;
        expanded = true;
    }
    if (x > this.x1) {
        this.x1 = x;
        expanded = true;
    }
    if (y > this.y1) {
        this.y1 = y;
        expanded = true;
    }
    if (z > this.z1) {
        this.z1 = z;
        expanded = true;
    }
    return expanded;
};

/**
 *
 * @param {AABB3} box
 * @returns {boolean}
 */
AABB3.prototype.expandToFit = function (box) {
    return this._expandToFit(box.x0, box.y0, box.z0, box.x1, box.y1, box.z1);
};

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @returns {boolean}
 */
AABB3.prototype._expandToFit = function (x0, y0, z0, x1, y1, z1) {
    let expanded = false;
    if (x0 < this.x0) {
        this.x0 = x0;
        expanded = true;
    }
    if (y0 < this.y0) {
        this.y0 = y0;
        expanded = true;
    }
    if (z0 < this.z0) {
        this.z0 = z0;
        expanded = true;
    }
    if (x1 > this.x1) {
        this.x1 = x1;
        expanded = true;
    }
    if (y1 > this.y1) {
        this.y1 = y1;
        expanded = true;
    }
    if (z1 > this.z1) {
        this.z1 = z1;
        expanded = true;
    }
    return expanded;
};

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @returns {boolean}
 */
AABB3.prototype._containsBox = function (x0, y0, z0, x1, y1, z1) {
    return x0 >= this.x0 && y0 >= this.y0 && z0 >= this.z0 && x1 <= this.x1 && y1 <= this.y1 && z1 <= this.z1;
};

/**
 *
 * @param {AABB3} box
 * @returns {boolean}
 */
AABB3.prototype.containsBox = function (box) {
    return this._containsBox(box.x0, box.y0, box.z0, box.x1, box.y1, box.z1);
};

/**
 *
 * @returns {number}
 */
AABB3.prototype.getExtentsX = function () {
    return (this.x1 - this.x0);
};
/**
 *
 * @returns {number}
 */
AABB3.prototype.getExtentsY = function () {
    return (this.y1 - this.y0);
};
/**
 *
 * @returns {number}
 */
AABB3.prototype.getExtentsZ = function () {
    return (this.z1 - this.z0);
};

/**
 * half-width in X axis
 * @returns {number}
 */
AABB3.prototype.getHalfExtentsX = function () {
    return this.getExtentsX() / 2;
};
/**
 * half-width in Y axis
 * @returns {number}
 */
AABB3.prototype.getHalfExtentsY = function () {
    return this.getExtentsY() / 2;
};
/**
 * half-width in Z axis
 * @returns {number}
 */
AABB3.prototype.getHalfExtentsZ = function () {
    return this.getExtentsZ() / 2;
};

/**
 * Get center position of the box
 * @param {Vector3} target where to write result
 */
AABB3.prototype.getCenter = function (target) {
    const x = (this.x0 + this.x1) / 2;
    const y = (this.y0 + this.y1) / 2;
    const z = (this.z0 + this.z1) / 2;
    target.set(x, y, z);
};

/**
 * Accepts ray description, first set of coordinates is origin (oX,oY,oZ) and second is direction (dX,dY,dZ). Algorithm from GraphicsGems by Andrew Woo
 * @param oX
 * @param oY
 * @param oZ
 * @param dX
 * @param dY
 * @param dZ
 */
AABB3.prototype.intersectRay = function (oX, oY, oZ, dX, dY, dZ) {
    return intersectRay(this.x0, this.y0, this.z0, this.x1, this.y1, this.z1, oX, oY, oZ, dX, dY, dZ);
};

AABB3.prototype.intersectSegment = function (startX, startY, startZ, endX, endY, endZ) {
    return intersectSegment(this.x0, this.y0, this.z0, this.x1, this.y1, this.z1, startX, startY, startZ, endX, endY, endZ);
};
/**
 * @source http://stackoverflow.com/questions/3106666/intersection-of-line-segment-with-axis-aligned-box-in-c-sharp
 * @param startX
 * @param startY
 * @param startZ
 * @param endX
 * @param endY
 * @param endZ
 * @returns {boolean}
 */
AABB3.prototype.intersectSegment2 = function (startX, startY, startZ, endX, endY, endZ) {
    //var beginToEnd = segmentEnd - segmentBegin;
    const deltaX = endX - startX,
        deltaY = endY - startY,
        deltaZ = endZ - startZ;
    //var minToMax = new Vector3D(boxSize.X, boxSize.Y, boxSize.Z);

    //var min = boxCenter - minToMax / 2;
    //var max = boxCenter + minToMax / 2;
    //var beginToMin = min - segmentBegin;
    //var beginToMax = max - segmentBegin;
    //var tNear = double.MinValue;
    let tNear = Number.NEGATIVE_INFINITY;
    //var tFar = double.MaxValue;
    let tFar = Number.POSITIVE_INFINITY;
    let t1, t2, tMin, tMax;
    //var intersections = new List<Point3D>();
    //var intersections = [];
    let beginToMin = this.x0 - startX;
    let beginToMax = this.x1 - startX;
    if (deltaX === 0) {//parallel
        if (beginToMin > 0 || beginToMax < 0) {
            return false; //segment is not between planes
        }
    } else {
        t1 = beginToMin / deltaX;
        t2 = beginToMax / deltaX;
        tMin = Math.min(t1, t2);
        tMax = Math.max(t1, t2);
        if (tMin > tNear) {
            tNear = tMin;
        }
        if (tMax < tFar) {
            tFar = tMax;
        }
        if (tNear > tFar || tFar < 0) {
            return false;
        }
    }
    beginToMin = this.y0 - startY;
    beginToMax = this.y1 - startY;
    if (deltaY === 0) {//parallel
        if (beginToMin > 0 || beginToMax < 0) {
            return false; //segment is not between planes
        }
    } else {
        t1 = beginToMin / deltaY;
        t2 = beginToMax / deltaY;
        tMin = Math.min(t1, t2);
        tMax = Math.max(t1, t2);
        if (tMin > tNear) {
            tNear = tMin;
        }
        if (tMax < tFar) {
            tFar = tMax;
        }
        if (tNear > tFar || tFar < 0) {
            return false;
        }
    }
    beginToMin = this.z0 - startZ;
    beginToMax = this.z1 - startZ;
    if (deltaZ === 0) {//parallel
        if (beginToMin > 0 || beginToMax < 0) {
            return false; //segment is not between planes
        }
    } else {
        t1 = beginToMin / deltaZ;
        t2 = beginToMax / deltaZ;
        tMin = Math.min(t1, t2);
        tMax = Math.max(t1, t2);
        if (tMin > tNear) {
            tNear = tMin;
        }
        if (tMax < tFar) {
            tFar = tMax;
        }
        if (tNear > tFar || tFar < 0) {
            return false;
        }
    }
    //
    if (tNear >= 0 && tNear <= 1) {
        //intersections.push({
        //    x: startX + deltaX * tNear,
        //    y: startY + deltaY * tNear,
        //    z: startZ + deltaZ * tNear
        //});
        return true;
    }
    if (tFar >= 0 && tFar <= 1) {
        //intersections.push({
        //    x: startX + deltaX * tFar,
        //    y: startY + deltaY * tFar,
        //    z: startZ + deltaZ * tFar
        //});
        return true;
    }
    return false;
    //foreach (Axis axis in Enum.GetValues(typeof(Axis)))
    //{
    //    if (beginToEnd.GetCoordinate(axis) == 0) // parallel
    //    {
    //        if (beginToMin.GetCoordinate(axis) > 0 || beginToMax.GetCoordinate(axis) < 0)
    //            return intersections; // segment is not between planes
    //    }
    //    else
    //    {
    //        var t1 = beginToMin.GetCoordinate(axis) / beginToEnd.GetCoordinate(axis);
    //        var t2 = beginToMax.GetCoordinate(axis) / beginToEnd.GetCoordinate(axis);
    //        var tMin = Math.Min(t1, t2);
    //        var tMax = Math.Max(t1, t2);
    //        if (tMin > tNear) tNear = tMin;
    //        if (tMax < tFar) tFar = tMax;
    //        if (tNear > tFar || tFar < 0) return intersections;
    //
    //    }
    //}
    //if (tNear >= 0 && tNear <= 1) intersections.Add(segmentBegin + beginToEnd * tNear);
    //if (tFar >= 0 && tFar <= 1) intersections.Add(segmentBegin + beginToEnd * tFar);
    //return intersections;
};

/**
 *
 * @param {THREE.Box} box
 * @returns {boolean}
 */
AABB3.prototype.threeContainsBox = function (box) {
    const min = box.min;
    const max = box.max;
    return this._containsBox(min.x, min.y, min.z, max.x, max.y, max.z);
};

/**
 *
 * @param {function(x:number, y:number, z:number)} callback
 */
AABB3.prototype.traverseCorners = function (callback) {
    const _x0 = this.x0;
    const _y0 = this.y0;
    const _z0 = this.z0;
    const _x1 = this.x1;
    const _y1 = this.y1;
    const _z1 = this.z1;

    callback(_x0, _y0, _z0);
    callback(_x0, _y0, _z1);

    callback(_x0, _y1, _z0);
    callback(_x0, _y1, _z1);

    callback(_x1, _y0, _z0);
    callback(_x1, _y0, _z1);

    callback(_x1, _y1, _z0);
    callback(_x1, _y1, _z1);
};

/**
 * @param {THREE.Plane} plane
 * @returns {int} 2,0,or -2; 2: above, -2 : below, 0 : intersects plane
 */
AABB3.prototype.computePlaneSide = function computePlaneSide(plane) {
    let x0,
        y0,
        z0,
        x1,
        y1,
        z1;

    const normal = plane.normal;
    const planeConstant = -plane.constant;

    const nX = normal.x;
    const nY = normal.y;
    const nZ = normal.z;

    if (nX > 0) {
        x0 = this.x0;
        x1 = this.x1;
    } else {
        x0 = this.x1;
        x1 = this.x0;
    }

    if (nY > 0) {
        y0 = this.y0;
        y1 = this.y1;
    } else {
        y0 = this.y1;
        y1 = this.y0;
    }

    if (nZ > 0) {
        z0 = this.z0;
        z1 = this.z1;
    } else {
        z0 = this.z1;
        z1 = this.z0;
    }

    let result = 0;

    if (v3_dot(x0, y0, z0, nX, nY, nZ) < planeConstant) {
        result += 1;
    } else {
        result -= 1;
    }

    if (v3_dot(x1, y1, z1, nX, nY, nZ) < planeConstant) {
        result += 1;
    } else {
        result -= 1;
    }

    return result;
};


AABB3.prototype.isBelowPlane = function () {
    const p1 = new Vector3(),
        p2 = new Vector3();

    function isBelowPlane(plane) {
        const normal = plane.normal;

        if (normal.x > 0) {
            p1.x = this.x0;
            p2.x = this.x1;
        } else {
            p1.x = this.x1;
            p2.x = this.x0;
        }

        if (normal.y > 0) {
            p1.y = this.y0;
            p2.y = this.y1;
        } else {
            p1.y = this.y1;
            p2.y = this.y0;
        }

        if (normal.z > 0) {
            p1.z = this.z0;
            p2.z = this.z1;
        } else {
            p1.z = this.z1;
            p2.z = this.z0;
        }

        const planeConstant = -plane.constant;

        return (p1.dot(normal) < planeConstant) && (p2.dot(normal) < planeConstant);
    }

    return isBelowPlane;
}();

AABB3.prototype.intersectSpace = function (clippingPlanes) {
    let i = 0;
    const l = clippingPlanes.length;
    for (; i < l; i++) {

        const plane = clippingPlanes[i];
        if (this.isBelowPlane(plane)) {
            return false;
        }
    }
    return true;
};

/**
 *
 * @param {Frustum} frustum
 * @returns {number}
 */
AABB3.prototype.intersectFrustumDegree = function (frustum) {
    const planes = frustum.planes;

    let result = 2;
    for (let i = 0; i < 6; i++) {

        const plane = planes[i];
        const planeSide = this.computePlaneSide(plane);
        if (planeSide > 0) {
            return 0;
        } else if (planeSide === 0) {
            result = 1;
        }
    }
    return result;
};

/**
 *
 * @param {{planes:Array}}frustum
 * @returns {boolean}
 */
AABB3.prototype.intersectFrustum = function intersectFrustum(frustum) {
    const planes = frustum.planes;
    for (let i = 0; i < 6; i++) {

        const plane = planes[i];
        if (this.isBelowPlane(plane)) {
            return false;
        }
    }
    return true;
};

/**
 *
 * @returns {AABB3}
 */
AABB3.prototype.clone = function () {
    const clone = new AABB3();

    clone.copy(this);

    return clone;
};

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {AABB3} box
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 */
export function serializeAABB3Quantized16Uint(buffer, box, x0, y0, z0, x1, y1, z1) {
    //compute value ranges
    const xD = x1 - x0;
    const yD = y1 - y0;
    const zD = z1 - z0;

    //quantize all values
    const _x0 = (((box.x0 - x0) / xD) * 65535) | 0;
    const _y0 = (((box.y0 - y0) / yD) * 65535) | 0;
    const _z0 = (((box.z0 - z0) / zD) * 65535) | 0;

    const _x1 = (((box.x1 - x0) / xD) * 65535) | 0;
    const _y1 = (((box.y1 - y0) / yD) * 65535) | 0;
    const _z1 = (((box.z1 - z0) / zD) * 65535) | 0;

    buffer.writeUint16(_x0);
    buffer.writeUint16(_y0);
    buffer.writeUint16(_z0);
    buffer.writeUint16(_x1);
    buffer.writeUint16(_y1);
    buffer.writeUint16(_z1);
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {AABB3} box
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 */
export function deserializeAABB3Quantized16Uint(buffer, box, x0, y0, z0, x1, y1, z1) {
    //compute value ranges
    const xD = x1 - x0;
    const yD = y1 - y0;
    const zD = z1 - z0;

    //read values
    const _x0 = buffer.readUint16();
    const _y0 = buffer.readUint16();
    const _z0 = buffer.readUint16();
    const _x1 = buffer.readUint16();
    const _y1 = buffer.readUint16();
    const _z1 = buffer.readUint16();

    //quantize all values
    const qx0 = (_x0 / 65535) * xD + x0;
    const qy0 = (_y0 / 65535) * yD + y0;
    const qz0 = (_z0 / 65535) * zD + z0;

    const qx1 = (_x1 / 65535) * xD + x0;
    const qy1 = (_y1 / 65535) * yD + y0;
    const qz1 = (_z1 / 65535) * zD + z0;

    box.setBounds(qx0, qy0, qz0, qx1, qy1, qz1);
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {AABB3} box
 */
function serializeAABB3(buffer, box) {
    buffer.writeFloat64(box.x0);
    buffer.writeFloat64(box.y0);
    buffer.writeFloat64(box.z0);
    buffer.writeFloat64(box.x1);
    buffer.writeFloat64(box.y1);
    buffer.writeFloat64(box.z1);
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {AABB3} box
 */
function deserializeAABB3(buffer, box) {
    const x0 = buffer.readFloat64();
    const y0 = buffer.readFloat64();
    const z0 = buffer.readFloat64();
    const x1 = buffer.readFloat64();
    const y1 = buffer.readFloat64();
    const z1 = buffer.readFloat64();

    box.setBounds(x0, y0, z0, x1, y1, z1);
}

export {
    AABB3,
    serializeAABB3,
    deserializeAABB3
};
