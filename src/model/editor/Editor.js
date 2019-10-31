/**
 * Created by Alex on 14/01/2017.
 */


import List from '../core/collection/List';
import ToolEngine from './tools/engine/ToolEngine.js';
import EditorView from '../../view/editor/EditorView';
import ActionProcessor from './actions/ActionProcessor';
import { KeyCodes } from "../engine/input/devices/KeyCodes.js";
import EntityCreateAction from "./actions/concrete/EntityCreateAction.js";
import ComponentAddAction from "./actions/concrete/ComponentAddAction.js";
import SelectionClearAction from "./actions/concrete/SelectionClearAction.js";
import SelectionAddAction from "./actions/concrete/SelectionAddAction.js";
import EntityRemoveAction from "./actions/concrete/EntityRemoveAction.js";
import { SelectionVisualizer } from "./SelectionVisualizer.js";
import { ProcessEngine } from "./process/ProcessEngine.js";
import { ObstacleGridDisplayProcess } from "./process/ObstacleGridDisplayProcess.js";
import { DisableGameUIProcess } from "./process/DisableGameUIProcess.js";
import { MeshLibrary } from "./library/MeshLibrary.js";
import { TransformerMode } from "./tools/TransformTool.js";
import EntityBuilder from "../engine/ecs/EntityBuilder.js";
import { Camera } from "../graphics/ecs/camera/Camera.js";
import EditorEntitySystem from "./ecs/EditorEntitySystem.js";
import EditorEntity from "./ecs/EditorEntity.js";
import TopDownCameraController from "../engine/input/ecs/components/TopDownCameraController.js";
import Transform from "../engine/ecs/components/Transform.js";
import { SymbolicDisplayProcess } from "./process/SymbolicDisplayProcess.js";
import { setCameraControllerFromTransform } from "../engine/input/ecs/systems/TopDownCameraControllerSystem.js";
import { downloadAsFile } from "../core/binary/ByteArrayTools.js";
import BinaryBufferSerialization from "../engine/ecs/storage/BinaryBufferSerializer.js";
import { EncodingBinaryBuffer } from "../core/binary/EncodingBinaryBuffer.js";
import { EntityComponentDataset } from "../engine/ecs/EntityComponentDataset.js";
import { resetMusicTracks } from "../../view/ui/game/options/OptionsView.js";

/**
 *
 * @param {ProcessEngine} processEngine
 */
function initializeProcessEngine(processEngine) {
    processEngine.add(new ObstacleGridDisplayProcess());
    processEngine.add(new DisableGameUIProcess());
    processEngine.add(new SymbolicDisplayProcess());

    processEngine.startByName(ObstacleGridDisplayProcess.Id);
    processEngine.startByName(DisableGameUIProcess.Id);
    processEngine.startByName(SymbolicDisplayProcess.Id);
}

/**
 * @template T
 * @param {T} original
 * @param {EntityManager} em
 * @returns {T}
 */
function cloneComponent(original, em) {
    function newInstance() {
        return new original.constructor();
    }

    const cloneViaMethod = {
        name: 'Clone Method',
        check: function (original) {
            return typeof original.clone === "function";
        },
        execute: function (original) {
            return original.clone();
        }
    };

    const cloneViaSerialization = {
        name: 'Serialization',
        check: function (original) {
            return typeof original.toJSON === "function" && typeof original.fromJSON === "function";
        },
        execute: function (original) {
            //use serialization to create a clone
            const json = original.toJSON();

            const clone = newInstance();

            const system = em.getSystemByComponentClass(original.constructor);

            clone.fromJSON(json, system);

            return clone;
        }
    };
    const cloneViaInstantiate = {
        name: 'New Instance',
        check: function (original) {
            return true;
        },
        execute: function (original) {
            //no clone method, that's a bummer
            const typeName = original.constructor.typeName;

            console.error(`Component '${typeName}' has no 'clone' method, creating a new instance instead..`);

            return newInstance();
        }
    };


    const cloners = [cloneViaMethod, cloneViaSerialization, cloneViaInstantiate];

    for (let i = 0; i < cloners.length; i++) {
        const cloner = cloners[i];
        const applicable = cloner.check(original);

        if (!applicable) {
            continue;
        }

        let clone;
        try {
            clone = cloner.execute(original);
        } catch (e) {
            continue;
        }

        if (original.constructor !== clone.constructor) {
            console.error(`Cloner ${cloner.name} produced instance with different constructor`, 'original=', original, 'clone=', clone);
            continue;
        }

        return clone;
    }

    throw new Error(`Failed to clone, no cloners worked`);
}

