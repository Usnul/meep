/**
 * User: Alex Goldring
 * Date: 22/6/2014
 * Time: 20:15
 */
import { KeyCodes } from './engine/input/devices/KeyCodes';

const InputEngine = function (pointerContext, keyContext) {
    const keyMap = [];
    const mouseMap = {};

    function obtainBindingByCode(code) {
        let binding;
        if (typeof (code) === "number") {
            if (keyMap[code] === void 0) {
                keyMap[code] = {};
            }
            binding = keyMap[code];
        } else {
            if (mouseMap[code] === void 0) {
                mouseMap[code] = {};
            }
            binding = mouseMap[code];
        }
        return binding;
    }

    this.mapKey = function (keyCode, config) {
        const binding = obtainBindingByCode(keyCode);
        if (config.on) {
            binding.on = config.on;
        }
        if (config.off) {
            binding.off = config.off;
        }
    };
    this.mapKeyBoolean = function (keyName, context, property) {
        const keyCode = KeyCodes[keyName];
        const binding = obtainBindingByCode(keyCode);
        binding.on = function () {
            context[property] = true;
        };
        binding.off = function () {
            context[property] = false;
        };
        return this;
    };
    const keyDownHandler = function (event) {
        const keyCode = event.keyCode;
        //console.log("down", keyCode);
        const binding = keyMap[keyCode];
        if (binding && binding.on) {
            binding.on(event);
        }
    };
    const keyUpHandler = function (event) {
        const keyCode = event.keyCode;
        const binding = keyMap[keyCode];
        if (binding && binding.off) {
            binding.off(event);
        }
    };
    const mouseUpHandler = function (event) {
        const mouse1 = mouseMap.mouse1;
        if (mouse1) {
            mouse1.off(event);
        }
    };
    const mouseDownHandler = function (event) {
        const mouse1 = mouseMap.mouse1;
        if (mouse1) {
            mouse1.on(event);
        }
    };
    keyContext.addEventListener("keydown", keyDownHandler);
    keyContext.addEventListener("keyup", keyUpHandler);
    pointerContext.addEventListener("mousedown", mouseDownHandler);
    pointerContext.addEventListener("mouseup", mouseUpHandler);
    //

};
export default InputEngine;
