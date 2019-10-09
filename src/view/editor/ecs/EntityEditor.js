/**
 * Created by Alex on 15/01/2017.
 */
import View from "../../View";
import dom from "../../DOM";

import List from '../../../model/core/collection/List';
import ObservedValue from '../../../model/core/model/ObservedValue';
import LabelView from '../../ui/common/LabelView';
import ButtonView from '../../ui/elements/button/ButtonView.js';
import DropDownSelectionView from '../../ui/elements/DropDownSelectionView';

import TransformController from './components/TransformController';
import MeshController from './components/MeshController';
import { datify } from "../../ui/controller/dat/DatGuiUtils";
import EmptyView from "../../ui/elements/EmptyView.js";
import ObservedBoolean from "../../../model/core/model/ObservedBoolean.js";
import { EntityManager, EventType } from "../../../model/engine/ecs/EntityManager.js";
import domify from "../../DOM.js";
import Signal from "../../../model/core/events/signal/Signal.js";
import HighlightController from "./components/HighlightController.js";
import GuiControl from "../../ui/controller/controls/GuiControl.js";
import { GridPositionController } from "./components/GridPositionController.js";
import { ParticleEmitterController } from "./components/particles/ParticleEmitterController.js";
import { TerrainController } from "./components/TerrainController.js";
import { TagController } from "./components/TagController.js";
import { FogOfWarRevealerController } from "./components/FogOfWarRevealerController.js";
import { FogOfWarController } from "./components/FogOfWarController.js";
import { PathFollowerController } from "./components/PathFollowerController.js";
import ComponentRemoveAction from "../../../model/editor/actions/concrete/ComponentRemoveAction.js";
import ComponentAddAction from "../../../model/editor/actions/concrete/ComponentAddAction.js";

/**
 *
 * @param {ComponentControlFactory} factory
 * @param {Editor} editor
 */
function prepareComponentFactory(factory, editor) {
    factory
        .register('Transform', () => new TransformController())
        .register('Mesh', () => new MeshController(editor.engine.assetManager))
        .register('GridPosition', () => new GridPositionController())
        .register('Name', datify)
        .register('Tag', () => new TagController())
        .register('HeadsUpDisplay', datify)
        .register('ClingToTerrain', datify)
        .register('Camera', datify)
        .register('Terrain', () => new TerrainController(editor.engine.assetManager))
        .register('TopDownCameraController', datify)
        .register('Light', datify)
        .register('FogOfWar', () => new FogOfWarController(editor.engine.entityManager))
        .register('FogOfWarRevealer', () => new FogOfWarRevealerController())
        .register('PathFollower', () => new PathFollowerController())
        .register('Highlight', () => new HighlightController())
        .register('Blackboard', datify)
        .register('ParticleEmitter', () => {
            const em = editor.engine.entityManager;
            const particleEmitterSystem = em.getSystemByComponentClass(em.getComponentClassByName('ParticleEmitter'));
            return new ParticleEmitterController(particleEmitterSystem);
        });
}

class ComponentControlView extends View {
    /**
     *
     * @param {number} entity
     * @param component
     * @param entityManager
     * @param {ComponentControlFactory} factory
     * @constructor
     */
    constructor(entity, component, entityManager, factory) {
        super();

        this.signal = {
            remove: new Signal()
        };

        const dRoot = dom('div');

        dRoot.addClass('entity-editor-component-control-view');

        this.el = dRoot.el;

        const folded = this.folded = new ObservedBoolean(false);

        const typeName = component.constructor.typeName;

        const vComponentName = new LabelView(typeName);

        const bFold = new ButtonView({
            action: function () {
                folded.invert();
            }
        });

        bFold.el.classList.add('fold-toggle');

        const bRemove = new ButtonView({
            action: function () {
                self.signal.remove.dispatch();
            }
        });

        bRemove.el.classList.add('remove');


        const vTitleBar = new EmptyView();
        domify(vTitleBar.el).addClass('title-bar');

        vTitleBar.addChild(vComponentName);
        vTitleBar.addChild(bFold);
        vTitleBar.addChild(bRemove);

        this.addChild(vTitleBar);

        let vController;

        function buildPlaceholderController(message) {
            const labelView = new LabelView(message);
            labelView.el.classList.add(GuiControl.CSS_CLASS_NAME);
            return labelView;
        }

        //build controller
        if (!factory.exists(typeName)) {
            //no controller factory for this type
            vController = buildPlaceholderController('No Controller Implemented');
            //fold, not useful to display
            this.folded.set(true);
        } else {
            try {
                vController = factory.create(typeName);
                vController.entity = entity;
                vController.entityManager = entityManager;

                vController.model.set(component);
            } catch (e) {
                vController = buildPlaceholderController(`Exception thrown during controller build: ${e}`);
                console.error(e);
            }
        }

        const self = this;

        folded.process(function (v) {

            dRoot.setClass('folded', v);

            if (v) {
                self.removeChild(vController);
            } else {
                self.addChild(vController);
            }
        });
    }
}


