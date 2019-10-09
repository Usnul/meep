/**
 * User: Alex Goldring
 * Date: 12/6/2014
 * Time: 23:08
 */


import { System } from '../System';
import { Animation, AnimationClipFlag } from '../components/Animation';
import Mesh from '../../../graphics/ecs/mesh/Mesh';
import Future, { FutureStates } from '../../../core/process/Future';

import { CameraSystem } from '../../../graphics/ecs/camera/CameraSystem';

import {
    AnimationMixer as ThreeAnimationMixer,
    Group as ThreeGroup,
    LoopOnce as ThreeLoopOnce,
    LoopRepeat as ThreeLoopRepeat,
    Matrix4 as ThreeMatrix4
} from 'three';
import { projectSphere, threeUpdateMatrix } from "../../../graphics/Utils";
import { max3 } from "../../../core/math/MathUtils";
import Vector4 from "../../../core/geom/Vector4";
import { Camera } from "../../../graphics/ecs/camera/Camera";

/**
 *
 * @param {AnimationMixer} mixer
 * @param mesh
 * @param {object<string,Future<AnimationAction>>} actions
 */
function constructActionClips(mixer, mesh, actions) {

    function registerAnimationAction(animation) {
        const clipName = animation.name;
        if (actions.hasOwnProperty(clipName)) {
            //already have such an animation
            //TODO consider different animation sets with same animation names
            return;
        }
        const root = null;
        const action = new Future(function (resolve, reject) {
            const clipAction = mixer.clipAction(animation, root);
            resolve(clipAction);
        });
        actions[clipName] = action;
    }

    const animations = mesh.animations;
    if (animations !== undefined && animations.length > 0) {
        for (let i = 0; i < animations.length; i++) {
            const animation = animations[i];
            registerAnimationAction(animation);
        }
    }
}

function useClip(component, clip, callback) {
    //find clip
    const actionClips = component.actionClips;
    const clipName = clip.name.getValue();
    const actionClip = actionClips[clipName];
    if (actionClip === undefined) {
        //no clip found
        return;
    }
    actionClip.resolve();
    actionClip.then(callback);
}

/**
 *
 * @param component
 * @param {AnimationClip} clip
 */
function startClip(component, clip) {
    /**
     *
     * @param {AnimationAction} clipAction
     */
    function visitClipAction(clipAction) {
        clipAction.repetitions = clip.repeatCount.getValue();
        if (clipAction.repetitions === Number.POSITIVE_INFINITY) {
            clipAction.loop = ThreeLoopRepeat;
        } else {
            clipAction.loop = ThreeLoopOnce;
        }
        clipAction.timeScale = clip.timeScale.getValue();
        clipAction.setEffectiveWeight(clip.weight.getValue());

        clipAction.clampWhenFinished = clip.getFlag(AnimationClipFlag.ClampWhenFinished);

        if (clipAction.repetitions > 0 && !clipAction.isRunning()) {
            clipAction.play();
        }
    }

    useClip(component, clip, visitClipAction);
}

/**
 *
 * @param {Animation} component
 */
function updateAnimationState(component) {
    const clips = component.clips;

    function initAnimationClip(ac) {
        startClip(component, ac);
    }

    clips.forEach(initAnimationClip);
    clips.on.added.add(initAnimationClip);
    clips.on.removed.add(function (ac) {
        useClip(component, ac, function (clipAction) {
            clipAction.stop();
        });
    });
}

/**
 *
 * @param {Animation} component
 * @param {Mesh} model3d
 */
function registerAnimation(component, model3d) {
    if (!model3d.hasMesh()) {
        return;
    }

    let mesh = model3d.mesh;

    while (mesh instanceof ThreeGroup) {
        //unwrap a group to get to the actual mesh
        mesh = mesh.children[0];
    }
    //find animation data
    if (component.mixer === undefined || component.mesh !== mesh) {
        component.mesh = mesh;

        component.mixer = new Future(function (resolve, reject) {
            component.actionClips = {};

            const mixer = new ThreeAnimationMixer(mesh);
            constructActionClips(mixer, mesh, component.actionClips);
            resolve(mixer);
        });
    }

    component.mixer.then(function (mixer) {
        updateAnimationState(component);
    });
}

/**
 *
 * @param {ThreeAnimationMixer} mixer
 * @param {number} timeDelta
 */
export function advanceAnimation(mixer, timeDelta) {
    mixer.update(timeDelta);

    /**
     * get root
     * @type {Object3D}
     */
    const root = mixer.getRoot();

    /**
     * @type {PropertyMixer[]}
     */
    const propertyMixers = mixer._bindings;

    for (let i = 0, l = propertyMixers.length; i < l; i++) {
        const propertyMixer = propertyMixers[i];

        /**
         *
         * @type {PropertyBinding}
         */
        const binding = propertyMixer.binding;

        const targetObject = binding.targetObject;
        threeUpdateMatrix(targetObject);

        targetObject.updateMatrixWorld();
    }

    //update bone matrix hierarchy
    root.updateWorldMatrix(false, true);

}

/**
 * @type {Vector4}
 */
