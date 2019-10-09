/**
 * Created by Alex on 14/01/2017.
 */


import Tool from './engine/Tool.js';
import Vector2 from '../../core/geom/Vector2';
import AABB2 from '../../core/geom/AABB2';
import { Camera } from '../../graphics/ecs/camera/Camera.js';
import View from '../../../view/View';

import SelectionAddAction from '../actions/concrete/SelectionAddAction';
import SelectionClearAction from '../actions/concrete/SelectionClearAction';

import {
    Frustum as ThreeFrustum,
    Matrix4 as ThreeMatrix4,
    Plane as ThreePlane,
    Raycaster,
    Vector3 as ThreeVector3
} from 'three';
import Vector3 from "../../core/geom/Vector3.js";
import EditorEntity from "../ecs/EditorEntity.js";

class SelectionView extends View {
    constructor() {
        super();
        this.el = document.createElement('div');
        const style = this.el.style;

        style.left = "0";
        style.top = "0";
        style.borderWidth = "1px";
        style.borderStyle = "solid";
        style.borderColor = "#02ff00";
        style.background = "rgba(2,256,0,0.1)";
        style.pointerEvents = "none";
        style.zIndex = 1000;
        style.position = "absolute";
    }
}


class SelectionTool extends Tool {
    constructor() {
        super();
        this.name = "marquee_selection";
        this.settings = {};
        this.anchorPoint = new Vector2();
        this.targetPoint = new Vector2();
        this.box = new AABB2();

        this.selectionMarker = new SelectionView();
    }

    readPosition(target) {
        const pointerPosition = this.engine.devices.pointer.position;

        target.copy(pointerPosition).sub(this.engine.gameView.position);
    }

    start() {
        //read mouse position
        //set anchor point
        this.readPosition(this.anchorPoint);
        //run update loop once
        this.update();
        //add view of selection
        document.body.appendChild(this.selectionMarker.el);
    }

    update() {
        this.readPosition(this.targetPoint);
        //update selection marker

        const x0 = Math.min(this.targetPoint.x, this.anchorPoint.x);
        const x1 = Math.max(this.targetPoint.x, this.anchorPoint.x);
        const y0 = Math.min(this.targetPoint.y, this.anchorPoint.y);
        const y1 = Math.max(this.targetPoint.y, this.anchorPoint.y);

        this.box.set(x0, y0, x1, y1);

        this.selectionMarker.position.set(x0, y0).add(this.engine.gameView.position);
        this.selectionMarker.size.set(x1 - x0, y1 - y0);
    }

    stop() {
        const self = this;
        //finish selection

        //remove selection view
        if (this.selectionMarker.el.parentNode === document.body) {
            document.body.removeChild(this.selectionMarker.el);
        }

        /**
         *
         * @type {Engine|null}
         */
        const engine = this.engine;

        //convert selection box to a frustum based on camera view

        let camera = null;
        const em = engine.entityManager;

        /**
         *
         * @param {Camera} c
         * @returns {boolean}
         */
        function visitCamera(c) {
            if (!c.active) {

            }
            camera = c.object;
            //TODO check assumption that first camera is the right one
            return false;
        }

        em.dataset.traverseComponents(Camera, visitCamera);

        if (camera === null) {
            console.error("Couldn't find a camera to project selection box from");
        }

        let selection;

        const editor = this.editor;

        const box = this.box;
        //if box size is 0, it leads to all planes being converged on one point, to correct this we need to ensure that box dimensions are greater than zero
        const dX = Math.abs(box.x0 - box.x1);
        const dY = Math.abs(box.y0 - box.y1);

        if (dX < SELECTION_MIN_SIZE && dY < SELECTION_MIN_SIZE) {

            selection = pickingSelection(new Vector2(box.x0, box.y0), editor, camera);

        } else {

            if (dX < SELECTION_MIN_SIZE) {
                box.x0 -= (SELECTION_MIN_SIZE - dX) / 2;
                box.x1 += (SELECTION_MIN_SIZE - dX) / 2;
            }
            if (dY < SELECTION_MIN_SIZE) {
                box.y0 -= (SELECTION_MIN_SIZE - dY) / 2;
                box.y1 += (SELECTION_MIN_SIZE - dY) / 2;
            }


            selection = marqueeSelection(box, editor, camera);
        }
        console.log("Selected entities", selection);

        const actions = editor.actions;

        actions.mark();
        if (!self.modifiers.shift) {
            actions.do(new SelectionClearAction());
        }
        actions.do(new SelectionAddAction(selection));

    }
}


/**
 *
 * @param {AABB2} box screen-space 2d box
 * @param {THREE.Camera} camera
 * @return {Frustum}
 */
