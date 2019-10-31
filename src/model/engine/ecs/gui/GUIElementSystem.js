/**
 * Created by Alex on 09/02/2015.
 */

import { System } from '../System.js';
import GUIElement, { GUIElementFlag } from './GUIElement.js';
import EmptyView from "../../../../view/ui/elements/EmptyView.js";
import domify from "../../../../view/DOM.js";
import View from "../../../../view/View.js";

/**
 * @this {{el:GUIElement, system:GUIElementSystem, entity: number}}
 * @param {boolean} v
 */
function handleComponentVisibilityChange(v) {
    /**
     * @type {GUIElementSystem}
     */
    const system = this.system;
    /**
     * @type {GUIElement}
     */
    const component = this.el;

    /**
     * @type {number}
     */
    const entity = this.entity;

    if (v) {
        system.attachComponent(component, entity);
    } else {
        system.detachComponent(component, entity);
    }
}

class GUIElementSystem extends System {
    /**
     *
     * @param {View} containerView
     * @param {Engine} engine
     * @constructor
     */
    constructor(containerView, engine) {
        if (containerView === undefined) {
            throw  new Error(`mandatory parameter containerView is undefined`);
        }

        if (containerView === null) {
            throw  new Error(`mandatory parameter containerView is null`);
        }

        if (!(containerView instanceof View)) {
            throw new TypeError(`mandatory parameter containerView is not an instance of View`);
        }

        if (engine === undefined) {
            throw new Error('mandatory parameter engine is undefined');
        }


        super();
        this.containerView = containerView;

        this.view = new EmptyView();

        domify(this.view.el)
            .addClass("gui-system-root")
            .css({
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 100,
                width: "inherit",
                height: "inherit",
                userSelect: "none",
                pointerEvents: "none"
            });

        this.componentClass = GUIElement;

        /**
         * @type {ClassRegistry}
         */
        this.classRegistry = engine.classRegistry;

        /**
         *
         * @type {Engine}
         */
        this.engine = engine;

        /**
         *
         * @type {Object<View>}
         */
        this.groups = {};
    }

    shutdown(em, cmOk, cbFailure) {
        try {
            this.containerView.removeChild(this.view);
            cmOk();
        } catch (e) {
            cbFailure(e);
        }

    }

    startup(em, cbOK, cbFailure) {
        this.entityManager = em;
        try {
            this.containerView.addChild(this.view);
            cbOK();
        } catch (e) {
            cbFailure(e);
        }
    }

    /**
     *
     * @param {GUIElement} component
     * @param {number} entity
     */
    attachComponent(component, entity) {

        //initialize view
        if (component.getFlag(GUIElementFlag.Managed) && !component.getFlag(GUIElementFlag.Initialized)) {
            //managed, but not initialized

            if (component.view.isViewEntity) {
                /**
                 *
                 * @type {ViewEntity}
                 */
                const view = component.view;

                view.initialize(component.parameters, entity, this.entityManager.dataset, this.engine);

                component.setFlag(GUIElementFlag.Initialized);

            } else {
                console.warn(`component.view is not an instance of ViewEntity, cannot initialize`, component.view);
            }

        }

        let parent;

        const componentGroupId = component.group;
        if (componentGroupId !== null) {
            //component specifies a named group

            const group = this.groups[componentGroupId];

            if (group !== undefined) {
                parent = group;
            } else {
                // Group doesn't exist, create it
                parent = new EmptyView({
                    classList: [`gui-element-system-group-${componentGroupId}`]
                });

                this.view.addChild(parent);

                this.groups[componentGroupId] = parent;
            }
        } else {
            parent = this.view;
        }

        parent.addChild(component.view);
    }

    /**
     *
     * @param {GUIElement} component
     * @param {number} entity
     */
    detachComponent(component, entity) {

        const componentGroupId = component.group;

        if (componentGroupId !== null) {
            //component specifies a named group

            const group = this.groups[componentGroupId];

            if (group !== undefined) {
                group.removeChild(component.view);
            } else {
                console.error(`Named group '${componentGroupId}' was not found, failed to detach component properly`, component);
            }
        } else {
            this.view.removeChild(component.view);
        }

    }

    /**
     *
     * @param {GUIElement} component
     * @param entity
     */
    link(component, entity) {
        if (component.view === null) {
            //component view is not initialized

            if (!component.getFlag(GUIElementFlag.Managed)) {
                console.error(`Element for entity '${entity}' does not have a view. Cannot create a view because Element is not Managed`);
            } else {

                /**
                 *
                 * @type {Class<ViewEntity>}
                 */
                const ViewKlass = this.classRegistry.getClass(component.klass);

                if (ViewKlass === undefined) {
                    console.error(`Class '${component.klass}' not found in registry. Failed to instanciate view for entity '${entity}'. Using empty view`);

                    component.view = new EmptyView();
                } else {

                    /**
                     *
                     * @type {ViewEntity}
                     */
                    const view = new ViewKlass();


                    component.view = view;
                }
            }
        }


        if (component.visible.getValue()) {
            this.attachComponent(component, entity);
        }

        component.visible.onChanged.add(handleComponentVisibilityChange, {
            el: component,
            system: this,
            entity
        });
    }

    /**
     *
     * @param {GUIElement} component
     * @param entity
     */
    unlink(component, entity) {
        component.visible.onChanged.remove(handleComponentVisibilityChange);

        if (component.visible.getValue()) {
            this.detachComponent(component, entity);
        }

        if (component.getFlag(GUIElementFlag.Managed) && component.getFlag(GUIElementFlag.Initialized)) {
            //managed and initialized, need to finalize
            component.view.finalize();

            //clear initialization flag
            component.clearFlag(GUIElementFlag.Initialized);
        }
    }
}

export default GUIElementSystem;
