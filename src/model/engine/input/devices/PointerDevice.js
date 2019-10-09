/**
 * Created by Alex on 29/01/2015.
 */
import Vector2 from "../../../core/geom/Vector2";
import Signal from "../../../core/events/signal/Signal.js";
import { sign } from "../../../core/math/MathUtils.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { assert } from "../../../core/assert.js";
import { MouseEvents } from "./events/MouseEvents.js";
import { TouchEvents } from "./events/TouchEvents.js";

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
 * @see https://w3c.github.io/uievents/#widl-MouseEvent-buttons
 *
 * @param {Number} value
 * @return {Array.<Boolean>}
 */
export function decodeMouseEventButtons(value) {
    const result = [];
    for (let i = 0; i < 32; i++) {
        const shiftedValue = value >> i;
        if (shiftedValue & 1 !== 0) {
            result[i] = true;
        } else {
            result[i] = false;
        }
    }

    return result;
}

/**
 *
 * @param {TouchList} touchList
 * @param {function(Touch,number)} callback
 */
function forEachTouch(touchList, callback) {
    const length = touchList.length;
    for (let i = 0; i < length; i++) {
        const touch = touchList.item(i);
        callback(touch, i);
    }
}

/**
 *
 * @param {TouchList} touchList
 * @param {Vector2} result
 */
function getTouchCenter(touchList, result) {
    const length = touchList.length;
    let x = 0, y = 0;
    for (let i = 0; i < length; i++) {
        const touch = touchList.item(i);
        x += touch.clientX;
        y += touch.clientY;
    }
    //
    result.set(x / length, y / length);
}

/**
 *
 * @param {Signal} up
 * @param {Signal} down
 * @param {Signal} move
 * @param {number} maxDistance
 * @param {Signal} signal
 */
function observeTap(up, down, move, maxDistance, signal) {

    const origin = new Vector2();

    function handleUp(position, event) {
        up.remove(handleUp);
        move.remove(handleMove);
        signal.dispatch(position, event);
    }

    function handleMove(position, event) {
        if (origin.distanceTo(position) > maxDistance) {
            //we moved too far, abort tap
            move.remove(handleMove);

            up.remove(handleUp);
        }
    }

    function handleDown(position) {
        up.addOne(handleUp);
        //track move
        move.add(handleMove);

        origin.copy(position);
    }

    down.add(handleDown);
}

/**
 *
 * @param {Signal} touchStart
 * @param {Signal} touchEnd
 * @param {Signal} touchMove
 * @param {Signal} pinch
 * @param {Signal} pinchStart
 * @param {Signal} pinchEnd
 */
function observePinch(touchStart, touchEnd, touchMove, pinch, pinchStart, pinchEnd) {
    const center = new Vector2();

    const v2 = new Vector2();

    const pinchBox0 = new Vector2();
    const pinchBox1 = new Vector2();

    let pinchActive = false;
    let touchCount = 0;


    function computeTouchRadius(touchList, pinchDimensions) {
        getTouchCenter(touchList, center);

        const length = touchList.length;

        pinchDimensions.set(0, 0);

        for (let i = 0; i < length; i++) {
            const touch = touchList.item(i);

            readPositionFromMouseEvent(touch, v2);

            v2.sub(center);
            v2.abs();

            pinchDimensions.add(v2);
        }

        return pinchDimensions.multiplyScalar(1 / length);
    }

    function touchRemoved(touch, event) {
        touchCount--;
        if (touchCount < 2 && pinchActive) {
            handlePinchEnd(event);
        }
    }

    function touchAdded(touch, event) {
        touchCount++;
        if (touchCount > 1 && !pinchActive) {
            handlePinchStart(event);
        }
    }

    function handlePinchStart(event) {
        pinchActive = true;

        computeTouchRadius(event.touches, pinchBox0);

        touchMove.add(handleMove);

        pinchStart.dispatch(pinchBox0);
    }

    function handlePinchEnd(event) {
        pinchActive = false;

        touchMove.remove(handleMove);

        pinchEnd.dispatch();
    }

    function handleDown(position, event) {
        forEachTouch(event.changedTouches, function (touch) {
            touchAdded(touch, event);
        });
    }

    function handleUp(position, event) {
        forEachTouch(event.changedTouches, function (touch) {
            touchRemoved(touch, event);
        });
    }

    function handleMove(position, event) {
        computeTouchRadius(event.touches, pinchBox1);
        pinch.dispatch(pinchBox1, pinchBox0);
    }

    touchEnd.add(handleUp);
    touchStart.add(handleDown);
}

