/**
 * Created by Alex on 25/05/2016.
 */


import { max2, min2 } from "../math/MathUtils.js";

/**
 * Float ABS, from standard C lib
 * @param {Number} val
 * @returns {number}
 */
function fabsf(val) {
    return val >= 0 ? val : -val;
}

/**
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @param {number} startX
 * @param {number} startY
 * @param {number} startZ
 * @param {number} endX
 * @param {number} endY
 * @param {number} endZ
 * @returns {boolean}
 */
function intersectSegment(x0, y0, z0, x1, y1, z1, startX, startY, startZ, endX, endY, endZ) {

    let boxExtentsX,
        boxExtentsY,
        boxExtentsZ,
        diffX,
        diffY,
        diffZ,
        dirX,
        dirY,
        dirZ,
        centerX,
        centerY,
        centerZ;
    //
    let a, b, c;

    dirX = 0.5 * (endX - startX);
    boxExtentsX = (x1 - x0) / 2;
    centerX = x0 + boxExtentsX;
    diffX = (0.5 * (endX + startX)) - centerX;
    a = fabsf(dirX);
    if (fabsf(diffX) > boxExtentsX + a) return false;
    //
    dirY = 0.5 * (endY - startY);
    boxExtentsY = (y1 - y0) / 2;
    centerY = y0 + boxExtentsY;
    diffY = (0.5 * (endY + startY)) - centerY;
    b = fabsf(dirY);
    if (fabsf(diffY) > boxExtentsY + b) return false;
    //
    dirZ = 0.5 * (endZ - startZ);
    boxExtentsZ = (z1 - z0) / 2;
    centerZ = z0 + boxExtentsZ;
    diffZ = (0.5 * (endZ + startZ)) - centerZ;
    c = fabsf(dirZ);
    if (fabsf(diffZ) > boxExtentsZ + c) return false;

    //Dir.y = 0.5f * (segment.mP1.y - segment.mP0.y);
    //BoxExtents.y = aabb.GetExtents(1);
    //Diff.y = (0.5f * (segment.mP1.y + segment.mP0.y)) - aabb.GetCenter(1);
    //b = fabsf(Dir.y);
    //if(fabsf(Diff.y)>BoxExtents.y + b)	return false;

    let f;
    f = dirY * diffZ - dirZ * diffY;
    if (fabsf(f) > boxExtentsY * c + boxExtentsZ * b) return false;
    f = dirZ * diffX - dirX * diffZ;
    if (fabsf(f) > boxExtentsX * c + boxExtentsZ * a) return false;
    f = dirX * diffY - dirY * diffX;
    if (fabsf(f) > boxExtentsX * b + boxExtentsY * a) return false;

    return true;
}


/**
 * see: https://tavianator.com/fast-branchless-raybounding-box-intersections-part-2-nans/
 * NOTE: this solution forgoes consistent handling of NaNs in favor of execution speed
 * FIXME some manual tests have shown deviation in results between this implementation and others. Possible bugs?
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @param {number} oX
 * @param {number} oY
 * @param {number} oZ
 * @param {number} dirX
 * @param {number} dirY
 * @param {number} dirZ
 * @returns {boolean}
 */
export function aabb3_intersectRay_slab(x0, y0, z0, x1, y1, z1, oX, oY, oZ, dirX, dirY, dirZ) {
    /*
    Java CODE:
        bool intersection(box b, ray r) {
            double t1 = (b.min[0] - r.origin[0])*r.dir_inv[0];
            double t2 = (b.max[0] - r.origin[0])*r.dir_inv[0];

            double tmin = min(t1, t2);
            double tmax = max(t1, t2);

            for (int i = 1; i < 3; ++i) {
                t1 = (b.min[i] - r.origin[i])*r.dir_inv[i];
                t2 = (b.max[i] - r.origin[i])*r.dir_inv[i];

                tmin = max(tmin, min(t1, t2));
                tmax = min(tmax, max(t1, t2));
            }

            return tmax > max(tmin, 0.0);
        }

     */

    let t1, t2, tMin, tMax;

    t1 = (x0 - oX) * dirX;
    t2 = (x1 - oX) * dirX;

    tMin = min2(t1, t2);
    tMax = max2(t1, t2);

    t1 = (y0 - oY) * dirY;
    t2 = (y1 - oY) * dirY;

    tMin = max2(tMin, min2(t1, t2));
    tMax = min2(tMax, max2(t1, t2));

    t1 = (z0 - oZ) * dirZ;
    t2 = (z1 - oZ) * dirZ;

    tMin = max2(tMin, min2(t1, t2));
    tMax = min2(tMax, max2(t1, t2));


    return tMax > max2(tMin, 0.0);
}

