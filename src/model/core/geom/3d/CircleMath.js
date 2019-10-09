import { v3_angleBetween } from "../Vector3.js";

/**
 * NOTE: based on https://stackoverflow.com/questions/2592011/bounding-boxes-for-circle-and-arcs-in-3d
 * @param {AABB3} result
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} centerZ
 * @param {number} normalX orientation of the circle
 * @param {number} normalY orientation of the circle
 * @param {number} normalZ orientation of the circle
 * @param {number} radius
 */
export function computeCircleBoundingBox(result, centerX, centerY, centerZ, normalX, normalY, normalZ, radius) {
    const ax = v3_angleBetween(normalX, normalY, normalZ, 1, 0, 0);
    const ay = v3_angleBetween(normalX, normalY, normalZ, 0, 1, 0);
    const az = v3_angleBetween(normalX, normalY, normalZ, 0, 0, 1);

    const rX = Math.sin(ax) * radius;
    const rY = Math.sin(ay) * radius;
    const rZ = Math.sin(az) * radius;

    result.setBounds(centerX - rX, centerY - rY, centerZ - rZ, centerX + rX, centerY + rY, centerZ + rZ);
}