/**
 *
 * @param {Signal} up
 * @param {Signal} down
 * @param {Signal} move
 * @param {Signal} dragStart
 * @param {Signal} dragEnd
 * @param {Signal} drag
 */
function observeDrag(up, down, move, dragStart, dragEnd, drag) {
    const origin = new Vector2();

    function noDrag(position) {
        up.remove(noDrag);
        move.remove(handleDragStart);
    }

    function handleDragEnd(position) {
        up.remove(handleDragEnd);
        move.remove(handleDrag);

        dragEnd.dispatch(position);
    }

    function handleDragStart(position, event) {

        move.remove(handleDragStart);
        move.add(handleDrag);

        up.remove(noDrag);
        up.add(handleDragEnd);

        lastDragPosition.copy(origin);
        dragStart.dispatch(origin, event);
        handleDrag(position, event);
    }

    const lastDragPosition = new Vector2();

    function handleDrag(position, event) {
        drag.dispatch(position, origin, lastDragPosition, event);
        lastDragPosition.copy(position);
    }

    function handleDown(position) {
        origin.copy(position);
        up.add(noDrag);
        move.add(handleDragStart);
    }

    down.add(handleDown);
}


/**
 *
 * @param {MouseEvent} event
 * @param {Vector2} result
 */
function readPositionFromMouseEvent(event, result) {
    const x = event.clientX;
    const y = event.clientY;

    result.set(x, y);
}

/**
 *
 * @param {EventTarget} domElement html element
 * @constructor
 */
function PointerDevice(domElement) {
    assert.notEqual(domElement, undefined, 'domElement is undefined');

    /**
     * @private
     * @type {boolean}
     */
    this.isRunning = false;

    const self = this;

    /**
     *
     * @type {EventTarget}
     */
    this.domElement = domElement;

    const position = this.position = new Vector2();

    this.eventHandlerMouseMove = function (event) {
        event.preventDefault();
        readPositionFromMouseEvent(event, position);
        self.on.move.dispatch(position, event);
    };
    this.eventHandlerMouseUp = function (event) {
        readPositionFromMouseEvent(event, position);
        self.on.up.dispatch(position, event);
    };
    this.eventHandlerMouseDown = function (event) {
        readPositionFromMouseEvent(event, position);
        self.on.down.dispatch(position, event);
    };

    const touchStart = new Signal();
    const touchEnd = new Signal();
    const touchMove = new Signal();

    touchStart.add(function (param0, param1, param2) {
        self.on.down.dispatch(param0, param1, param2);
    });

    touchEnd.add(function (param0, param1, param2) {
        self.on.up.dispatch(param0, param1, param2);
    });
    touchMove.add(function (param0, param1, param2) {
        self.on.move.dispatch(param0, param1, param2);
    });

    this.eventHandlerTouchStart = function (event) {
        getTouchCenter(event.touches, position);
        touchStart.dispatch(position, event);
    };

    this.eventHandlerTouchEnd = function (event) {
        getTouchCenter(event.touches, position);
        touchEnd.dispatch(position, event);
    };

    this.eventHandlerTouchMove = function (event) {
        event.preventDefault();

        getTouchCenter(event.touches, position);
        touchMove.dispatch(position, event);
    };

    const globalUp = new Signal();

    this.eventHandlerGlobalTouchEnd = function (event) {
        getTouchCenter(event.touches, position);
        globalUp.dispatch(position, event);
    };

    this.eventHandlerGlobalMouseUp = function (event) {
        readPositionFromMouseEvent(event, position);
        globalUp.dispatch(position, event);
    };

    this.eventHandlerWheel = function (event) {
        event.preventDefault();

        //deltas have inconsistent values across browsers, so we will normalize them

        const x = sign(event.deltaX);
        const y = sign(event.deltaY);
        const z = sign(event.deltaZ);

        const delta = new Vector3(x, y, z);

        readPositionFromMouseEvent(event, position);

        self.on.wheel.dispatch(delta, position, event);
    };


    this.on = {
        down: new Signal(),
        up: new Signal(),
        move: new Signal(),
        tap: new Signal(),
        drag: new Signal(),
        dragStart: new Signal(),
        dragEnd: new Signal(),
        wheel: new Signal(),
        pinch: new Signal(),
        pinchStart: new Signal(),
        pinchEnd: new Signal(),
    };

    //constructed events
    observeTap(this.on.up, this.on.down, this.on.move, 10, this.on.tap);
    observeDrag(globalUp, this.on.down, this.on.move, this.on.dragStart, this.on.dragEnd, this.on.drag);
    observePinch(touchStart, touchEnd, touchMove, this.on.pinch, this.on.pinchStart, this.on.pinchEnd);
}