const v4boundingSphere = new Vector4();

class AnimationSystem extends System {
    /**
     *
     * @param {Vector2} viewportSize
     * @constructor
     */
    constructor(viewportSize) {
        super();

        this.componentClass = Animation;
        this.dependencies = [Mesh];

        this.viewportSize = viewportSize;
    }

    /**
     *
     * @param {Animation} component
     * @param mesh
     * @param {int} entity
     */
    link(component, mesh, entity) {
        const em = this.entityManager;

        registerAnimation(component, mesh);

        component.__listenerMeshSet = function (mesh) {
            registerAnimation(component, mesh);
        };

        em.dataset.addEntityEventListener(entity, "model-mesh-set", component.__listenerMeshSet);

    }

    /**
     *
     * @param {Animation} component
     * @param mesh
     * @param {int} entity
     */
    unlink(component, mesh, entity) {
        this.entityManager.dataset.removeEntityEventListener(entity, "model-mesh-set", component.__listenerMeshSet);

        const animation = component.mixer;
        if (animation !== void 0 && animation !== null) {
            animation.then(function (mixer) {
                mixer.stopAllAction();
            });
        }
    }

    /**
     *
     * @param {number} timeDelta
     */
    update(timeDelta) {
        const em = this.entityManager;

        const entityDataset = em.dataset;
        if (entityDataset === null) {
            //no data, nothing to update
            return;
        }

        const meshSystemId = em.getSystemIdByComponentClass(Mesh);

        if (meshSystemId === -1) {
            throw  new Error('Mesh system not found');
        }

        let frustums = [];
        CameraSystem.getActiveFrustums(entityDataset, function (activeFrustums) {
            frustums = activeFrustums;
        });

        let focalLength = 0;
        let projectionMatrix = null;
        entityDataset.traverseComponents(Camera, function (camera) {
            /**
             * @type {THREE.Camera}
             */
            const c = camera.object;

            const matrix = new ThreeMatrix4();

            matrix.getInverse(c.matrixWorld);

            projectionMatrix = matrix;
            focalLength = c.fov / 180; //convert to Radians

            //stop traversal
            return false;
        });

        const viewportSize = this.viewportSize;

        /**
         *
         * @param {Mesh} mesh trhee.js Mesh instance
         * @param {Matrix4} cameraMatrix
         */
        function screenSpaceSize(mesh, cameraMatrix) {
            const source = mesh.boundingSphere;

            if (source === undefined) {
                return 0;
            }


            v4boundingSphere.copy(source);

            const position = mesh.position;
            const scale = mesh.scale;
            const scaleMax = max3(scale.x, scale.y, scale.z);


            v4boundingSphere.multiplyScalar(scaleMax);
            v4boundingSphere.add3(position);

            const area = projectSphere(v4boundingSphere, cameraMatrix, focalLength);
            const inPixels = area * viewportSize.x * viewportSize.y;
            return inPixels;
        }

        /**
         *
         * @param entity
         * @param {Mesh} meshComponent
         * @returns {boolean}
         */
        function shouldEntityBeAnimated(entity, meshComponent) {

            if (meshComponent === undefined) {
                //no mesh component
                return false;
            }

            const mesh = meshComponent.mesh;
            if (mesh === null) {
                //no renderable object
                return false;
            }


            //check the size of the mesh in screen space, culling animation of tiny objects
            const areaInPixel = screenSpaceSize(mesh, projectionMatrix);
            if (areaInPixel < 32) {
                //too tiny
                return false;
            }

            //passed all filters, visible
            return true;
        }

        //advance time for all playing animations
        entityDataset.traverseEntities([Animation], function (animation, entity) {
            if (animation.isPlaying) {
                animation.debtTime += timeDelta;
            }
        });


        /**
         *
         * @type {MeshSystem}
         */
        const meshSystem = em.getSystemByComponentClass(Mesh);

        const animationComponentIndex = entityDataset.computeComponentTypeIndex(Animation);

        //update animations for visible meshes
        meshSystem.bvh.threeTraverseFrustumsIntersections(frustums, function (leaf) {
            const entity = leaf.entity;

            /**
             *
             * @type {Animation}
             */
            const animation = entityDataset.getComponentByIndex(entity, animationComponentIndex);

            if (animation === undefined) {
                //mesh has no animation, skip
                return true;
            }

            /**
             *
             * @type {Mesh}
             */
            const meshComponent = entityDataset.getComponentByIndex(entity, meshSystemId);

            if (animation.mixer !== undefined && animation.isPlaying && shouldEntityBeAnimated(entity, meshComponent)) {

                const dt = animation.debtTime;

                if (dt > 0) {
                    const mixerFuture = animation.mixer;
                    if (mixerFuture.state === FutureStates.RESOLVED) {
                        const mixer = mixerFuture.resolvedValue;

                        animation.debtTime = 0;

                        advanceAnimation(mixer, dt);
                    } else if (mixerFuture.state === FutureStates.INITIAL) {
                        mixerFuture.resolve();
                    }
                }
            }
        });
    }
}


export default AnimationSystem;
