/**
 * Created by Alex on 06/03/2017.
 */

import Signal from "../../../core/events/signal/Signal.js";
import { KeyCodes } from './KeyCodes';

function KeyboardDevice(domElement) {
    this.domElement = domElement;

    this.on = {
        down: new Signal(),
        up: new Signal()
    };

    //initialize separate events for each key
    this.keys = {};

    const codeToKeyNameMap = [];

    for (let keyName in KeyCodes) {

        const keyCode = KeyCodes[keyName];

        codeToKeyNameMap[keyCode] = keyName;

        this.keys[keyName] = {
            down: new Signal(),
            up: new Signal()
        };
    }
    //hook up dispatch handler for individual keys
    const keys = this.keys;

    this.on.up.add(function (event) {
        const keyCode = event.keyCode;
        const keyName = codeToKeyNameMap[keyCode];
        if (keyName !== undefined) {
            keys[keyName].up.dispatch(event);
        }
    });

    this.on.down.add(function (event) {
        const keyCode = event.keyCode;
        const keyName = codeToKeyNameMap[keyCode];
        if (keyName !== undefined) {
            keys[keyName].down.dispatch(event);
        }
    });

    const self = this;

    this.handlerKeyDown = function (event) {
        self.on.down.dispatch(event);
    };
    this.handlerKeyUp = function (event) {
        self.on.up.dispatch(event);
    }
}

KeyboardDevice.prototype.start = function () {
    this.domElement.addEventListener("keydown", this.handlerKeyDown);
    this.domElement.addEventListener("keyup", this.handlerKeyUp);
};

KeyboardDevice.prototype.stop = function () {
    this.domElement.removeEventListener("keydown", this.handlerKeyDown);
    this.domElement.removeEventListener("keyup", this.handlerKeyUp);
};

export default KeyboardDevice;
