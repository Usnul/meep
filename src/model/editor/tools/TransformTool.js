import { TransformControls } from "../../graphics/three/TransfromControls.js";
import { Camera } from "../../graphics/ecs/camera/Camera.js";

import { Group, Object3D } from 'three';
import { SignalBinding } from "../../core/events/signal/SignalBinding.js";
import Transform from "../../engine/ecs/components/Transform.js";
import Tool from "./engine/Tool.js";
import { KeyCodes } from "../../engine/input/devices/KeyCodes.js";
import TransformModifyAction from "../actions/concrete/TransformModifyAction.js";
import { threeUpdateTransform } from "../../graphics/Utils.js";
import { assert } from "../../core/assert.js";


function TransformContainer(entity) {
    this.entity = entity;

    //create a surrogate object
    this.surrogate = new Object3D();
}

/**
 *
 * @param {Editor} editor
 * @param {Transform} transform
 */
TransformContainer.prototype.link = function (editor, transform) {
    const engine = editor.engine;

    let allowWriteToModel = true;
    let allowWriteToSurrogate = true;

    const activeCamera = editor.cameraEntity.getComponent(Camera);

    this.controls = new TransformControls(activeCamera.object, engine.gameView.el);

    //make controls smaller, this was requested by Joao originally, to match other editors where gizmos are not as large
    this.controls.size = 0.7;


    const surrogate = this.surrogate;

    function patchThreeVector3(vector, target) {
        let x = vector.x;
        let y = vector.y;
        let z = vector.z;
        Object.defineProperties(vector, {
            x: {
                get() {
                    return x;
                },
                set(v) {
                    x = v;

                    if (allowWriteToModel) {
                        allowWriteToSurrogate = false;
                        target.setX(v);
                        allowWriteToSurrogate = true;
                    }
                }
            },
            y: {
                get() {
                    return y;
                },
                set(v) {
                    y = v;

                    if (allowWriteToModel) {
                        allowWriteToSurrogate = false;
                        target.setY(v);
                        allowWriteToSurrogate = true;
                    }
                }
            },
            z: {
                get() {
                    return z;
                },
                set(v) {
                    z = v;

                    if (allowWriteToModel) {
                        allowWriteToSurrogate = false;
                        target.setZ(v);
                        allowWriteToSurrogate = true;
                    }
                }
            }
        });
    }

    patchThreeVector3(surrogate.position, transform.position);

    patchThreeVector3(surrogate.scale, transform.scale);

    assert.typeOf(surrogate.rotation._onChange, 'function', 'rotation._onChange');

    surrogate.rotation._onChange(function () {
        if (!allowWriteToModel) {
            return;
        }

        allowWriteToSurrogate = false;

        try {
            transform.rotation.__setFromEuler(surrogate.rotation.x, surrogate.rotation.y, surrogate.rotation.z, 'XYZ');
        } catch (e) {
            console.error(e);
        }

        allowWriteToSurrogate = true;
    });

    assert.typeOf(surrogate.quaternion._onChange, 'function', 'quaternion._onChange');

    surrogate.quaternion._onChange(function () {
        if (!allowWriteToModel) {
            return;
        }

        allowWriteToSurrogate = false;

        try {
            transform.rotation.copy(surrogate.quaternion);
        } catch (e) {
            console.error(e);
        }

        allowWriteToSurrogate = true;
    });

    //set surrogate transform to match component
    surrogate.position.copy(transform.position);
    transform.rotation.__setThreeEuler(surrogate.rotation);
    surrogate.quaternion.copy(transform.rotation);
    surrogate.scale.copy(transform.scale);

    this.bindings = [
        new SignalBinding(transform.position.onChanged, function (x, y, z) {
            allowWriteToModel = false;

            if (allowWriteToSurrogate) {
                surrogate.position.set(x, y, z);
            }

            allowWriteToModel = true;
        }),
        new SignalBinding(transform.scale.onChanged, function (x, y, z) {
            allowWriteToModel = false;

            if (allowWriteToSurrogate) {
                surrogate.scale.set(x, y, z);
            }

            allowWriteToModel = true;
        }),
        new SignalBinding(transform.rotation.onChanged, function () {
            allowWriteToModel = false;

            if (allowWriteToSurrogate) {
                const rotation = transform.rotation;
                rotation.__setThreeEuler(surrogate.rotation);
                surrogate.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
            }

            allowWriteToModel = true;
        }),
    ];

    this.bindings.forEach(function (b) {
        b.link();
    });

    this.controls.attach(surrogate);
};

