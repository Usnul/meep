/**
 * Created by Alex on 13/06/2016.
 */


import Vector3 from '../../core/geom/Vector3';
import Vector2 from '../../core/geom/Vector2';
import Mesh from "../../graphics/ecs/mesh/Mesh";
import { noop } from "../../core/function/Functions.js";

const tempPoint = new Vector2();

/**
 *
 * @param {Array.<Number>} entities
 * @param {EntityComponentDataset} ecd
 * @param {GraphicsEngine} ge
 * @param {Number} x
 * @param {Number} y
 * @returns {Number|null} entity number or null in case of failed test
 */
function modelHitTest(entities, ecd, ge, x, y) {
    tempPoint.set(x, y);
    ge.normalizeViewportPoint(tempPoint, tempPoint);
    let i = 0;
    const l = entities.length;
    for (; i < l; i++) {
        const entity = entities[i];
        const model = ecd.getComponent(entity, Mesh);
        if (model === null) {
            //entity no longer exists most likely
            continue;
        }
        const hit = ge.intersectObjectUnderViewportPoint(tempPoint.x, tempPoint.y, model.mesh, true);
        if (hit.length > 0) {
            return entity;
        }
    }
    return null;
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {GraphicsEngine} graphicsEngine
 * @param {Terrain} terrain
 * @param {function(gridPosition:Vector2,worldPosition:Vector3,normal:Vector3,geometry:*)} callback
 */
function pick(x, y, graphicsEngine, terrain, callback) {

    const vSource = new Vector3(x, y, 0);
    const vTarget = new Vector3();
    graphicsEngine.normalizeViewportPoint(vSource, vSource);
    graphicsEngine.viewportProjectionRay(vSource.x, vSource.y, vSource, vTarget);

    terrain.raycast(vSource, vTarget, function (point, normal, geometry) {
        if (point === null) {
            //Null is valid, nothing was hit
        } else {
            const gridPosition = new Vector2();
            terrain.mapPointWorld2Grid(point, gridPosition);
            gridPosition._add(0.5, 0.5);
            callback(gridPosition, point, normal, geometry);
        }
    }, noop);
}

export {
    pick,
    modelHitTest
};
