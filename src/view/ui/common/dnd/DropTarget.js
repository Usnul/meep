import { returnTrue } from "../../../../model/core/function/Functions.js";
import Signal from "../../../../model/core/events/signal/Signal.js";
import { DragEvents } from "../../../../model/engine/input/devices/events/DragEvents.js";
import { DraggableElementFlags } from "./Draggable.js";
import { SignalBinding } from "../../../../model/core/events/signal/SignalBinding.js";

/**
 *
 * @param {DropTarget} dropTarget
 */
function attachDropValidityIndicators(dropTarget) {
    const current = [];

    const tags = [];

    function update() {
        tags.forEach(t => dropTarget.view.removeClass(t));
        tags.splice(0, tags.length);

        if (current.length === 0) {
            //empty
        } else {
            let someInvalid = false;

            current.forEach(({ draggable }) => {
                if (!dropTarget.validation(draggable)) {
                    someInvalid = true;
                }
            });

            if (!someInvalid) {
                //all valid
                tags.push('drop-target-hover-valid');
            } else {
                //some invalid
                tags.push('drop-target-hover-invalid');
            }
        }

        tags.forEach(t => dropTarget.view.addClass(t));
    }

    dropTarget.on.enter.add(handleDragEnter);

    /**
     *
     * @param {Draggable} d
     */
    function removeDraggable(d) {
        for (let i = 0; i < current.length; i++) {
            const { draggable, bindings } = current[i];

            if (draggable === d) {
                current.splice(i, 1);

                //unlink bindings
                bindings.forEach(b => b.unlink());

                update();

                return true;
            }
        }

        return false;
    }

    /**
     *
     * @param {Draggable} draggable
     */
    function handleDragEnter(draggable) {
        if (draggable.parent === dropTarget) {
            //skip own child
            return;
        }

        const bindings = [
            new SignalBinding(draggable.on.dragFinalized, function () {
                removeDraggable(draggable);
            })
        ];

        bindings.forEach(b => b.link());

        current.push({
            draggable,
            bindings
        });

        update();
    }

    dropTarget.on.exit.add(draggable => {
        removeDraggable(draggable);
    });

    dropTarget.view.on.unlinked.add(() => {
        const clone = current.slice();
        clone.forEach(removeDraggable);
    });
}

export class DropTarget {
    /**
     *
     * @param {View} view
     * @param {*} domain
     * @param {function(Draggable):boolean} [validation]
     * @constructor
     */
    constructor(view, domain, validation = returnTrue) {
        const self = this;

        this.view = view;

        /**
         *
         * @type {function(Draggable): boolean}
         */
        this.validation = validation;

        this.domain = domain;

        /**
         *
         * @type {DragAndDropContext|null}
         */
        this.context = null;

        const signals = this.on = {
            added: new Signal(),
            removed: new Signal(),
            moved: new Signal(),
            /**
             * Draggable enters the target (hover)
             */
            enter: new Signal(),
            /**
             * Draggable exists the target (hover)
             */
            exit: new Signal()
        };

        function computeEventDraggable(event) {
            const uuid = event.dataTransfer.getData('uuid');

            if (uuid === "") {
                //not present, UUID is empty
                console.warn('uuid is empty');
                return null;
            }

            const idNumber = parseInt(uuid);

            return self.context.getElementById(idNumber);

        }

        function handleDrop(event) {
            event.preventDefault();

            const draggable = computeEventDraggable(event);

            if (draggable === null) {
                console.warn('no element was found with this UUID');
                return;
            }

            let canDrop = self.validation(draggable);
            if (!canDrop) {
                console.warn('drop not allowed');
                return;
            }

            if (draggable.parent === self) {
                //no change
                return;
            }

            if (draggable.parent !== null) {
                draggable.parent.on.removed.dispatch(draggable, self.domain);
            }

            signals.added.dispatch(draggable, draggable.parent);
            //set new parent
            draggable.parent = self;

            // draggableView.position.copy(view.position);
        }

        function handleDragOver(event) {
            event.preventDefault();

        }

        /**
         *
         * @param {DragEvent} event
         */
        function handleDragEnter(event) {

            //figure out what is being dragged over
            self.context.elements
                .filter(e => e.getFlag(DraggableElementFlags.BeingDragged))
                .forEach(e => self.on.enter.dispatch(e));
        }

        /**
         *
         * @param {DragEvent} event
         */
        function handleDragLeave(event) {

            self.context.elements
                .filter(e => e.getFlag(DraggableElementFlags.BeingDragged))
                .forEach(e => self.on.exit.dispatch(e));
        }

        this.__eventHandlers = {
            handleDrop,
            handleDragOver,
            handleDragEnter,
            handleDragLeave
        };


        attachDropValidityIndicators(this);
    }

    link() {
        const eventHandlers = this.__eventHandlers;
        const el = this.view.el;

        el.addEventListener(DragEvents.Drop, eventHandlers.handleDrop);
        el.addEventListener(DragEvents.DragOver, eventHandlers.handleDragOver);
        el.addEventListener(DragEvents.DragEnter, eventHandlers.handleDragEnter);
        el.addEventListener(DragEvents.DragLeave, eventHandlers.handleDragLeave);
    }

    unlink() {
        const eventHandlers = this.__eventHandlers;
        const el = this.view.el;

        el.removeEventListener(DragEvents.Drop, eventHandlers.handleDrop);
        el.removeEventListener(DragEvents.DragOver, eventHandlers.handleDragOver);
        el.removeEventListener(DragEvents.DragEnter, eventHandlers.handleDragEnter);
        el.removeEventListener(DragEvents.DragLeave, eventHandlers.handleDragLeave);
    }
}