class EntityEditor extends View {
    /**
     *
     * @param {ComponentControlFactory} componentControlFactory
     * @param {Editor} editor
     * @constructor
     */
    constructor(componentControlFactory, editor) {

        super(componentControlFactory, editor);


        const dRoot = dom('div');

        dRoot.addClass('entity-editor-view');

        this.el = dRoot.el;
        const self = this;

        this.model = new ObservedValue(null);
        /**
         * @type {ObservedValue<EntityManager>}
         */
        this.entityManager = new ObservedValue(null);
        this.components = new List();

        const vComponentList = new EmptyView({ classList: ['component-list'] });

        prepareComponentFactory(componentControlFactory, editor);

        /**
         *
         * @type {Map<Object, ComponentControlView>}
         */
        this.componentControllers = new Map();

        function addComponent(event) {
            self.components.add(event.instance);
        }

        function removeComponent(event) {
            // console.log('removeComponent.Event',event, self.components);
            self.components.removeOneOf(event.instance);
        }

        function watchEntity(entity) {
            /**
             *
             * @type {EntityManager}
             */
            const entityManager = self.entityManager.get();

            const dataset = entityManager.dataset;

            if (!dataset.entityExists(entity)) {
                //doesn't exist, nothing to do
                return;
            }

            dataset.addEntityEventListener(entity, EventType.ComponentAdded, addComponent);
            dataset.addEntityEventListener(entity, EventType.ComponentRemoved, removeComponent);
            dataset.addEntityEventListener(entity, EventType.EntityRemoved, unwatchEntity);
        }

        function unwatchEntity(entity) {
            /**
             *
             * @type {EntityManager}
             */
            const entityManager = self.entityManager.get();

            const dataset = entityManager.dataset;

            if (!dataset.entityExists(entity)) {
                //doesn't exist, nothing to do
                return;
            }

            dataset.removeEntityEventListener(entity, EventType.ComponentAdded, addComponent);
            dataset.removeEntityEventListener(entity, EventType.ComponentRemoved, removeComponent);
            dataset.removeEntityEventListener(entity, EventType.EntityRemoved, unwatchEntity);
        }

        this.model.onChanged.add(function (entity, oldEntity) {
            if (oldEntity !== undefined && oldEntity !== null) {
                unwatchEntity(oldEntity);
            }
            watchEntity(entity);

            self.components.reset();

            const entityManager = self.entityManager.get();

            /**
             *
             * @type {EntityComponentDataset}
             */
            const dataset = entityManager.dataset;

            const components = dataset.getAllComponents(entity);
            components.forEach(function (c) {
                self.components.add(c);
            });
        });

        this.vLabelEntity = new LabelView(this.model, {
            classList: ['id', 'label']
        });

        this.addChild(vComponentList);

        this.addChild(this.vLabelEntity);


        const unattachedTypes = new List();

        function updateList() {
            /**
             *
             * @type {EntityManager}
             */
            const em = self.entityManager.get();

            //all systems
            const allTypeNames = em.systems.map(s => s.componentClass)
                .map(c => c.typeName)
                .filter(typeName => typeof typeName === "string")
                .sort();

            function has(typeName) {
                let result = false;

                self.components.visitFirstMatch(c => c.constructor.typeName === typeName, () => result = true);

                return result;
            }

            //remove already attached
            const unattachedTypeNames = allTypeNames.filter(typeName => !has(typeName));

            unattachedTypes.reset();
            unattachedTypes.addAll(unattachedTypeNames);
        }

        function handleComponentAdded(component) {
            // console.log("handleComponentAdded",c);
            const Klass = component.constructor;
            if (!self.componentControllers.has(Klass)) {
                /**
                 *
                 * @type {EntityManager}
                 */
                const entityManager = self.entityManager.getValue();

                const entityId = self.model.getValue();

                const controlView = new ComponentControlView(entityId, component, entityManager, componentControlFactory);

                controlView.signal.remove.add(function () {

                    editor.actions.mark('Remove Component');
                    editor.actions.do(new ComponentRemoveAction(entityId, Klass));
                });


                self.componentControllers.set(Klass, controlView);
                vComponentList.addChild(controlView);
            }
            updateList();
        }

        function handleComponentRemoved(c) {
            // console.log("handleComponentRemoved",c);
            const key = c.constructor;
            if (self.componentControllers.has(key)) {
                const controlView = self.componentControllers.get(key);
                self.componentControllers.delete(key);
                vComponentList.removeChild(controlView);
            }
            updateList();
        }

        this.components.on.added.add(handleComponentAdded);
        this.components.on.removed.add(handleComponentRemoved);

        const typeSelection = new DropDownSelectionView(unattachedTypes);
        this.addChild(typeSelection);

        const buttonView = new ButtonView({
            name: "Add",
            action: function () {
                const selectedValue = typeSelection.getSelectedValue();
                const em = self.entityManager.get();
                const ComponentClass = em.getComponentClassByName(selectedValue);
                const component = new ComponentClass();

                const entityIndex = self.model.get();

                editor.actions.mark('Add Component');
                editor.actions.do(new ComponentAddAction(entityIndex, component));
            }
        });

        this.addChild(buttonView);

        this.handlers = {};
    }

    link() {
        super.link()


    }

    unlink() {
        super.unlink();
    }
}


export default EntityEditor;