/**
 *
 * @param {Editor} editor
 */
function copySelectedEntities(editor) {
    if (editor.selection.isEmpty()) {
        //clear out copy buffer
        editor.copyBuffer = [];
        return;
    }

    /**
     *
     * @type {EntityManager}
     */
    const em = editor.engine.entityManager;

    const ecd = em.dataset;

    editor.copyBuffer = editor.selection.map(function (entity) {
        const components = ecd.getAllComponents(entity);

        //clone all components to preserve their status
        const clonedComponents = [];
        components.forEach(function (c) {
            if (c === undefined) {
                //skip undefined
                return;
            }

            let clone;

            try {
                clone = cloneComponent(c, em);
            } catch (e) {
                console.error(`Failed to clone component, omitting`, c, e);
                return;
            }

            clonedComponents.push(clone);
        });

        return clonedComponents;
    });
}

/**
 *
 * @param {Editor} editor
 */
function pasteEntities(editor) {
    const copyBuffer = editor.copyBuffer;
    if (copyBuffer.length === 0) {
        //copy buffer is empty, nothing to do
        return;
    }

    const actions = editor.actions;

    actions.mark('paste entities');

    const createdEntities = copyBuffer.map(function (components) {
        const entityCreateAction = new EntityCreateAction();

        actions.do(entityCreateAction);

        //clone all components to preserve status of the buffer
        components.forEach(function (c) {
            const clone = cloneComponent(c, editor.engine.entityManager);

            const componentAddAction = new ComponentAddAction(entityCreateAction.entity, clone);

            actions.do(componentAddAction);
        });

        return entityCreateAction.entity;
    });

    //select newly created entities
    actions.do(new SelectionClearAction());
    actions.do(new SelectionAddAction(createdEntities));
}

function buildEditorCamera() {
    const cameraEntity = new EntityBuilder();
    const camera = new Camera();

    camera.projectionType.set(Camera.ProjectionType.Perspective);

    camera.autoClip = true;
    camera.active.set(true);

    cameraEntity.add(camera);

    const topDownCameraController = new TopDownCameraController();
    topDownCameraController.distanceMin = -Infinity;
    topDownCameraController.distanceMax = Infinity;

    cameraEntity.add(topDownCameraController);
    cameraEntity.add(new Transform());

    cameraEntity.add(new EditorEntity());

    return cameraEntity;
}

/**
 *
 * @param {EntityBuilder} cameraEntity
 * @param {EntityComponentDataset} dataset
 * @param {Editor} editor
 */
function activateEditorCamera(cameraEntity, dataset, editor) {

    const camera = cameraEntity.getComponent(Camera);

    let activeCameraEntity = null;

    //find currently active camera
    dataset.traverseEntities([Camera], function (c, entity) {
        if (dataset.getComponent(entity, EditorEntity) !== undefined) {
            return true;
        }

        if (c.active.getValue()) {


            c.active.set(false);

            editor.cleanupTasks.push(function () {
                //remember to restore active camera
                c.active.set(true);
            });

            activeCameraEntity = entity;
        }
    });

    if (activeCameraEntity !== null) {
        /**
         *
         * @type {Transform}
         */
        const acTransform = dataset.getComponent(activeCameraEntity, Transform);

        /**
         *
         * @type {Transform}
         */
        const cameraTransform = cameraEntity.getComponent(Transform);

        if (acTransform !== undefined) {
            cameraTransform.copy(acTransform);
        }

        /**
         *
         * @type {TopDownCameraController}
         */
        const cameraController = cameraEntity.getComponent(TopDownCameraController);

        setCameraControllerFromTransform(cameraTransform, cameraController);
    }

    camera.active.set(true);
}

/**
 *
 * @constructor
 * @property {List.<Number>} selection represents list of currently selected entities
 * @property {List.<Object>} history list of applied actions
 */
