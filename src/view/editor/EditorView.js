/**
 * Created by Alex on 14/01/2017.
 */


import View from "../View";
import dom from "../DOM";

import EntityListView from './ecs/EntityList';
import EntityEditorView from './ecs/EntityEditor';
import ComponentControlFactory from './ecs/ComponentControlFactory';
import VirtualListView from '../ui/common/VirtualListView';
import LabelView from '../ui/common/LabelView';
import ToolView from './tools/ToolView';

import SimpleWindow from '../ui/elements/SimpleWindow';
import ToolSettingsView from "./tools/ToolSettingsView";
import ListView from "../ui/common/ListView.js";
import ProcessView from "./process/ProcessView.js";
import { ProcessState } from "../../model/editor/process/Process.js";
import MeshLibraryView from "./library/MeshLibraryView.js";
import BottomLeftResizeHandleView from "../ui/elements/BottomLeftResizeHandleView.js";
import Vector2 from "../../model/core/geom/Vector2.js";
import Vector3 from "../../model/core/geom/Vector3.js";
import Mesh from "../../model/graphics/ecs/mesh/Mesh.js";
import Transform from "../../model/engine/ecs/components/Transform.js";
import { EventMeshSet } from "../../model/graphics/ecs/mesh/MeshSystem.js";
import SelectionClearAction from "../../model/editor/actions/concrete/SelectionClearAction.js";
import EntityCreateAction from "../../model/editor/actions/concrete/EntityCreateAction.js";
import ComponentAddAction from "../../model/editor/actions/concrete/ComponentAddAction.js";
import SelectionAddAction from "../../model/editor/actions/concrete/SelectionAddAction.js";
import { noop } from "../../model/core/function/Functions.js";
import { obtainTerrain } from "../../model/level/terrain/ecs/Terrain.js";

class ViewManager extends View {
    constructor() {
        super();
        const dRoot = dom('div');
        dRoot.addClass('view-manager');

        this.el = dRoot.el;

        this.storage = [];

        //store parameters of previously opened windows
        this.memory = {};
    }

    add(view, title) {
        const simpleWindow = new SimpleWindow(
            view,
            {
                draggable: true,
                closeable: false,
                resizable: true,
                title: title
            }
        );

        this.storage.push({
            original: view,
            window: simpleWindow
        });

        this.addChild(simpleWindow);

        if (this.memory.hasOwnProperty(title)) {
            const windowParams = this.memory[title];
            view.size.copy(windowParams.size);
            simpleWindow.position.copy(windowParams.position);
        }

        return simpleWindow;
    }

    exists(view) {
        return this.getInternalIndex(view) !== -1;
    }

    getInternalIndex(view) {
        for (let i = 0; i < this.storage.length; i++) {
            const el = this.storage[i];
            if (el.original === view) {
                return i;
            }
        }
        return -1;
    }

    remove(view) {
        //find the window
        const internalIndex = this.getInternalIndex(view);

        if (internalIndex === -1) {
            return false;
        }

        const el = this.storage[internalIndex];
        //cut from internal index
        this.storage.splice(internalIndex, 1);

        const vWindow = el.window;
        this.removeChild(vWindow);

        //remember window parameters
        this.memory[vWindow.title.get()] = {
            position: vWindow.position.clone(),
            size: view.size.clone()
        };

        return true;
    }
}


/**
 *
 * @param {Editor} editor
 */
