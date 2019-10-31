/**
 * Created by Alex on 31/12/2014.
 */


import { System } from '../../../engine/ecs/System';
import { Camera } from './Camera';
import Transform from '../../../engine/ecs/components/Transform';
import {
    Frustum as ThreeFrustum,
    Matrix4 as ThreeMatrix4,
    OrthographicCamera as ThreeOrthographicCamera,
    PerspectiveCamera as ThreePerspectiveCamera,
    Vector3 as ThreeVector3
} from 'three';
import { assert } from "../../../core/assert.js";
import { SignalBinding } from "../../../core/events/signal/SignalBinding.js";
import { threeUpdateTransform } from "../../Utils.js";


/**
 *
 * @param {Camera} camera
 * @param {Number} width
 * @param {Number} height
 */
function setAspectRatio(camera, width, height) {
    const c = camera.object;
    if (c === null) {
        return;
    }

    const aspect = width / height;

    switch (camera.projectionType.getValue()) {
        case Camera.ProjectionType.Perspective:
            c.aspect = aspect;
            break;
        case Camera.ProjectionType.Orthographic:
            //use smaller values to get a bit of a "zoom" on the world
            const w = c.right - c.left;
            const h = c.bottom - c.top;

            const existingAspect = w / h;

            const aspectDelta = aspect - existingAspect;

            if (aspectDelta > 0) {
                const d = h * aspectDelta;
                c.left -= d / 2;
                c.right += d / 2;
            } else if (aspectDelta < 0) {
                const d = -h * aspectDelta;

                c.top += d / 2;
                c.bottom -= d / 2;
            }

            break;
    }
    c.updateProjectionMatrix();
}

/**
 *
 * @param {Camera} component
 * @returns {PerspectiveCamera| OrthographicCamera}
 */
function buildThreeCamera(component) {
    switch (component.projectionType.getValue()) {
        default:
            console.error(`Unsupported camera projection type "${component.projectionType.getValue()}", defaulting to perspective projection`);
        //fallthrough
        case Camera.ProjectionType.Perspective:
            return new ThreePerspectiveCamera(45, 1, 1, 50);

        case Camera.ProjectionType.Orthographic:
            return new ThreeOrthographicCamera(-10, 10, 20, -20, 1, 1);
    }
}

export class CameraSystem extends System {
    /**
     *
     * @param {THREE.Scene} scene
     * @param {GraphicsEngine} graphics
     * @constructor
     */
    constructor(scene, graphics) {
        super();

        this.scene = scene;
        this.componentClass = Camera;
        this.dependencies = [Transform];

        /**
         *
         * @type {EntityManager}
         */
        this.entityManager = null;

        /**
         * @type {GraphicsEngine}
         */
        this.graphics = graphics;

        this.entityData = [];


        const self = this;

        /**
         *
         * @param {number} x
         * @param {number} y
         * @private
         */
        this.__handleViewportResize = function (x, y) {
            const em = self.entityManager;
            if (em !== null) {
                em.traverseComponents(Camera, function (camera) {
                    setAspectRatio(camera, x, y);
                });
            }
        };

        this.signalBindings = [];
    }


    /**
     *
     * @param {Transform} transform
     * @param {Camera} camera
     * @param entityId
     */
    link(camera, transform, entityId) {
        if (camera.object === null) {
            camera.object = buildThreeCamera(camera);
        }

        const graphics = this.graphics;

        const viewportSize = graphics.viewport.size;

        setAspectRatio(camera, viewportSize.x, viewportSize.y);

        this.scene.add(camera.object);

        function synchronizePosition(x, y, z) {
            assert.equal(typeof x, "number", `X must be of type "number", instead was "${typeof x}"`);
            assert.equal(typeof y, "number", `Y must be of type "number", instead was "${typeof y}"`);
            assert.equal(typeof z, "number", `Z must be of type "number", instead was "${typeof z}"`);

            camera.object.position.set(x, y, z);
            threeUpdateTransform(camera.object);
        }

        function synchronizeRotation() {
            transform.rotation.__setThreeEuler(camera.object.rotation);

            threeUpdateTransform(camera.object);
        }

        function rebuild() {
            camera.object = buildThreeCamera(camera);
            setAspectRatio(camera, viewportSize.x, viewportSize.y);

            const position = transform.position;

            synchronizePosition(position.x, position.y, position.z);
            synchronizeRotation();

            synchronizeActiveState(camera.active.getValue());
        }

        function synchronizeActiveState(v) {
            if (v) {
                graphics.camera = camera.object;
            } else {
                //active camera disabled
            }
        }

        const position = transform.position;
        const rotation = transform.rotation;

        const bPosition = new SignalBinding(position.onChanged, synchronizePosition);
        const bRotation = new SignalBinding(rotation.onChanged, synchronizeRotation);
        const bProjection = new SignalBinding(camera.projectionType.onChanged, rebuild);
        const bActive = new SignalBinding(camera.active.onChanged, synchronizeActiveState);

        const signalBindings = [bPosition, bRotation, bProjection, bActive];

        signalBindings.forEach(b => b.link());

        this.entityData[entityId] = signalBindings;


        synchronizePosition(position.x, position.y, position.z);
        synchronizeRotation(rotation.x, rotation.y, rotation.z, rotation.w);
        synchronizeActiveState(camera.active.getValue());


        assert.notEqual(camera.object, null, 'Camera object must not be null (invariant)');
    }