TransformContainer.prototype.unlink = function () {
    this.bindings.forEach(function (b) {
        b.unlink();
    });

    this.controls.detach();
};

/**
 *
 * @enum {string}
 */
export const TransformerMode = {
    Scale: 'scale',
    Translation: 'translate',
    Rotation: 'rotate'
};

export class TransformTool extends Tool {
    /**
     *
     * @constructor
     */
    constructor() {
        super();
        this.name = "spatial_transform";

        this.mode.set(TransformerMode.Translation);

        /**
         *
         * @type {TransformContainer[]}
         */
        this.surrogates = [];
        this.actions = [];

        /**
         *
         * @type {Group}
         */
        this.editObject = new Group();
    }

    initialize() {
        super.initialize();

        const editor = this.editor;

        const self = this;

        this.mode.onChanged.add(function (mode) {
            self.surrogates.forEach(function (s) {
                s.controls.setMode(mode);
            });
        });

        /**
         *
         * @returns {EntityManager}
         */
        function getEM() {
            return self.editor.engine.entityManager;
        }

        function handleSelectionAdded(entity) {
            const em = getEM();

            const t = em.getComponent(entity, Transform);

            if (t === null) {
                return;
            }

            //create a surrogate object
            const surrogate = new TransformContainer(entity);

            surrogate.link(self.editor, t);
            surrogate.controls.setMode(self.mode.getValue());

            self.editObject.add(surrogate.controls);
            self.editObject.add(surrogate.surrogate);

            self.surrogates[entity] = surrogate;
        }

        function handleSelectionRemoved(entity) {
            const surrogate = self.surrogates[entity];

            if (surrogate === undefined) {
                //no surrogate
                return;
            }

            self.editObject.remove(surrogate.controls);
            self.editObject.remove(surrogate.surrogate);

            surrogate.unlink();
            //cleanup
            surrogate.controls.dispose();

            delete self.surrogates[entity];
        }

        this.bindings = [
            new SignalBinding(editor.selection.on.added, handleSelectionAdded),
            new SignalBinding(editor.selection.on.removed, handleSelectionRemoved)
        ];

        this.handlers = {
            handleSelectionAdded,
            handleSelectionRemoved
        };


        this.surrogates = [];

        this.editor.selection.forEach(this.handlers.handleSelectionAdded);

        this.bindings.forEach(function (b) {
            b.link();
        });

        this.editor.engine.graphics.scene.add(this.editObject);
    }

    shutdown() {
        this.editor.selection.forEach(this.handlers.handleSelectionRemoved);
        this.bindings.forEach(function (b) {
            b.unlink();
        });

        this.editor.engine.graphics.scene.remove(this.editObject);
    }

    update() {
        this.surrogates.forEach(s => {
            threeUpdateTransform(s.controls);
            threeUpdateTransform(s.surrogate);
        });
    }

    start() {

        const self = this;
        this.actions = this.surrogates.map(function (s) {
            const entity = s.entity;

            const t = self.engine.entityManager.getComponent(entity, Transform);

            const action = new TransformModifyAction(entity, null);

            action.oldState = t.clone();

            return action;
        });

    }

    stop() {
        const self = this;
        this.actions.forEach(function (action) {
            const entity = action.entity;

            const t = self.engine.entityManager.getComponent(entity, Transform);

            if (!t.equals(action.oldState)) {
                action.modified = t.clone();

                //restore state before transform. This is a hack, but a functional one
                t.copy(action.oldState);

                const actionProcessor = self.editor.actions;
                actionProcessor.mark('transform modification');
                actionProcessor.do(action);
            }
        });
    }

    /**
     *
     * @param {KeyboardEvent} event
     */
    handleKeyboardEvent(event) {
        const keyCode = event.keyCode;

        if (keyCode === KeyCodes.w) {
            this.mode.set(TransformerMode.Translation);
        } else if (keyCode === KeyCodes.e) {
            this.mode.set(TransformerMode.Rotation);
        } else if (keyCode === KeyCodes.r) {
            this.mode.set(TransformerMode.Scale);
        }
    }
}
