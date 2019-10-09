import { DragEvents } from "../../../../model/engine/input/devices/events/DragEvents.js";
import { MouseEvents } from "../../../../model/engine/input/devices/events/MouseEvents.js";
import { TouchEvents } from "../../../../model/engine/input/devices/events/TouchEvents.js";
import Signal from "../../../../model/core/events/signal/Signal.js";

let idCounter = 0;

/**
 *
 * @enum {number}
 */
export const DraggableElementFlags = {
    BeingDragged: 1
};

export class Draggable {
    /**
     *
     * @param {View} view
     * @param {DropTarget} parent
     * @constructor
     */
    constructor(view, parent) {
        this.id = idCounter++;
        this.view = view;
        this.parent = parent;

        this.on = {
            dragInitialized: new Signal(),
            dragFinalized: new Signal()
        };

        /**
         * Bit Field of {@link DraggableElementFlags}
         * @type {number}
         */
        this.flags = 0;

        const self = this;

        function initializeDrag() {
            if (self.getFlag(DraggableElementFlags.BeingDragged)) {
                //already initialized
                return;
            }

            if (self.parent !== undefined) {
                self.parent.context.initializeDrag(self);
            }

            self.setFlag(DraggableElementFlags.BeingDragged);
            self.on.dragInitialized.dispatch(self);
        }

        function finalizeDrag() {
            if (!self.getFlag(DraggableElementFlags.BeingDragged)) {
                //already finalized
                return;
            }

            if (self.parent !== undefined) {
                self.parent.context.finalizeDrag(self);
            }

            self.clearFlag(DraggableElementFlags.BeingDragged);
            self.on.dragFinalized.dispatch(self);
        }

        this.__eventHandlers = {
            drop: function handleDrag(event) {
                event.stopPropagation();
                event.preventDefault();
                const parent = self.parent;
                if (parent !== undefined) {
                    parent.__eventHandlers.handleDrop(event);
                }

                finalizeDrag();
            },
            dragOver: function handleDragOver(event) {
                event.stopPropagation();
                event.preventDefault();
            },
            dragStart: function (event) {
                event.stopPropagation();
                event.dataTransfer.setData('uuid', self.id);

                initializeDrag();
            },
            dragEnd: function (event) {

                finalizeDrag();
            },
            dragEnter: function (event) {
                //route event to parent
                self.parent.__eventHandlers.handleDragEnter(event);
            },
            dragLeave: function (event) {
                //route event to parent
                self.parent.__eventHandlers.handleDragLeave(event);
            },
            stopPropagation: function (event) {
                event.stopPropagation();
            }
        };
    }

    /**
     *
     * @param {number|DraggableElementFlags} flag
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|DraggableElementFlags} flag
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|DraggableElementFlags} flag
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    link() {
        const el = this.view.el;
        el.setAttribute('draggable', 'true');

        el.addEventListener(DragEvents.DragStart, this.__eventHandlers.dragStart);
        el.addEventListener(DragEvents.DragEnd, this.__eventHandlers.dragEnd);
        //enable drag onto this element, for swap functionality
        el.addEventListener(DragEvents.Drop, this.__eventHandlers.drop);
        el.addEventListener(DragEvents.DragOver, this.__eventHandlers.dragOver);

        el.addEventListener(DragEvents.DragEnter, this.__eventHandlers.dragEnter);
        el.addEventListener(DragEvents.DragLeave, this.__eventHandlers.dragLeave);

        el.addEventListener(MouseEvents.Down, this.__eventHandlers.stopPropagation);
        el.addEventListener(TouchEvents.Start, this.__eventHandlers.stopPropagation);

        el.addEventListener(MouseEvents.Move, this.__eventHandlers.stopPropagation);
        el.addEventListener(TouchEvents.Move, this.__eventHandlers.stopPropagation);
    }

    unlink() {

        const el = this.view.el;
        el.removeEventListener(DragEvents.DragStart, this.__eventHandlers.dragStart);
        el.removeEventListener(DragEvents.DragEnd, this.__eventHandlers.dragEnd);
        //enable drag onto this element, for swap functionality
        el.removeEventListener(DragEvents.Drop, this.__eventHandlers.drop);
        el.removeEventListener(DragEvents.DragOver, this.__eventHandlers.dragOver);

        el.removeEventListener(DragEvents.DragEnter, this.__eventHandlers.dragEnter);
        el.removeEventListener(DragEvents.DragLeave, this.__eventHandlers.dragLeave);

        el.removeEventListener(MouseEvents.Down, this.__eventHandlers.stopPropagation);
        el.removeEventListener(TouchEvents.Start, this.__eventHandlers.stopPropagation);

        el.removeEventListener(MouseEvents.Move, this.__eventHandlers.stopPropagation);
        el.removeEventListener(TouchEvents.Move, this.__eventHandlers.stopPropagation);
    }
}