    /**
     *
     * @param {Transform} transform
     * @param {Camera} camera
     * @param entityId
     */
    unlink(camera, transform, entityId) {
        const data = this.entityData;
        if (data.hasOwnProperty(entityId)) {
            const entityData = data[entityId];

            if (entityData !== void 0) {
                entityData.forEach(b => b.unlink());
            }

            delete data[entityId];
        }

        this.scene.remove(camera.object);
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        const graphics = this.graphics;

        graphics.viewport.size.onChanged.add(this.__handleViewportResize);


        const visibilityConstructionPreHook = new SignalBinding(graphics.on.visibilityConstructionStarted, function () {
            const em = entityManager;

            const layers = graphics.layers;


            const dataset = em.dataset;

            /**
             *
             * @param {Camera} c
             */
            function visitCameraEntity(c) {
                if (c.active.getValue() && c.autoClip && c.object !== null) {
                    autoSetClippingPlanes(c, layers);
                }
            }

            if (dataset !== null) {
                dataset.traverseComponents(Camera, visitCameraEntity);
            }
        });

        visibilityConstructionPreHook.link();

        this.signalBindings.push(visibilityConstructionPreHook);

        readyCallback();
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.graphics.viewport.size.onChanged.remove(this.__handleViewportResize);

        this.signalBindings.forEach(sb => sb.unlink());

        this.signalBindings.splice(0, this.signalBindings.length);

        readyCallback();
    }

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {function(Camera, entity:number)} visitor
     */
    static traverseActiveCameras(ecd, visitor) {

        ecd.traverseComponents(Camera, function (c, entity) {
            if (c.active.getValue()) {
                visitor(c, entity);
            }
        });
    }

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {function(ThreeFrustum[])} callback
     */
    static getActiveFrustums(ecd, callback) {
        const frustums = [];

        if (ecd !== null) {
            ecd.traverseComponents(Camera, function (c) {
                if (c.active.getValue()) {
                    const camera = c.object;

                    if (camera !== null) {
                        const frustum = new ThreeFrustum();
                        frustumFromCamera(camera, frustum);
                        frustums.push(frustum);
                    }

                }
            });
        }

        callback(frustums);
    }
}

const frustum = new ThreeFrustum();
const matrix4 = new ThreeMatrix4();

/**
 *
 * @param {Camera} camera Three.js camera object
 * @param {Frustum} result Three.js frustum object
 */
export function frustumFromCamera(camera, result) {
    result.setFromMatrix(matrix4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
}


/**
 * Compute position of focal point of the camera in world coordinate space. This is the "pinhole" where all perspective lines meet.
 * @param {PerspectiveCamera} camera
 * @param {Vector3} result
 */
export function computePerspectiveCameraFocalPosition(camera, result) {
    if (camera.isPerspectiveCamera !== true) {
        throw new TypeError('expected a perspective camera, got something else');
    }

    const focalLength = camera.getFocalLength();

    const v3 = new ThreeVector3(0, 0, 0.5);

    v3.unproject(camera);
    //get direction
    v3.sub(camera.position).normalize();

    //
    v3.multiplyScalar(-focalLength);

    v3.add(camera.position);

    result.set(v3.x, v3.y, v3.z);
}


const CLIPPING_EPSILON = 0.001;

const CLIPPING_NEAR_MIN = 0.5;

/**
 *
 * @param {Camera} c
 * @param {RenderLayerManager} layers
 */
function autoSetClippingPlanes(c, layers) {
    const camera = c.object;

    frustumFromCamera(camera, frustum);

    function sanityCheck(value) {
        return value !== Number.NEGATIVE_INFINITY && value !== Number.POSITIVE_INFINITY && !isNaN(value);
    }

    const nearPlane = frustum.planes[4];
    const planeOffset = nearPlane.normal.dot(camera.position);
    nearPlane.constant = planeOffset;

    let far = Number.NEGATIVE_INFINITY;
    let near = Number.POSITIVE_INFINITY;

    layers.traverse(function (layer) {
        if (layer.visible) {
            layer.computeNearFarClippingPlanes(frustum, near, far, function (z0, z1) {
                if (z0 < near && z0 !== Number.NEGATIVE_INFINITY) {
                    near = z0;
                }
                if (z1 > far && z1 !== Number.POSITIVE_INFINITY) {
                    far = z1;
                }
            });
        }
    });

    //offset clipping planes by a small margin to prevent clipping of parallel planar surfaces
    near -= CLIPPING_EPSILON;
    far += CLIPPING_EPSILON;

    if (sanityCheck(far) && near > CLIPPING_NEAR_MIN) {
        camera.near = near;
    } else {
        //use a default
        //NOTE: values smaller than 0.001 seem to lead to glitchy rendering where polygons clip through one another
        camera.near = CLIPPING_NEAR_MIN;
    }

    if (sanityCheck(far) && far > 0) {
        camera.far = far;
    } else {
        //use a default
        camera.far = 100;
    }

    camera.updateProjectionMatrix();
}
