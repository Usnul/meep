/**
 * Created by Alex on 09/02/2015.
 */

import { System } from '../System';
import GUIElement from '../components/GUIElement';
import EmptyView from "../../../../view/ui/elements/EmptyView.js";
import domify from "../../../../view/DOM.js";
import View from "../../../../view/View.js";

/**
 * @this {{el:GUIElement, system:GUIElementSystem}}
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

    if (v) {
        system.attachComponent(component);
    } else {
        system.detachComponent(component);
    }
}

class GUIElementSystem extends System {
    /**
     *
     * @param {View} containerView
     * @constructor
     */
    constructor(containerView) {
        if (containerView === undefined) {
            throw  new Error(`mandatory parameter containerView is undefined`);
        }

        if (containerView === null) {
            throw  new Error(`mandatory parameter containerView is null`);
        }

        if (!(containerView instanceof View)) {
            throw new TypeError(`mandatory parameter containerView is not an instance of View`);
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
     */
    attachComponent(component) {

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
     */
    detachComponent(component) {

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
        component.visible.onChanged.add(handleComponentVisibilityChange, {
            el: component,
            system: this
        });

        if (component.visible.getValue()) {
            this.attachComponent(component);
        }
    }

    /**
     *
     * @param {GUIElement} component
     * @param entity
     */
    unlink(component, entity) {
        component.visible.onChanged.remove(handleComponentVisibilityChange);

        if (component.visible.getValue()) {
            this.detachComponent(component);
        }
    }
}

export default GUIElementSystem;