function makeFrustum(box, camera) {
    //convert box from view space into world space
    const farTL = new ThreeVector3(box.x0, box.y0, 1).unproject(camera);
    const farTR = new ThreeVector3(box.x1, box.y0, 1).unproject(camera);
    const farBL = new ThreeVector3(box.x0, box.y1, 1).unproject(camera);
    const farBR = new ThreeVector3(box.x1, box.y1, 1).unproject(camera);

    //get points on the near plane
    const farCenter = new ThreeVector3((box.x1 + box.x0) / 2, (box.y0 + box.y1) / 2, 1).unproject(camera);

    const cameraPosition = camera.position.clone();
    //push camera position a bit forward to prevent clipping
    const e = Math.min((camera.far - camera.near) * 0.01, 0.01);
    cameraPosition.add(farCenter.clone().sub(cameraPosition).normalize().multiplyScalar(e));

    //create frustum planes
    const pT = new ThreePlane();
    const pB = new ThreePlane();
    const pL = new ThreePlane();
    const pR = new ThreePlane();

    //set planes
    pT.setFromCoplanarPoints(cameraPosition, farTL, farTR);
    pB.setFromCoplanarPoints(cameraPosition, farBR, farBL);
    pL.setFromCoplanarPoints(cameraPosition, farBL, farTL);
    pR.setFromCoplanarPoints(cameraPosition, farTR, farBR);

    //make frustum

    const frustum = new ThreeFrustum();
    frustum.setFromMatrix(new ThreeMatrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

    frustum.planes[0] = pT;
    frustum.planes[1] = pB;
    frustum.planes[2] = pL;
    frustum.planes[3] = pR;

    return frustum;
}

const SELECTION_MIN_SIZE = 0.01;

/**
 *
 * @param {int} entity
 * @param {EntityComponentDataset} dataset
 * @returns {int}
 */
function dereferenceEntity(entity, dataset) {
    const editorEntity = dataset.getComponent(entity, EditorEntity);

    if (editorEntity === undefined) {
        return entity;
    }

    if (editorEntity.referenceEntity !== -1) {
        //reference found, deference
        return editorEntity.referenceEntity;
    } else {
        //no reference, just ignore this one
        return -1;
    }
}


/**
 *
 * @param {Vector2} point
 * @param {Editor} editor
 * @param {THREE.Camera} camera
 */
function pickingSelection(point, editor, camera) {
    const engine = editor.engine;

    const dataset = engine.entityManager.dataset;

    const graphicsEngine = engine.graphics;

    const source = new Vector3(0, 0, 0);
    const rayDirection = new Vector3(0, 0, 0);

    const normalizedPoint = new Vector2(0, 0);

    graphicsEngine.normalizeViewportPoint(point, normalizedPoint);

    graphicsEngine.viewportProjectionRay(normalizedPoint.x, normalizedPoint.y, source, rayDirection);

    // push source by a small amount along the way to prevent selection of elements directly on the NEAR plane
    source.add(rayDirection.clone().multiplyScalar(0.0001));


    let bestCandidate = null;
    let bestDistance = Infinity;


    /**
     *
     * @param {number} entity
     * @param {Vector3} contact
     */
    function tryAddEntity(entity, contact) {
        const distance = source.distanceSqrTo(contact);

        if (distance < bestDistance) {
            bestDistance = distance;

            entity = dereferenceEntity(entity, dataset);

            if (entity === -1) {
                return;
            }

            bestCandidate = entity;
        }
    }

    //query render layers
    engine.graphics.layers.traverse(function (layer) {
        /**
         *
         * @type {BinaryNode}
         */
        const bvh = layer.bvh;

        bvh.traverseRayLeafIntersections(source.x, source.y, source.z, rayDirection.x, rayDirection.y, rayDirection.z, function (leaf) {
            const entity = leaf.entity;
            if (typeof entity !== "number") {
                //no entity
                return;
            }

            const object = leaf.object;
            if (leaf.hasOwnProperty("object") && typeof object === "object" && typeof object.raycast === "function") {
                //found a "raycast" function on the value object held by the leaf, assuming this is THREE.js raycast function
                const raycaster = new Raycaster(source, rayDirection, 0, Infinity);

                // WORKAROUND FOR https://github.com/mrdoob/three.js/issues/17078
                raycaster._camera = camera;


                object.traverse(node => {
                    const intersection = [];
                    node.raycast(raycaster, intersection);

                    intersection.forEach(function (contact) {
                        tryAddEntity(entity, contact.point);
                    });
                });

            } else {
                const center = new Vector3(0, 0, 0);

                leaf.getCenter(center);

                tryAddEntity(entity, center);
            }
        });

    });

    return bestCandidate !== null ? [bestCandidate] : [];
}

/**
 *
 * @param {AABB2} box in screen-space, in pixels
 * @param {Editor} editor
 * @param {THREE.Camera} camera
 */
function marqueeSelection(box, editor, camera) {
    const engine = editor.engine;

    const dataset = engine.entityManager.dataset;

    const normalizedBox = box.clone();
    /**
     * @type {Vector2}
     */
    const viewportSize = engine.graphics.viewport.size;
    /*
     need to convert pixel size into normalized viewport coordinates, they range from -1 to 1 and have inverse Y axis compared to html
     */
    normalizedBox.x0 = (box.x0 / viewportSize.x) * 2 - 1;
    normalizedBox.x1 = (box.x1 / viewportSize.x) * 2 - 1;
    normalizedBox.y0 = -(box.y0 / viewportSize.y) * 2 + 1;
    normalizedBox.y1 = -(box.y1 / viewportSize.y) * 2 + 1;

    const frustum = makeFrustum(normalizedBox, camera);

    const selection = [];
    //query render layers
    engine.graphics.layers.traverse(function (layer) {
        layer.bvh.threeTraverseFrustumsIntersections([frustum], function (leaf, fullyInside) {

            if (leaf.hasOwnProperty("entity") && selection.indexOf(leaf.entity) === -1) {
                let entity = leaf.entity;

                entity = dereferenceEntity(entity, dataset);

                if (entity === -1) {
                    return;
                }

                if (selection.indexOf(entity) === -1) {
                    selection.push(entity);
                }
            }
        });
    });

    return selection;
}

export default SelectionTool;