/**
 * Fast Ray-Box intersection
 * From "Graphics Gems", Academic Press, 1990
 * ported from C
 * see: https://web.archive.org/web/20090803054252/http://tog.acm.org/resources/GraphicsGems/gems/RayBox.c
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @param {number} oX
 * @param {number} oY
 * @param {number} oZ
 * @param {number} dirX
 * @param {number} dirY
 * @param {number} dirZ
 * @returns {boolean}
 */
export function aabb3_intersectRay_fast(x0, y0, z0, x1, y1, z1, oX, oY, oZ, dirX, dirY, dirZ) {
    let inside = true;

    let quadrantX = 0;
    let quadrantY = 0;
    let quadrantZ = 0;

    let maxTX = 0;
    let maxTY = 0;
    let maxTZ = 0;

    let maxT = 0;

    let candidatePlaneX = 0;
    let candidatePlaneY = 0;
    let candidatePlaneZ = 0;

    let coordX = 0;
    let coordY = 0;
    let coordZ = 0;

    /*
        find candidate planes
     */
    if (oX < x0) {
        quadrantX = 1; //LEFT
        candidatePlaneX = x0;
        inside = false;
    } else if (oX > x1) {
        quadrantX = 0; //RIGHT
        candidatePlaneX = x1;
        inside = false;
    } else {
        quadrantX = 2; //MIDDLE
    }

    if (oY < y0) {
        quadrantY = 1; //LEFT
        candidatePlaneY = y0;
        inside = false;
    } else if (oY > y1) {
        quadrantY = 0; //RIGHT
        candidatePlaneY = y1;
        inside = false;
    } else {
        quadrantY = 2; //MIDDLE
    }

    if (oZ < z0) {
        quadrantZ = 1; //LEFT
        candidatePlaneZ = z0;
        inside = false;
    } else if (oZ > z1) {
        quadrantZ = 0; //RIGHT
        candidatePlaneZ = z1;
        inside = false;
    } else {
        quadrantZ = 2; //MIDDLE
    }

    // Ray origin inside the bounding box
    if (inside) {
        return true;
    }

    // Calculate T distances to candidate planes
    if (quadrantX !== 2 && dirX !== 0) {
        maxTX = (candidatePlaneX - oX) / dirX;
    } else {
        maxTX = -1;
    }

    if (quadrantY !== 2 && dirY !== 0) {
        maxTY = (candidatePlaneY - oY) / dirY;
    } else {
        maxTY = -1;
    }

    if (quadrantZ !== 2 && dirZ !== 0) {
        maxTZ = (candidatePlaneZ - oZ) / dirZ;
    } else {
        maxTZ = -1;
    }

    // Get largest of maxT's for final choice of intersection
    if (maxTX < maxTY) {
        if (maxTY < maxTZ) {
            maxT = maxTZ;
            // Check if final candidate actually inside the box
            if (maxT < 0) {
                return false;
            }

            coordX = oX + maxT * dirX;
            if (coordX < x0 || coordX > x1) {
                return false;
            }

            coordY = oY + maxT * dirY;
            if (coordY < y0 || coordY > y1) {
                return false;
            }

        } else {
            maxT = maxTY;
            // Check if final candidate actually inside the box
            if (maxT < 0) {
                return false;
            }

            coordX = oX + maxT * dirX;
            if (coordX < x0 || coordX > x1) {
                return false;
            }

            coordZ = oZ + maxT * dirZ;
            if (coordZ < z0 || coordZ > z1) {
                return false;
            }
        }
    } else if (maxTX < maxTZ) {
        maxT = maxTZ;
        // Check if final candidate actually inside the box
        if (maxT < 0) {
            return false;
        }

        coordX = oX + maxT * dirX;
        if (coordX < x0 || coordX > x1) {
            return false;
        }

        coordY = oY + maxT * dirY;
        if (coordY < y0 || coordY > y1) {
            return false;
        }
    } else {
        maxT = maxTX;
        // Check if final candidate actually inside the box
        if (maxT < 0) {
            return false;
        }

        coordY = oY + maxT * dirY;
        if (coordY < y0 || coordY > y1) {
            return false;
        }

        coordZ = oZ + maxT * dirZ;
        if (coordZ < z0 || coordZ > z1) {
            return false;
        }
    }

    //ray hits the box
    return true;
}

/**
 * NOTES:
 *      https://web.archive.org/web/20090803054252/http://tog.acm.org/resources/GraphicsGems/gems/RayBox.c
 *      https://tavianator.com/fast-branchless-raybounding-box-intersections/
 *      https://gamedev.stackexchange.com/questions/18436/most-efficient-aabb-vs-ray-collision-algorithms
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} z0
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @param {number} oX
 * @param {number} oY
 * @param {number} oZ
 * @param {number} dirX
 * @param {number} dirY
 * @param {number} dirZ
 * @returns {boolean}
 */