function Editor() {
    this.processEngine = new ProcessEngine();
    initializeProcessEngine(this.processEngine);
    this.toolEngine = new ToolEngine();
    this.selection = new List();
    this.actions = new ActionProcessor(this);
    this.selectionVistualizer = new SelectionVisualizer(this);
    this.meshLibrary = new MeshLibrary();

    this.cameraEntity = buildEditorCamera();

    this.editorEntitySystem = new EditorEntitySystem();

    this.view = null;

    this.copyBuffer = [];


    const self = this;

    /**
     *
     * @param keyCode
     * @param {KeyboardEvent} event
     */
    function processCtrlCombinations(keyCode, event) {
        if (keyCode === KeyCodes.z) {
            event.preventDefault();
            event.stopPropagation();

            self.actions.undo();
        } else if (keyCode === KeyCodes.y) {
            event.preventDefault();
            event.stopPropagation();

            self.actions.redo();
        } else if (keyCode === KeyCodes.c) {
            event.preventDefault();
            event.stopPropagation();

            //copy
            copySelectedEntities(self);
        } else if (keyCode === KeyCodes.v) {
            event.preventDefault();
            event.stopPropagation();

            //paste
            pasteEntities(self);
        } else if (keyCode === KeyCodes.s) {
            event.preventDefault();
            event.stopPropagation();

            /**
             *
             * @type {Engine}
             */
            const engine = self.engine;
            const entityManager = engine.entityManager;
            const currentDataset = entityManager.dataset;

            //clone dataset
            const dataset = new EntityComponentDataset();
            dataset.setComponentTypeMap(currentDataset.getComponentTypeMap());
            dataset.maskedCopy(currentDataset, currentDataset.getComponentTypeMap());

            //remove all Editor entities
            dataset.traverseComponents(EditorEntity, function (c, entity) {
                dataset.removeEntity(entity);
            });

            //clone and re-enable the camera
            dataset.traverseComponents(Camera, function (c, entity) {
                const clone = c.clone();
                clone.active.set(true);

                dataset.removeComponentFromEntity(entity, Camera);
                dataset.addComponentToEntity(entity, clone);
            });

            // Set music tracks back to time=0
            resetMusicTracks(dataset);

            const serializer = new BinaryBufferSerialization(engine.serializationRegistry);

            const state = new EncodingBinaryBuffer();

            try {
                serializer.process(state, dataset);
            } catch (e) {
                //failed to serialize game state
                console.error("Failed to serialize game state", e);
            }

            state.trim();

            downloadAsFile(state.data, "level.bin");
        }
    }

    /**
     *
     * @param keyCode
     * @param {KeyboardEvent} event
     */
    function processSingleKey(keyCode, event) {
        if (keyCode === KeyCodes.delete || keyCode === KeyCodes.x) {
            event.preventDefault();
            event.stopPropagation();

            self.actions.mark('delete selected entities');


            const removeActions = self.selection.map(function (entity) {

                return new EntityRemoveAction(entity);
            });

            self.actions.do(new SelectionClearAction());

            removeActions.forEach(function (a) {
                self.actions.do(a);
            });
        } else if (keyCode === KeyCodes.q) {
            let activeTool = self.toolEngine.active.getValue();
            if (activeTool === null || activeTool.name !== "marquee_selection") {
                //activate selection tool
                self.toolEngine.activate("marquee_selection");
            } else {
                //activate transform tool
                self.toolEngine.activate("spatial_transform");
            }
        } else if (keyCode === KeyCodes.g) {
            //activate camera tool
            self.toolEngine.activate("camera_control");
        } else if (keyCode === KeyCodes.d && event.shiftKey) {
            if (!self.selection.isEmpty()) {
                //copy
                copySelectedEntities(self);
                //paste
                pasteEntities(self);
            }
        } else if (keyCode === KeyCodes.w) {
            self.toolEngine.activate("spatial_transform");
            self.toolEngine.active.getValue().mode.set(TransformerMode.Translation);
        } else if (keyCode === KeyCodes.e) {
            self.toolEngine.activate("spatial_transform");
            self.toolEngine.active.getValue().mode.set(TransformerMode.Rotation);
        } else if (keyCode === KeyCodes.r) {
            self.toolEngine.activate("spatial_transform");
            self.toolEngine.active.getValue().mode.set(TransformerMode.Scale);
        }
    }

    function isViewFocused(view) {
        function checkChild(el) {
            if (el === view.el) {
                return true;
            } else {
                const children = el.children;
                const numChildren = children.length;
                for (let i = 0; i < numChildren; i++) {
                    const child = children[i];
                    if (checkChild(child)) {
                        return true;
                    }
                }
            }

            return false;
        }

        return checkChild(document.activeElement);
    }

    /**
     *
     * @param {KeyboardEvent} event
     */
    function handleKeyDownEvent(event) {
        //check that game view has focus
        if (!isViewFocused(self.engine.gameView)) {
            return;
        }

        const keyCode = event.keyCode;
        if (event.ctrlKey) {
            processCtrlCombinations(keyCode, event);
        } else {
            processSingleKey(keyCode, event)
        }

        const activeTool = self.toolEngine.active.getValue();

        if (activeTool !== null && activeTool !== undefined) {
            //pass event to active tool
            activeTool.handleKeyboardEvent(event);
        }
    }

    this.handlers = {
        keyDown: handleKeyDownEvent
    };
}