function prepareMeshLibrary(editor) {
    let resolveEngine;

    const pEngine = new Promise(function (resolve, reject) {
        resolveEngine = resolve;

    });

    /**
     *
     * @type {Promise<GraphicsEngine>}
     */
    const pGraphicsEngine = pEngine.then(function (e) {
        return e.graphics;
    });

    const pRenderer = pGraphicsEngine.then(function (graphicsEngine) {
        return graphicsEngine.graphics;
    });

    const pAssetManager = pEngine.then(e => e.assetManager);

    const meshLibraryView = new MeshLibraryView(
        editor.meshLibrary,
        pAssetManager,
        pRenderer
    );

    function handleDropEvent(event) {
        event.stopPropagation();
        event.preventDefault();

        const dataText = event.dataTransfer.getData('text/json');
        if (dataText === "") {
            //no data
            return;
        }

        const data = JSON.parse(dataText);

        const type = data.type;

        if (type !== "Mesh") {
            //wrong type
            return;
        }

        const url = data.url;

        const engine = editor.engine;
        const graphics = engine.graphics;

        const position = new Vector2(event.clientX, event.clientY);

        graphics.viewport.positionGlobalToLocal(position, position);

        const normalizedPosition = new Vector2();

        //compute world position for drop

        graphics.normalizeViewportPoint(position, normalizedPosition);

        const source = new Vector3();
        const direction = new Vector3();

        graphics.viewportProjectionRay(normalizedPosition.x, normalizedPosition.y, source, direction);

        const entityManager = engine.entityManager;
        const terrain = obtainTerrain(entityManager);

        const worldPosition = new Vector3();

        const mesh = new Mesh();

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const transform = new Transform();

        editor.actions.mark('New Mesh Placed from Library');
        const entityCreateAction = new EntityCreateAction();
        editor.actions.do(entityCreateAction);

        terrain.raycast(source, direction, function (hit, normal, geometry) {
            function handleMeshSetEvent() {
                const bb = mesh.boundingBox;

                const c0 = new Vector3(bb.x0, bb.y0, bb.z0);
                const c1 = new Vector3(bb.x1, bb.y1, bb.z1);

                const diagonal = c0.distanceTo(c1);

                const offset = direction.clone().multiplyScalar(diagonal);

                transform.position.add(offset);

                //remove listener
                entityManager.removeEntityEventListener(entityCreateAction.entity, EventMeshSet, handleMeshSetEvent);
            }

            if (hit !== null) {
                //got a terrain ray hit, set world placement position to that point
                worldPosition.copy(hit);
            } else {
                //set position to the source of the ray pick if there's nothing else available
                worldPosition.copy(source);


                //wait for mesh to load
                entityManager.addEntityEventListener(entityCreateAction.entity, EventMeshSet, handleMeshSetEvent);
            }
        }, noop);

        transform.position.copy(worldPosition);

        mesh.url = url;


        editor.actions
            .do(new ComponentAddAction(entityCreateAction.entity, transform))
            .do(new ComponentAddAction(entityCreateAction.entity, mesh))
            //automatically select newly placed object
            .do(new SelectionClearAction())
            .do(new SelectionAddAction([entityCreateAction.entity]));

    }

    function handleDragOverEvent(event) {
        event.preventDefault();
    }


    meshLibraryView.on.linked.add(function () {
        resolveEngine(editor.engine);

        const viewport = editor.engine.graphics.viewport;

        viewport.el.addEventListener('drop', handleDropEvent);
        viewport.el.addEventListener('dragover', handleDragOverEvent);
    });

    meshLibraryView.on.unlinked.add(function () {
        const viewport = editor.engine.graphics.viewport;

        viewport.el.removeEventListener('drop', handleDropEvent);
        viewport.el.removeEventListener('dragover', handleDragOverEvent);
    });

    meshLibraryView.size.set(400, 400);

    const resizeHandleView = new BottomLeftResizeHandleView(meshLibraryView);
    meshLibraryView.addChild(resizeHandleView);

    return meshLibraryView;
}