function intersectRay(x0, y0, z0, x1, y1, z1, oX, oY, oZ, dirX, dirY, dirZ) {

    const boxExtentsX = (x1 - x0) / 2;

    const centerX = x0 + boxExtentsX;

    const diffX = oX - centerX;

    const a = fabsf(dirX);

    if (fabsf(diffX) > boxExtentsX && diffX * dirX >= 0.0) {
        return false;
    }

    //
    const boxExtentsY = (y1 - y0) / 2;

    const centerY = y0 + boxExtentsY;

    const diffY = oY - centerY;

    const b = fabsf(dirY);

    if (fabsf(diffY) > boxExtentsY && diffY * dirY >= 0.0) {
        return false;
    }

    //
    const boxExtentsZ = (z1 - z0) / 2;

    const centerZ = z0 + boxExtentsZ;

    const diffZ = oZ - centerZ;

    const c = fabsf(dirZ);

    if (fabsf(diffZ) > boxExtentsZ && diffZ * dirZ >= 0.0) {
        return false;
    }

    //Dir.y = 0.5f * (segment.mP1.y - segment.mP0.y);
    //BoxExtents.y = aabb.GetExtents(1);
    //Diff.y = (0.5f * (segment.mP1.y + segment.mP0.y)) - aabb.GetCenter(1);
    //b = fabsf(Dir.y);
    //if(fabsf(Diff.y)>BoxExtents.y + b)	return false;

    const f0 = dirY * diffZ - dirZ * diffY;

    if (fabsf(f0) > boxExtentsY * c + boxExtentsZ * b) {
        return false;
    }

    const f1 = dirZ * diffX - dirX * diffZ;

    if (fabsf(f1) > boxExtentsX * c + boxExtentsZ * a) {
        return false;
    }

    const f2 = dirX * diffY - dirY * diffX;

    if (fabsf(f2) > boxExtentsX * b + boxExtentsY * a) {
        return false;
    }

    return true;
}

/**
 * Compute surface area for a box contain both inputs
 * @param {AABB3} a
 * @param {AABB3} b
 * @returns {number}
 */
function scoreBoxesSAH(a, b) {
    let x0, y0, z0, x1, y1, z1;

    //

    const ax0 = a.x0;
    const ay0 = a.y0;
    const az0 = a.z0;
    const ax1 = a.x1;
    const ay1 = a.y1;
    const az1 = a.z1;

    const bx0 = b.x0;
    const by0 = b.y0;
    const bz0 = b.z0;
    const bx1 = b.x1;
    const by1 = b.y1;
    const bz1 = b.z1;

    //

    x0 = ax0 < bx0 ? ax0 : bx0;
    y0 = ay0 < by0 ? ay0 : by0;
    z0 = az0 < bz0 ? az0 : bz0;

    x1 = ax1 > bx1 ? ax1 : bx1;
    y1 = ay1 > by1 ? ay1 : by1;
    z1 = az1 > bz1 ? az1 : bz1;

    //

    return _boxSurfaceArea2(x0, y0, z0, x1, y1, z1);
}

function scoreBoxesSAHDelta(b0, b1) {
    let x0, y0, z0, x1, y1, z1;
    //
    const b0x0 = b0.x0;
    const b0y0 = b0.y0;
    const b0z0 = b0.z0;
    const b0x1 = b0.x1;
    const b0y1 = b0.y1;
    const b0z1 = b0.z1;

    const b1x0 = b1.x0;
    const b1y0 = b1.y0;
    const b1z0 = b1.z0;
    const b1x1 = b1.x1;
    const b1y1 = b1.y1;
    const b1z1 = b1.z1;
    //
    x0 = b0x0 < b1x0 ? b0x0 : b1x0;
    y0 = b0y0 < b1y0 ? b0y0 : b1y0;
    z0 = b0z0 < b1z0 ? b0z0 : b1z0;
    x1 = b0x1 > b1x1 ? b0x1 : b1x1;
    y1 = b0y1 > b1y1 ? b0y1 : b1y1;
    z1 = b0z1 > b1z1 ? b0z1 : b1z1;
    //
    const totalArea = _boxSurfaceArea2(x0, y0, z0, x1, y1, z1);
    const area0 = b0.getSurfaceArea();
    const area1 = b1.getSurfaceArea();
    return totalArea - Math.max(area0, area1);
}

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
function boxSurfaceArea(x0, y0, z0, x1, y1, z1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;
    return (dx * dy + dy * dz + dz * dx) * 2; //2 of each side
}

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
function _boxSurfaceArea2(x0, y0, z0, x1, y1, z1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;
    return dy * (dx + dz) + dz * dx; //1 side, since it's a heuristic only
}

/**
 *
 * @param {AABB3} node
 * @returns {number}
 */
function boxSurfaceArea2(node) {
    return _boxSurfaceArea2(node.x0, node.y0, node.z0, node.x1, node.y1, node.z1);
}

export {
    intersectSegment,
    intersectRay,
    scoreBoxesSAH,
    boxSurfaceArea,
    boxSurfaceArea2,
    _boxSurfaceArea2
}
