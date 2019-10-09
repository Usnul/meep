/**
 * Created by Alex on 18/05/2016.
 */
import View from "../../View";
import { AnimationMixer, Group, PCFSoftShadowMap } from 'three';

import Vector2 from '../../../model/core/geom/Vector2';
import { PointerDevice } from '../../../model/engine/input/devices/PointerDevice';

import dom from "../../DOM";
import { WebGLRendererPool } from "../../../model/graphics/render/RendererPool";
import { makeMeshPreviewScene } from "../../../model/graphics/Utils";
import { advanceAnimation } from "../../../model/engine/ecs/systems/AnimationSystem.js";

const mapExtension2Mime = {
    gltf: "model/gltf+json",
    glb: "model/gltf",
    json: "three.js"
};

class MeshPreview extends View {
    /**
     *
     * @param {string} url
     * @param {AssetManager} assetManager
     * @param hooks
     * @param {boolean} [allowRotationY = true]
     * @param {boolean} [allowRotationX = true]
     * @param {string|null} [animation = 'Idle']
     * @constructor
     */
    constructor({
                    url,
                    assetManager,
                    hooks,
                    allowRotationY = true,
                    allowRotationX = true,
                    animation = 'Idle'
                }) {
        super();

        this.renderer = null;
        this.scene = null;
        this.camera = null;


        if (typeof url !== "string") {
            let s;

            try {
                s = JSON.stringify(url);
            } catch (e) {
                s = "$serialization error$";
            }

            throw new Error(`Mesh URL was expected to be a string, instead was ${typeof url}: ${s}`);
        }

        const extension = url.substring(url.lastIndexOf(".") + 1);

        if (extension.length === 0) {
            throw new Error(`No file extension on url '${url}'`);
        }

        if (!mapExtension2Mime.hasOwnProperty(extension)) {
            throw new Error(`No known mime-type for file extension '${extension}'`);
        }

        const mimeType = mapExtension2Mime[extension];


        this.el = dom('div').addClass('ui-mesh-preview').el;

        const size = this.size;

        function addInteraction(el, mesh) {
            const pointer = new PointerDevice(el);
            pointer.start();
            const origin = new Vector2();
            const prevPosition = new Vector2();
            pointer.on.dragStart.add(function (p, event) {
                event.stopPropagation();
                origin.copy(p);
                prevPosition.copy(p);
            });
            pointer.on.drag.add(function (p, o, last, event) {
                event.stopPropagation();
                const delta = p.clone().sub(prevPosition);
                prevPosition.copy(p);
                //
                const PI2 = (2 * Math.PI);
                const angleDelta = new Vector2(PI2, PI2).divide(size).multiply(delta);
                if (allowRotationY !== false) {
                    // noinspection JSSuspiciousNameCombination
                    mesh.rotation.y += angleDelta.x;
                }
                if (allowRotationX !== false) {
                    // noinspection JSSuspiciousNameCombination
                    mesh.rotation.x += angleDelta.y;
                }
            });
        }

        this.__addInteraction = addInteraction;

        const self = this;

        this.pContents = new Promise(function (resolve, reject) {
            assetManager.get(url, mimeType, function (asset) {
                const mesh = asset.create();
                const preview = makeMeshPreviewScene(mesh, size, {
                    x0: 0,
                    y0: 0,
                    x1: 1,
                    y1: 1
                });
                const camera = preview.camera;
                const scene = preview.scene;


                size.onChanged.add(function (x, y) {
                    camera.aspect = x / y;
                    camera.updateProjectionMatrix();
                    if (self.renderer !== null) {
                        self.renderer.setSize(x, y);
                    }
                });


                //wrap mesh so it stays centered relative to bb
                const group = new Group();

                const wrapAll = false;
                if (wrapAll) {
                    const objects = scene.children.slice();
                    scene.children = [];

                    objects.forEach(function (o) {
                        group.add(o);
                    });
                } else {
                    scene.remove(mesh);
                    group.add(mesh);
                }


                scene.add(group);

                self.camera = camera;
                self.scene = scene;


                if (hooks !== undefined) {
                    if (typeof hooks.meshAdded === "function") {
                        hooks.meshAdded(mesh);
                    }
                    if (typeof hooks.sceneConstructed === "function") {
                        hooks.sceneConstructed(scene, mesh, camera, group);
                    }
                }

                mesh.rotation.y = -Math.PI / 6;

                //

                function playAnimation(animationName) {

                    const mixer = new AnimationMixer(mesh);

                    let clipAction = null;

                    const animations = asset.animations;
                    if (animations !== undefined) {
                        self.__animationMixer = mixer;
                        for (let i = 0; i < animations.length; i++) {
                            const animation = animations[i];
                            if (animation.name === animationName) {
                                const root = null;
                                clipAction = mixer.clipAction(animation, root);
                                //bail, correct animation found
                                break;
                            }
                        }
                    }

                    if (clipAction !== null) {
                        clipAction.play();
                    }
                }


                if (animation !== null) {
                    playAnimation(animation);
                }

                resolve({
                    group
                });

            }, function () {
                console.error(arguments);
                reject(arguments);
            });
        });

    }

    link() {
        super.link();

        this.isRendering = true;
        const self = this;

        const size = self.size;

        const renderer = WebGLRendererPool.global.get();
        renderer.gammaOutput = true;
        renderer.gammaFactor = 2.2;
        renderer.setClearColor(0xffffff, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(size.x, size.y);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = PCFSoftShadowMap;

        self.renderer = renderer;

        self.pContents.then(function (contents) {
            if (renderer.domElement !== null) {
                self.__addInteraction(renderer.domElement, contents.group);
            }
        });

        self.el.appendChild(renderer.domElement);

        let t = Date.now();

        function update() {
            const now = Date.now();
            const timeDelta = (now - t) / 1000;
            t = now;

            if (self.isRendering) {
                requestAnimationFrame(update);
                self.render();
                if (self.__animationMixer !== undefined) {
                    advanceAnimation(self.__animationMixer, timeDelta);
                }
            }
        }

        update();
    }

    unlink() {
        super.unlink();

        this.isRendering = false;

        const renderer = this.renderer;
        if (renderer !== null) {
            try {
                this.el.removeChild(renderer.domElement);
            } catch (e) {
                console.error("Failed to remove renderer's dom element", e);
            }
            WebGLRendererPool.global.release(this.renderer);
            this.renderer = null;
        }
    }

    render() {
        if (this.renderer !== null && this.scene !== null && this.camera !== null) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}


export default MeshPreview;