class EditorView extends View {
    /**
     *
     * @param {Editor} editor
     * @constructor
     */
    constructor(editor) {
        super(editor);

        const dRoot = dom('div');
        dRoot.addClass('editor-view');

        this.el = dRoot.el;

        /**
         *
         * @type {Editor}
         */
        this.editor = editor;

        /**
         *
         * @type {View|null}
         */
        this.gameView = null;


        const entityListView = new EntityListView(editor);
        this.entityListView = entityListView;

        //entity editor
        const controllerFactory = new ComponentControlFactory();
        const entityEditor = new EntityEditorView(controllerFactory, editor);

        this.entityEditor = entityEditor;

        function inspectEntity(entity) {
            const em = editor.engine.entityManager;
            entityEditor.entityManager.set(em);
            entityEditor.model.set(entity);
        }

        this.bindSignal(editor.selection.on.added, function (entity) {
            if (editor.selection.length === 1) {
                //when first thing is selected - inspect it automatically
                inspectEntity(entity);
            }
        });

        entityListView.on.interaction.add(inspectEntity);
        this.entityListView = entityListView;

        const toolSettings = new ToolSettingsView({});
        this.toolSettings = toolSettings;

        //tool bar
        const toolBar = new ListView(editor.toolEngine.tools, {
            elementFactory: function (tool) {
                const toolView = new ToolView(tool);

                toolView.el.addEventListener('click', function () {
                    editor.toolEngine.activate(tool.name);
                    toolSettings.setTool(tool);
                });

                const activeTool = editor.toolEngine.active;

                function handleActivation() {
                    toolView.el.classList.toggle('active', activeTool.getValue() === tool);
                }

                toolView.on.linked.add(handleActivation);
                toolView.bindSignal(activeTool.onChanged, handleActivation);

                return toolView;
            },
            classList: ['editor-tool-bar']
        });
        this.toolBar = toolBar;

        //tool bar
        const processBar = new ListView(editor.processEngine.processes, {
            elementFactory: function (process) {
                const toolView = new ProcessView(process);
                toolView.el.addEventListener('click', function () {
                    if (process.state.getValue() !== ProcessState.Running) {
                        editor.processEngine.startByName(process.name);
                    } else {
                        editor.processEngine.stopByName(process.name);
                    }
                });

                return toolView;
            },
            classList: ['editor-process-bar']
        });
        this.processBar = processBar;

        //selection list
        const selectionView = new VirtualListView(editor.selection, {
            elementFactory: function (entity) {
                const labelView = new LabelView(entity);
                labelView.el.addEventListener('click', function () {
                    inspectEntity(entity);
                });
                return labelView;
            }
        });

        selectionView.size.set(100, 100);
        this.selectionView = selectionView;

        this.meshLibraryView = prepareMeshLibrary(editor);
        this.meshLibraryView.size.set(340, 200);

        //
        this.bindSignal(this.size.onChanged, this.layout.bind(this));


        this.addChild(this.entityEditor);
        this.addChild(this.entityListView);
        this.addChild(this.toolBar);
        this.addChild(this.processBar);
        this.addChild(this.meshLibraryView);
    }

    layout() {
        const size = this.size;

        this.entityEditor.size.set(200, size.y);
        this.entityEditor.position.set(size.x - this.entityEditor.size.x, 0);

        this.entityListView.size.set(200, size.y);
        this.entityListView.position.set(0, 0);

        if (this.gameView !== null) {
            this.gameView.position.set(this.entityListView.position.x + this.entityListView.size.x, 0);
            this.gameView.size.set(size.x - (this.entityEditor.size.x + this.entityListView.size.x), size.y);

            this.toolBar.size.set(this.gameView.size.x, 36);
            this.toolBar.position.set(this.gameView.position.x + 5, this.gameView.position.y + this.gameView.size.y - (this.toolBar.size.y + 5));

            this.processBar.size.set(this.gameView.size.x, 36);
            this.processBar.position.set(this.toolBar.position.x, 5);

            this.meshLibraryView.position.set(this.gameView.position.x + this.gameView.size.x - (this.meshLibraryView.size.x + 5), 5);
        }
    }

    link() {
        super.link();

        //hijack game view from the engine
        this.gameView = this.editor.engine.gameView;
        this.addChild(this.gameView);

        this.layout();
    }

    unlink() {
        super.unlink();
        if (this.gameView !== null) {
            //release game view
            this.removeChild(this.gameView);
            this.gameView = null;
        }
    }
}


export default EditorView;
