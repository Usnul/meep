import { v3_angleBetween } from "../Vector3.js";
import { max2, min2 } from "../../math/MathUtils.js";

/**
 * NOTE: used stackoverflow answer as a basis for circle part: https://stackoverflow.com/questions/2592011/bounding-boxes-for-circle-and-arcs-in-3d
 * @param {AABB3} result
 * @param {number} originX
 * @param {number} originY
 * @param {number} originZ
 * @param {number} directionX
 * @param {number} directionY
 * @param {number} directionZ
 * @param {number} angle
 * @param {number} length
 */
export function computeConeBoundingBox(result, originX, originY, originZ, directionX, directionY, directionZ, angle, length) {
    let x0 = originX,
        y0 = originY,
        z0 = originZ,
        x1 = originX,
        y1 = originY,
        z1 = originZ;

    const ax = v3_angleBetween(directionX, directionY, directionZ, 1, 0, 0);
    const ay = v3_angleBetween(directionX, directionY, directionZ, 0, 1, 0);
    const az = v3_angleBetween(directionX, directionY, directionZ, 0, 0, 1);

    //compute radius of the base of the cone
    const radius = length * Math.tan(angle);

    //compute cone base center
    const centerX = originX + directionX * length;
    const centerY = originY + directionY * length;
    const centerZ = originZ + directionZ * length;

    const rX = Math.sin(ax) * radius;
    const rY = Math.sin(ay) * radius;
    const rZ = Math.sin(az) * radius;

    //compute cone base bounds
    const cx0 = centerX - rX;
    const cy0 = centerY - rY;
    const cz0 = centerZ - rZ;

    const cx1 = centerX + rX;
    const cy1 = centerY + rY;
    const cz1 = centerZ + rZ;

    //combine bounds of the origin and base of the cone
    x0 = min2(x0, cx0);
    y0 = min2(y0, cy0);
    z0 = min2(z0, cz0);

    x1 = max2(x1, cx1);
    y1 = max2(y1, cy1);
    z1 = max2(z1, cz1);

    //write result
    result.setBounds(x0, y0, z0, x1, y1, z1);
}
