/**
 * @copyright Alex Goldring 2019
 * @author Alex Goldring, travnick@gmail.com
 */

import { PointerDevice } from "../input/devices/PointerDevice.js";
import Vector2 from "../../core/geom/Vector2.js";
import { noop } from "../../core/function/Functions.js";

export class DraggableAspect {
    /**
     *
     * @param {EventTarget} el
     * @param {function} [dragStart=noop]
     * @param {function} [drag=noop]
     * @param {function} [dragEnd=noop]
     * @param {boolean} [stopPropagation=true] prevent propagation of pointer events up the DOM tree
     */
    constructor({ el, dragStart = noop, drag = noop, dragEnd = noop, stopPropagation = true }) {
        /**
         *
         * @type {PointerDevice}
         * @readonly
         * @private
         */
        this.pointerLocal = new PointerDevice(el);

        /**
         *
         * @type {PointerDevice}
         * @readonly
         * @private
         */
        const pointerGlobal = this.pointerGlobal = new PointerDevice(window);

        const dragOriginalPosition = new Vector2();

        if (stopPropagation) {
            this.pointerLocal.on.down.add((p, e) => {
                e.stopPropagation();
            });
        }

        this.pointerLocal.on.dragStart.add((position) => {
            dragOriginalPosition.copy(position);
            pointerGlobal.start();

            dragStart(position);

            function stopDrag(position) {
                pointerGlobal.on.up.remove(stopDrag);
                pointerGlobal.stop();

                dragEnd(position, dragOriginalPosition);
            }

            pointerGlobal.on.up.add(stopDrag);
        });

        this.pointerGlobal.on.move.add((position) => {
            drag(position, dragOriginalPosition);
        });
    }

    /**
     *
     * @returns {PointerDevice}
     */
    getPointer() {
        return this.pointerLocal;
    }

    start() {
        this.pointerLocal.start();
    }

    stop() {
        this.pointerLocal.stop();
        this.pointerGlobal.stop();
    }
}
