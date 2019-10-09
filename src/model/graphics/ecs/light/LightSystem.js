/**
 * Created by Alex on 01/06/2016.
 */


import { System } from '../../../engine/ecs/System';
import Transform from '../../../engine/ecs/components/Transform';
import { Light, LightType } from './Light.js';
import { Camera } from '../camera/Camera';

import FrustumProjector from '../camera/FrustumProjector';

import { AmbientLight, DirectionalLight, PointLight, SpotLight } from 'three';
import { SignalBinding } from "../../../core/events/signal/SignalBinding.js";
import { threeUpdateTransform } from "../../Utils";

/**
 *
 * @param {Light} component
 * @returns {DirectionalLight|SpotLight|PointLight|AmbientLight|*}
 */
function threeMakeLight(component) {
    let result = null;

    const intensity = component.intensity.getValue();
    const color = component.color.toUint();

    switch (component.type.getValue()) {
        case LightType.DIRECTION:
            result = new DirectionalLight(color, intensity);
            break;
        case LightType.SPOT:
            result = new SpotLight(color, intensity);
            result.angle = component.angle.getValue();
            result.penumbra = component.penumbra.getValue();
            result.distance = component.distance.getValue();
            break;
        case LightType.POINT:
            result = new PointLight(color, intensity);
            break;
        case LightType.AMBIENT:
            result = new AmbientLight(color, intensity);
            break;
        default:
            throw new Error('Unknown light type: ' + component.type);
    }

    result.castShadow = component.castShadow.getValue();
    return result;
}

/**
 *
 * @param {Light} component
 */
function threeEnsureLightObject(component) {
    if (component.__threeObject === null) {
        component.__threeObject = threeMakeLight(component);
    }
}

/**
 *
 * @param {Light} component
 */
function updateTransform(component) {
    threeUpdateTransform(component.__threeObject);
}

/**
 *
 * @param {Light} component
 * @param {Quaternion} r
 */
function applyRotation(component, r) {
    const l = component.__threeObject;

    r.__setThreeEuler(l.rotation);

    if (l.target !== undefined) {

        const targetPosition = l.target.position;

        targetPosition.set(0, 0, 1).applyQuaternion(r);
        targetPosition.set(l.position.x + targetPosition.x, l.position.y + targetPosition.y, l.position.z + targetPosition.z);

        l.target.updateMatrixWorld(true);
    }

    updateTransform(component);
}

class LightSystem extends System {
    /**
     *
     * @param {Scene} scene
     * @param settings
     * @constructor
     */
    constructor(scene, settings) {
        super();

        this.componentClass = Light;
        this.dependencies = [Transform];

        this.scene = scene;
        this.settings = settings;


        this.bindings = [];
    }

    setConfiguration(name, value) {
        this.settings[name] = value;
        const self = this;
        this.entityManager.traverseComponents(Light, function (l) {
            self.applySettingsOne(l);
        });
    }

    applySettingsOne(component) {
        /**
         *
         * @type {THREE.Light}
         */
        const l = component.__threeObject;

        if (l.shadow !== undefined) {
            l.shadow.mapSize.width = l.shadow.mapSize.height = parseInt(this.settings.shadowResolution);
            //destroy old map
            if (l.shadow.map !== null) {
                l.shadow.map.dispose(); // important
                l.shadow.map = null;
            }
        }
    }

    /**
     *
     * @param {Light} light
     * @param {Transform} transform
     * @param entityId
     */
    link(light, transform, entityId) {
        const scene = this.scene;

        /**
         *
         * @returns {THREE.Light|null}
         */
        function getLight() {
            const threeObject = light.__threeObject;

            return threeObject;
        }

        function applyTransformRotation() {
            applyRotation(light, transform.rotation);
        }

        function applyTransformPosition(x, y, z) {
            const p = getLight().position;
            if (p.x !== x || p.y !== y || p.z !== z) {
                p.set(x, y, z);

                applyTransformRotation();
            }
        }

        function handleIntensityChange(v) {
            getLight().intensity = v;
        }

        function handleColorChange(r, g, b) {
            getLight().color.setRGB(r, g, b);
        }

        function handleDistanceChange(v) {
            if (light.type.getValue() === Light.Type.POINT) {
                getLight().distance = v;
            }
        }

        function handleAngleChange(v) {
            if (light.type.getValue() === Light.Type.SPOT) {
                getLight().angle = v;
            }
        }

        function handlePenumbraChange(v) {
            if (light.type.getValue() === Light.Type.SPOT) {
                getLight().penumbra = v;
            }
        }

        function handleCastShadowsChange(v) {
            getLight().castShadow = v;

        }

        const p = transform.position;

        const self = this;

        function build() {
            threeEnsureLightObject(light);
            self.applySettingsOne(light);

            scene.add(light.__threeObject);

            applyTransformPosition(p.x, p.y, p.z);
        }

        function rebuild() {
            if (light.__threeObject !== null) {
                scene.remove(light.__threeObject);
                light.__threeObject = null;
            }

            build();
        }

        build();

        const entityBindings = [
            new SignalBinding(transform.position.onChanged, applyTransformPosition),
            new SignalBinding(transform.rotation.onChanged, applyTransformRotation),
            new SignalBinding(light.type.onChanged, rebuild),
            new SignalBinding(light.intensity.onChanged, handleIntensityChange),
            new SignalBinding(light.color.onChanged, handleColorChange),
            new SignalBinding(light.distance.onChanged, handleDistanceChange),
            new SignalBinding(light.angle.onChanged, handleAngleChange),
            new SignalBinding(light.penumbra.onChanged, handlePenumbraChange),
            new SignalBinding(light.castShadow.onChanged, handleCastShadowsChange)
        ];

        entityBindings.forEach(b => b.link());

        this.bindings[entityId] = entityBindings;
    }