Editor.prototype.initialize = function () {
    this.toolEngine.initialize();
    this.processEngine.initialize(this);
    this.view = new EditorView(this);

    this.copyBuffer = [];

    this.disabledSystems = [];

    this.lastTool = "marquee_selection";


    this.cleanupTasks = [];
};

/**
 * Attempt to focus camera on the entity
 * @param {int} entity
 */
Editor.prototype.focusEntity = function (entity) {
    const em = this.engine.entityManager;

    //try focus camera on it
    const transform = em.getComponent(entity, em.getComponentClassByName("Transform"));
    if (transform !== null) {

        const TopDownCameraController = em.getComponentClassByName("TopDownCameraController");
        const topDownCameraControllerSystem = em.getSystemByComponentClass(TopDownCameraController);

        em.traverseComponents(TopDownCameraController, function (camera) {
            const target = camera.target;
            target.set(transform.position.x, target.y, transform.position.z);
        });

        let originalValue = topDownCameraControllerSystem.enabled.get();

        if (!originalValue) {
            topDownCameraControllerSystem.enabled.set(true);
        }

        topDownCameraControllerSystem.update(0);
        topDownCameraControllerSystem.enabled.set(originalValue);
    }
};

/**
 *
 * @param {Engine} engine
 */
Editor.prototype.attach = function (engine) {
    const editor = this;
    this.engine = engine;

    //validate selection
    const missingEntities = this.selection.filter(function (entity) {
        return !engine.entityManager.dataset.entityExists(entity);
    });

    //drop missing entities from selection
    this.selection.removeAll(missingEntities);

    //find interaction system and disable it
    this.disableSystem("TopDownCameraController");
    this.disableSystem("InputController");

    //attach EditorEntity system
    engine.entityManager.addSystem(this.editorEntitySystem);

    const dataset = engine.entityManager.dataset;

    const cameraEntity = this.cameraEntity;

    activateEditorCamera(this.cameraEntity, dataset, this);


    cameraEntity.build(dataset);

    this.toolEngine.startup(engine, this);
    this.toolEngine.activate(this.lastTool);

    this.processEngine.startup();

    this.selectionVistualizer.startup();

    //attach view
    engine.viewStack.push(this.view, "Editor");

    //map keys
    window.addEventListener('keydown', this.handlers.keyDown);

};

/**
 *
 * @param {string} name
 */
Editor.prototype.disableSystem = function (name) {
    const entityManager = this.engine.entityManager;
    const componentClass = entityManager.getComponentClassByName(name);

    if (componentClass === null) {
        //doesn't exist, nothing to disable
        return;
    }

    const system = entityManager.getSystemByComponentClass(componentClass);
    const originalState = system.enabled.get();
    system.enabled.set(false);

    //remember disabled system
    this.disabledSystems.push({
        name: name,
        originalState: originalState,
        system: system
    });
};

Editor.prototype.restoreDisableSystem = function () {
    this.disabledSystems.forEach(function (disabledSystem) {
        disabledSystem.system.enabled.set(disabledSystem.originalState);
    });

    this.disabledSystems = [];
};

Editor.prototype.detach = function () {
    this.selectionVistualizer.shutdown();

    this.lastTool = this.toolEngine.active.get().name;

    this.toolEngine.shutdown();

    this.processEngine.shutdown();

    //pop own view from the engine's view stack restoring the original state
    this.engine.viewStack.pop();

    //unmap keys
    window.removeEventListener('keydown', this.handlers.keyDown);

    //enable interactions system if it was disabled
    this.restoreDisableSystem();

    //remove all editor entities
    const dataset = this.engine.entityManager.dataset;
    dataset.traverseComponents(EditorEntity, function (component, entity) {
        dataset.removeEntity(entity);
    });

    //remove system
    this.engine.entityManager.removeSystem(this.editorEntitySystem);


    this.cleanupTasks.forEach(t => t());

    this.cleanupTasks = [];
};

/**
 *
 * @param {int} entity
 * @returns {boolean}
 */
Editor.prototype.isEditorEntity = function (entity) {
    return isEditorOwnedEntity(entity, this.engine.entityManager.dataset);
};

/**
 *
 * @param {int} entity
 * @param {EntityComponentDataset} dataset
 */
function isEditorOwnedEntity(entity, dataset) {
    return dataset.getComponent(entity, EditorEntity) !== undefined;
}

export default Editor;
