/**
 * Created by Alex on 28/01/2015.
 */
import { System } from '../../ecs/System';
import GeometryBVH from '../../ecs/components/GeometryBVH';
import GridPosition from '../components/GridPosition';
import ViewportGridProjection from '../components/ViewportGridProjection';
import { obtainTerrain } from "../../../game/scenes/SceneUtils.js";
import Vector2 from "../../../core/geom/Vector2.js";
import Vector3 from "../../../core/geom/Vector3.js";

class ViewportGridProjectionSystem extends System {
    constructor(grid, graphicsEngine) {
        super();
        this.componentClass = ViewportGridProjection;
        this.graphicsEngine = graphicsEngine;
        this.grid = grid;
    }

    add(component, entity) {
    }

    remove(component, entity) {
    }

    update(timeDelta) {
        const grid = this.grid;
        const em = this.entityManager;
        const renderer = this.graphicsEngine;
        //
        let terrain = null;
        let terrainEntity = void 0;
        obtainTerrain(em.dataset, function (t, entity) {
            terrain = t;
            terrainEntity = entity;
        });

        if (terrain === void 0) {
            //terrain failed to bind, can't project
            return;
        }
        //try to get bvh for terrain
        const geometryBVH = em.getComponent(terrainEntity, GeometryBVH);

        const terrainMesh = terrain.surfaceMesh;
        if (terrainMesh === void 0) {
            //mesh doesn't exist, can't project
            return;
        }
        const v2 = new Vector2();
        em.traverseEntities([ViewportGridProjection, GridPosition], function (p, gridPosition, entity) {
            const worldProjectionMatrix = renderer.camera.projectionMatrix;
            if (p.x === p.prevX && p.y === p.prevY && matricesEqual(worldProjectionMatrix, p.prevProjectionMatrix)) {
                //NOTE: Assumes mesh is static in transform and topology
                //result same as before, do nothing
                return;
            }
            p.prevX = p.x;
            p.prevY = p.y;
            p.prevProjectionMatrix.copy(worldProjectionMatrix);
            v2.set(p.x, p.y);
            renderer.normalizeViewportPoint(v2, v2);
            if (geometryBVH !== null) {
                //see if there's a bvh for this entity
                const source = new Vector3();
                const target = new Vector3();
                renderer.viewportProjectionRay(v2.x, v2.y, source, target);
                geometryBVH.raycast(source, target, function (point) {
                    processIntersection(grid, point, p, gridPosition);
                });
            } else {
                const hits = renderer.intersectObjectUnderViewportPoint(v2.x, v2.y, terrainMesh, true);
                if (hits !== void 0 && hits.length > 0) {
                    //take first hit
                    const hit = hits[0];
                    const point = hit.point;
                    processIntersection(grid, point, p, gridPosition);
                }
            }
        });
    }
}


function matricesEqual(m0, m1) {
    for (let i = 0; i < 16; i++) {
        if (m0.elements[i] !== m1.elements[i]) {
            return false;
        }
    }
    return true;
}

function processIntersection(grid, point, p, gridPosition) {
    grid.pointWorld2Grid(point, gridPosition);
    if (p.snap) {
        //snap to grid
        gridPosition.x = Math.round(gridPosition.x);
        gridPosition.y = Math.round(gridPosition.y);
    }
}

export default ViewportGridProjectionSystem;