    /**
     *
     * @param {Light} light
     * @param {Transform} transform
     * @param entityId
     */
    unlink(light, transform, entityId) {

        const entityBindings = this.bindings[entityId];

        entityBindings.forEach(b => b.unlink());

        delete this.bindings[entityId];

        this.scene.remove(light.__threeObject);
    }

    update(timeDelta) {
        const em = this.entityManager;
        const dataset = em.dataset;

        if (dataset !== null) {
            dataset.traverseComponents(Camera, function (camera, cameraEntity) {

                if (camera.active.getValue()) {
                    updateShadowsForCamera(camera, dataset);

                    //stop further traversal
                    return false;
                }

            });
        }
    }
}


/**
 * @author alteredq 28.1.2012 (three.js)
 * @author Alex Goldring 02.06.2016 (Komrade)
 * @param camera
 * @param light
 */
function updateShadowCamera(camera, light) {

    // Fit shadow camera's ortho frustum to camera frustum
    const shadow = light.shadow;
    if (shadow === undefined) {
        console.error(`Light does not have a shadow`, light);
        return;
    }

    const shadowCamera = shadow.camera;

    const nearZ = -1;
    const farZ = 1;

    FrustumProjector.project(nearZ, farZ, camera, shadowCamera.matrixWorldInverse, function (x0, y0, z0, x1, y1, z1) {
        setShadowCameraDimensionsDiscrete(light.shadow.mapSize, shadowCamera, x0, y0, z0, x1, y1, z1);

        shadowCamera.near = -z1;
        shadowCamera.far = -z0;

        shadowCamera.updateProjectionMatrix();

        light.shadow.bias = -0.005;
    });

}

function setShadowCameraDimensionsDiscrete(mapSize, camera, x0, y0, z0, x1, y1, z1) {
    const dX = x1 - x0;
    const dY = y1 - y0;

    const rX = dX / mapSize.x;
    const rY = dY / mapSize.y;

    //set start coordinate to pixel-snapped position
    const x0_d = x0 - x0 % rX - rX / 2;
    const y0_d = y0 - y0 % rY - rY / 2;

    const x1_d = x0_d + (dX) * ((mapSize.x + 1) / mapSize.x);
    const y1_d = y0_d + (dY) * ((mapSize.y + 1) / mapSize.y);

    camera.left = x0_d;
    camera.right = x1_d;

    camera.bottom = y0_d;
    camera.top = y1_d;
}

/**
 *
 * @param {Camera} camera
 * @param {EntityComponentDataset} dataset
 */
function updateShadowsForCamera(camera, dataset) {
    const c = camera.object;

    dataset.traverseEntities([Light, Transform], function (light, transform, lightEntity) {
        /**
         *
         1) Calculate the 8 corners of the view frustum in world space. This can be done by using the inverse view-projection matrix to transform the 8 corners of the NDC cube (which in OpenGL is [‒1, 1] along each axis).
         2) Transform the frustum corners to a space aligned with the shadow map axes. This would commonly be the directional light object's local space.
         (In fact, steps 1 and 2 can be done in one step by combining the inverse view-projection matrix of the camera with the inverse world matrix of the light.)
         3) Calculate the bounding box of the transformed frustum corners. This will be the view frustum for the shadow map.
         4) Pass the bounding box's extents to glOrtho or similar to set up the orthographic projection matrix for the shadow map.

         There are a couple caveats with this basic approach. First, the Z bounds for the shadow map will be tightly fit around the view frustum, which means that objects outside the view frustum, but between the view frustum and the light, may fall outside the shadow frustum. This could lead to missing shadows. To fix this, depth clamping can be enabled so that objects in front of the shadow frustum will be rendered with clamped Z instead of clipped. Alternatively, the Z-near of the shadow frustum can be pushed out to ensure any possible shadowers are included.

         The bigger issue is that this produces a shadow frustum that continuously changes size and position as the camera moves around. This leads to shadows "swimming", which is a very distracting artifact. In order to fix this, it's common to do the following additional two steps:
         1) Fix the overall size of the frustum based on the longest diagonal of the camera frustum. This ensures that the camera frustum can fit into the shadow frustum in any orientation. Don't allow the shadow frustum to change size as the camera rotates.
         2) Discretize the position of the frustum, based on the size of texels in the shadow map. In other words, if the shadow map is 1024×1024, then you only allow the frustum to move around in discrete steps of 1/1024th of the frustum size. (You also need to increase the size of the frustum by a factor of 1024/1023, to give room for the shadow frustum and view frustum to slip against each other.)

         If you do these, the shadow will remain rock solid in world space as the camera moves around. (It won't remain solid if the camera's FOV, near or far planes are changed, though.)

         As a bonus, if you do all the above, you're well on your way to implementing cascaded shadow maps, which are "just" a set of shadow maps calculated from the view frustum as above, but using different view frustum near and far plane values to place each shadow map.
         */
        const l = light.__threeObject;

        if (l !== null && light.type.getValue() !== Light.Type.AMBIENT) {
            //only non-ambient lights can cast shadow
            if (light.castShadow.getValue()) {

                l.castShadow = true;
                updateShadowCamera(c, l);
            } else {
                l.castShadow = false;
            }
        }

    });
}

export default LightSystem;