PointerDevice.prototype.start = function () {
    if (this.isRunning) {
        //already running
        return;
    }

    this.isRunning = true;

    // console.warn("PointerDevice.start");

    const domElement = this.domElement;

    assert.notEqual(domElement, null, 'domElement is null');
    assert.notEqual(domElement, undefined, 'domElement is undefined');

    domElement.addEventListener(MouseEvents.Move, this.eventHandlerMouseMove);
    domElement.addEventListener(MouseEvents.Up, this.eventHandlerMouseUp);
    domElement.addEventListener(MouseEvents.Down, this.eventHandlerMouseDown);

    domElement.addEventListener(TouchEvents.Start, this.eventHandlerTouchStart);
    domElement.addEventListener(TouchEvents.End, this.eventHandlerTouchEnd);
    domElement.addEventListener(TouchEvents.Move, this.eventHandlerTouchMove);

    window.addEventListener(MouseEvents.Up, this.eventHandlerGlobalMouseUp);
    window.addEventListener(TouchEvents.End, this.eventHandlerGlobalTouchEnd);

    /*
    In some cases wheel event gets registered as "passive" by default. This interferes with "preventDefault()"
    see https://www.chromestatus.com/features/6662647093133312
     */
    domElement.addEventListener(MouseEvents.Wheel, this.eventHandlerWheel, { passive: false });
};

PointerDevice.prototype.stop = function () {
    if (!this.isRunning) {
        //not running
        return;
    }

    this.isRunning = false;

    // console.warn("PointerDevice.stop");

    const domElement = this.domElement;

    domElement.removeEventListener(MouseEvents.Move, this.eventHandlerMouseMove);
    domElement.removeEventListener(MouseEvents.Up, this.eventHandlerMouseUp);
    domElement.removeEventListener(MouseEvents.Down, this.eventHandlerMouseDown);

    domElement.removeEventListener(TouchEvents.Start, this.eventHandlerTouchStart);
    domElement.removeEventListener(TouchEvents.End, this.eventHandlerTouchEnd);
    domElement.removeEventListener(TouchEvents.Move, this.eventHandlerTouchMove);

    window.removeEventListener(MouseEvents.Up, this.eventHandlerGlobalMouseUp);
    window.removeEventListener(TouchEvents.End, this.eventHandlerGlobalTouchEnd);

    domElement.removeEventListener(MouseEvents.Wheel, this.eventHandlerWheel);
};

export { PointerDevice };
